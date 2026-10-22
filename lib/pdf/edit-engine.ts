import { rgb, PDFFont } from "pdf-lib";
import { safeLoadPdf, yieldToEventLoop } from "./safe-load";
import { TextBlock } from "./edit-types";
import { getBestMatchingFont, splitTextIntoFontRuns } from "./font-matcher";
import { ToolExecutionResult } from "./types";

export interface ApplyEditsOptions {
  fileData: Uint8Array | ArrayBuffer;
  blocks: TextBlock[];
  outputFilename?: string;
  onProgress?: (progress: number, stage: string) => void;
}

/**
 * Wraps paragraph text into lines fitting within maxWidth.
 */
function wrapParagraph(
  text: string,
  maxWidth: number,
  fontSize: number,
  font: PDFFont
): string[] {
  if (!text) return [""];
  const words = text.split(/\s+/);
  if (words.length <= 1) return [text];

  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = `${currentLine} ${word}`;
    let testWidth = fontSize * 0.5 * testLine.length;
    try {
      testWidth = font.widthOfTextAtSize(testLine, fontSize);
    } catch {
      // fallback estimation
    }

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Exports edited PDF:
 * 1. Covers original text with background-colored rectangle for modified/deleted blocks.
 * 2. Draws replacement or newly added text with paragraph wrapping, alignment, and matched fonts.
 * 3. Handles per-character font fallback (e.g. mixed English, Hindi, Gujarati).
 * 4. Draws underline lines if enabled.
 * 5. Keeps all unedited page content streams, images, and vectors completely intact.
 */
export async function applyPdfEdits(options: ApplyEditsOptions): Promise<ToolExecutionResult> {
  const {
    fileData,
    blocks,
    outputFilename = "pdfivo-edited.pdf",
    onProgress,
  } = options;

  onProgress?.(10, "Loading PDF document in memory...");
  const pdfDoc = await safeLoadPdf(fileData);
  const pages = pdfDoc.getPages();

  // Filter modified, new, or deleted blocks
  const affectedBlocks = blocks.filter(
    (b) => b.isNew || b.isDeleted || b.isEdited || b.currentText !== b.originalText
  );

  onProgress?.(25, `Preparing ${affectedBlocks.length} modified text blocks...`);

  const total = affectedBlocks.length;
  for (let i = 0; i < total; i++) {
    const block = affectedBlocks[i];
    if (block.pageIndex < 0 || block.pageIndex >= pages.length) continue;

    onProgress?.(
      30 + Math.round(((i + 1) / total) * 55),
      `Applying edits on page ${block.pageIndex + 1} (${i + 1}/${total})...`
    );

    const page = pages[block.pageIndex];
    const bg = block.bgColor || { r: 1, g: 1, b: 1 };
    const bgRgb = rgb(bg.r, bg.g, bg.b);

    // 1. Cover original text if this was an existing block (edited or deleted)
    if (!block.isNew) {
      if (block.originalLines && block.originalLines.length > 0) {
        for (const line of block.originalLines) {
          page.drawRectangle({
            x: Math.max(0, line.x - 2),
            y: Math.max(0, line.y - 2),
            width: line.width + 4,
            height: line.height + 4,
            color: bgRgb,
            opacity: 1,
          });
        }
      } else {
        page.drawRectangle({
          x: Math.max(0, block.pdfBounds.x - 2),
          y: Math.max(0, block.pdfBounds.y - 2),
          width: block.pdfBounds.width + 4,
          height: block.pdfBounds.height + 4,
          color: bgRgb,
          opacity: 1,
        });
      }
    }

    // 2. Draw new text if not deleted and non-empty
    if (!block.isDeleted && block.currentText.trim() !== "") {
      const primaryFont = await getBestMatchingFont(pdfDoc, {
        fontFamily: block.fontFamily,
        fontCategory: block.fontCategory,
        isBold: block.isBold,
        isItalic: block.isItalic,
        textToEncode: block.currentText,
      });

      const textColor = block.color || { r: 0.1, g: 0.1, b: 0.1 };
      const textRgb = rgb(textColor.r, textColor.g, textColor.b);
      const fontSize = block.fontSize || 12;
      const lineHeightMultiplier = block.lineHeight || 1.25;
      const lineStep = fontSize * lineHeightMultiplier;

      // Split into paragraphs by newline
      const paragraphs = block.currentText.split("\n");
      const wrappedLines: string[] = [];

      for (const para of paragraphs) {
        if (block.isSingleLine && paragraphs.length === 1) {
          wrappedLines.push(para);
        } else {
          wrappedLines.push(
            ...wrapParagraph(para, Math.max(60, block.pdfBounds.width), fontSize, primaryFont)
          );
        }
      }

      // Calculate starting baseline Y
      // If we have original lines, start from top baseline; else from block.y
      let currentBaselineY = block.y;
      if (block.originalLines && block.originalLines.length > 0) {
        // First line's baseline
        currentBaselineY = block.originalLines[0].y + block.originalLines[0].height - fontSize;
      }

      for (let lIdx = 0; lIdx < wrappedLines.length; lIdx++) {
        const lineText = wrappedLines[lIdx];
        if (!lineText) {
          currentBaselineY -= lineStep;
          continue;
        }

        // Split line into encodable font runs for per-character fallback
        const fontRuns = await splitTextIntoFontRuns(
          pdfDoc,
          primaryFont,
          lineText,
          block.isBold
        );

        // Compute total line width
        let totalLineWidth = 0;
        for (const run of fontRuns) {
          try {
            totalLineWidth += run.font.widthOfTextAtSize(run.text, fontSize);
          } catch {
            totalLineWidth += fontSize * 0.5 * run.text.length;
          }
        }

        // Compute start X according to alignment
        let lineStartX = block.pdfBounds.x;
        if (block.textAlign === "center") {
          lineStartX = block.pdfBounds.x + Math.max(0, (block.pdfBounds.width - totalLineWidth) / 2);
        } else if (block.textAlign === "right") {
          lineStartX = block.pdfBounds.x + Math.max(0, block.pdfBounds.width - totalLineWidth);
        }

        // Draw each font run
        let runX = lineStartX;
        for (const run of fontRuns) {
          try {
            page.drawText(run.text, {
              x: runX,
              y: currentBaselineY,
              size: fontSize,
              font: run.font,
              color: textRgb,
            });
            runX += run.font.widthOfTextAtSize(run.text, fontSize);
          } catch {
            // Last resort sanitize
            const clean = run.text.replace(/[^\x20-\x7E]/g, "?");
            page.drawText(clean, {
              x: runX,
              y: currentBaselineY,
              size: fontSize,
              font: run.font,
              color: textRgb,
            });
            runX += run.font.widthOfTextAtSize(clean, fontSize);
          }
        }

        // Draw underline if enabled
        if (block.isUnderline) {
          const underlineY = currentBaselineY - 2;
          page.drawLine({
            start: { x: lineStartX, y: underlineY },
            end: { x: lineStartX + totalLineWidth, y: underlineY },
            thickness: Math.max(0.75, fontSize * 0.06),
            color: textRgb,
          });
        }

        currentBaselineY -= lineStep;
      }
    }

    await yieldToEventLoop();
  }

  onProgress?.(90, "Writing optimized PDF file...");
  const pdfBytes = await pdfDoc.save();
  onProgress?.(100, "Done!");

  return {
    success: true,
    data: pdfBytes,
    filename: outputFilename,
    mimeType: "application/pdf",
  };
}

