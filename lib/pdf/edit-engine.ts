import { rgb, PDFFont, RGB } from "pdf-lib";
import { safeLoadPdf, yieldToEventLoop } from "./safe-load";
import { TextBlock, TextRun } from "./edit-types";
import { getBestMatchingFont, splitTextIntoFontRuns } from "./font-matcher";
import { ToolExecutionResult } from "./types";

export interface ApplyEditsOptions {
  fileData: Uint8Array | ArrayBuffer;
  blocks: TextBlock[];
  outputFilename?: string;
  onProgress?: (progress: number, stage: string) => void;
}

interface ExportWord {
  text: string;
  font: PDFFont;
  fontSize: number;
  color: RGB;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  width: number;
}

interface WrappedLine {
  words: ExportWord[];
  isFirstLineOfParagraph: boolean;
  isLastLineOfParagraph: boolean;
  availableWidth: number;
  totalWordsWidth: number;
}

/**
 * Splits text runs into individual words with exact font, size, and styling.
 */
function prepareWordsFromRuns(
  runs: TextRun[],
  fonts: {
    regular: PDFFont;
    bold: PDFFont;
    italic: PDFFont;
    boldItalic: PDFFont;
  },
  baseColor: RGB
): ExportWord[] {
  const words: ExportWord[] = [];

  for (const run of runs) {
    const runFont =
      run.isBold && run.isItalic
        ? fonts.boldItalic
        : run.isBold
        ? fonts.bold
        : run.isItalic
        ? fonts.italic
        : fonts.regular;

    const runColor = run.color
      ? rgb(run.color.r, run.color.g, run.color.b)
      : baseColor;

    const rawWords = run.text.split(/(\s+)/);

    for (const rw of rawWords) {
      if (!rw) continue;
      let wWidth = run.fontSize * 0.5 * rw.length;
      try {
        wWidth = runFont.widthOfTextAtSize(rw, run.fontSize);
      } catch {
        // fallback estimate
      }

      words.push({
        text: rw,
        font: runFont,
        fontSize: run.fontSize,
        color: runColor,
        isBold: run.isBold,
        isItalic: run.isItalic,
        isUnderline: Boolean(run.isUnderline),
        width: wWidth,
      });
    }
  }

  return words;
}

/**
 * Wraps formatted words into lines respecting column width and first-line indent.
 */
function wrapFormattedWords(
  words: ExportWord[],
  columnWidth: number,
  firstLineIndent: number
): WrappedLine[] {
  const lines: WrappedLine[] = [];
  let currentWords: ExportWord[] = [];
  let currentLineWidth = 0;
  let isFirstLine = true;

  function getAvailableWidth(isFirst: boolean) {
    return isFirst ? Math.max(40, columnWidth - Math.max(0, firstLineIndent)) : columnWidth;
  }

  function flushLine(isLast: boolean) {
    if (currentWords.length === 0) return;
    const avail = getAvailableWidth(isFirstLine);
    let wordsWidth = 0;
    for (const w of currentWords) {
      if (!/^\s+$/.test(w.text)) {
        wordsWidth += w.width;
      }
    }

    lines.push({
      words: [...currentWords],
      isFirstLineOfParagraph: isFirstLine,
      isLastLineOfParagraph: isLast,
      availableWidth: avail,
      totalWordsWidth: wordsWidth,
    });

    currentWords = [];
    currentLineWidth = 0;
    isFirstLine = isLast; // if last, next will be first line of new paragraph
  }

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Explicit paragraph break
    if (word.text.includes("\n")) {
      const parts = word.text.split("\n");
      for (let pIdx = 0; pIdx < parts.length; pIdx++) {
        if (pIdx > 0) {
          flushLine(true);
        }
        if (parts[pIdx]) {
          currentWords.push({
            ...word,
            text: parts[pIdx],
          });
          currentLineWidth += word.width;
        }
      }
      continue;
    }

    const isWhitespace = /^\s+$/.test(word.text);
    const avail = getAvailableWidth(isFirstLine);

    if (currentLineWidth + word.width <= avail || currentWords.length === 0) {
      currentWords.push(word);
      currentLineWidth += word.width;
    } else {
      if (!isWhitespace) {
        flushLine(false);
        currentWords.push(word);
        currentLineWidth = word.width;
      }
    }
  }

  if (currentWords.length > 0) {
    flushLine(true);
  }

  return lines;
}

/**
 * Exports edited PDF:
 * 1. Covers original text with background-colored rectangle for modified/deleted blocks.
 * 2. Draws replacement or newly added text with paragraph wrapping, alignment, and matched fonts.
 * 3. Handles justification by computing exact extra word spacing per line.
 * 4. Handles first-line indents and multi-line runs.
 * 5. Draws underline lines if enabled.
 * 6. Keeps all unedited page content streams, images, and vectors completely intact.
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

    const columnX = block.layout?.columnX ?? block.pdfBounds.x;
    const columnWidth = block.layout?.columnWidth ?? block.pdfBounds.width;
    const firstLineIndent = block.layout?.firstLineIndent ?? 0;
    const textAlign = block.layout?.textAlign ?? block.textAlign ?? "left";
    const lineHeightPt = block.layout?.lineHeight ?? block.fontSize * 1.25;

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
          x: Math.max(0, columnX - 2),
          y: Math.max(0, block.pdfBounds.y - 2),
          width: columnWidth + Math.abs(firstLineIndent) + 4,
          height: block.pdfBounds.height + 4,
          color: bgRgb,
          opacity: 1,
        });
      }
    }

    // 2. Draw new text if not deleted and non-empty
    if (!block.isDeleted && block.currentText.trim() !== "") {
      const regularFont = await getBestMatchingFont(pdfDoc, {
        fontFamily: block.fontFamily,
        fontCategory: block.fontCategory,
        isBold: false,
        isItalic: false,
        textToEncode: block.currentText,
      });

      const boldFont = await getBestMatchingFont(pdfDoc, {
        fontFamily: block.fontFamily,
        fontCategory: block.fontCategory,
        isBold: true,
        isItalic: false,
        textToEncode: block.currentText,
      });

      const italicFont = await getBestMatchingFont(pdfDoc, {
        fontFamily: block.fontFamily,
        fontCategory: block.fontCategory,
        isBold: false,
        isItalic: true,
        textToEncode: block.currentText,
      });

      const boldItalicFont = await getBestMatchingFont(pdfDoc, {
        fontFamily: block.fontFamily,
        fontCategory: block.fontCategory,
        isBold: true,
        isItalic: true,
        textToEncode: block.currentText,
      });

      const textColor = block.color || { r: 0.1, g: 0.1, b: 0.1 };
      const defaultTextRgb = rgb(textColor.r, textColor.g, textColor.b);
      const fontSize = block.fontSize || 12;

      // Construct runs if not present
      const runsToUse: TextRun[] =
        block.runs && block.runs.length > 0
          ? block.runs
          : [
              {
                id: `run_${block.id}`,
                text: block.currentText,
                fontFamily: block.fontFamily,
                fontCategory: block.fontCategory,
                fontSize,
                isBold: block.isBold,
                isItalic: block.isItalic,
                isUnderline: block.isUnderline,
                color: textColor,
              },
            ];

      const fonts = {
        regular: regularFont,
        bold: boldFont,
        italic: italicFont,
        boldItalic: boldItalicFont,
      };

      const words = prepareWordsFromRuns(runsToUse, fonts, defaultTextRgb);
      const spaceWidth = regularFont.widthOfTextAtSize(" ", fontSize);
      const wrappedLines = wrapFormattedWords(words, columnWidth, firstLineIndent);

      // Starting baseline Y
      let currentBaselineY = block.y;
      if (block.originalLines && block.originalLines.length > 0) {
        currentBaselineY = block.originalLines[0].y + block.originalLines[0].height - fontSize;
      }

      for (let lIdx = 0; lIdx < wrappedLines.length; lIdx++) {
        const line = wrappedLines[lIdx];
        const lineWords = line.words.filter((w) => !/^\s+$/.test(w.text));

        if (lineWords.length === 0) {
          currentBaselineY -= lineHeightPt;
          continue;
        }

        // Determine Line Start X
        let lineStartX = columnX;
        if (line.isFirstLineOfParagraph && firstLineIndent !== 0) {
          lineStartX = columnX + firstLineIndent;
        }

        // Total width of all words without spaces
        let wordsOnlyWidth = 0;
        for (const w of lineWords) {
          wordsOnlyWidth += w.width;
        }

        // Extra spacing per word for justification
        let extraSpacingPerWord = 0;
        const slots = lineWords.length - 1;

        if (textAlign === "justify" && !line.isLastLineOfParagraph && slots > 0) {
          const totalNormalSpaces = slots * spaceWidth;
          const remainingSpace = line.availableWidth - (wordsOnlyWidth + totalNormalSpaces);
          // Only stretch if remaining space is reasonable (avoid huge gaps on short lines)
          if (remainingSpace > 0 && remainingSpace <= line.availableWidth * 0.4) {
            extraSpacingPerWord = remainingSpace / slots;
          }
        } else if (textAlign === "center") {
          const totalNormalWidth = wordsOnlyWidth + slots * spaceWidth;
          lineStartX = columnX + Math.max(0, (columnWidth - totalNormalWidth) / 2);
        } else if (textAlign === "right") {
          const totalNormalWidth = wordsOnlyWidth + slots * spaceWidth;
          lineStartX = columnX + Math.max(0, columnWidth - totalNormalWidth);
        }

        // Draw each word on the line
        let currentX = lineStartX;

        for (let wIdx = 0; wIdx < lineWords.length; wIdx++) {
          const word = lineWords[wIdx];

          // Character fallback check
          const fontRuns = await splitTextIntoFontRuns(
            pdfDoc,
            word.font,
            word.text,
            word.isBold
          );

          for (const fr of fontRuns) {
            try {
              page.drawText(fr.text, {
                x: currentX,
                y: currentBaselineY,
                size: word.fontSize,
                font: fr.font,
                color: word.color,
              });
              currentX += fr.font.widthOfTextAtSize(fr.text, word.fontSize);
            } catch {
              const clean = fr.text.replace(/[^\x20-\x7E]/g, "?");
              page.drawText(clean, {
                x: currentX,
                y: currentBaselineY,
                size: word.fontSize,
                font: fr.font,
                color: word.color,
              });
              currentX += fr.font.widthOfTextAtSize(clean, word.fontSize);
            }
          }

          // Advance space to next word
          if (wIdx < lineWords.length - 1) {
            currentX += spaceWidth + extraSpacingPerWord;
          }
        }

        // Draw underline if block or run is underlined
        if (block.isUnderline || lineWords.some((w) => w.isUnderline)) {
          const underlineY = currentBaselineY - 2;
          page.drawLine({
            start: { x: lineStartX, y: underlineY },
            end: { x: currentX, y: underlineY },
            thickness: Math.max(0.75, fontSize * 0.06),
            color: defaultTextRgb,
          });
        }

        currentBaselineY -= lineHeightPt;
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
