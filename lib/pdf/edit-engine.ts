import { rgb } from "pdf-lib";
import { safeLoadPdf, yieldToEventLoop } from "./safe-load";
import { TextBlock } from "./edit-types";
import { getBestMatchingFont } from "./font-matcher";
import { ToolExecutionResult } from "./types";

export interface ApplyEditsOptions {
  fileData: Uint8Array | ArrayBuffer;
  blocks: TextBlock[];
  outputFilename?: string;
  onProgress?: (progress: number, stage: string) => void;
}

/**
 * Exports edited PDF:
 * 1. Covers original text with background-colored rectangle for modified/deleted blocks.
 * 2. Draws replacement or newly added text at identical baseline and position using matched fonts.
 * 3. Keeps all unedited page content streams, images, and vectors completely intact.
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
    (b) => b.isNew || b.isDeleted || b.currentText !== b.originalText
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

    // 1. Cover original text if this was an existing block (edited or deleted)
    if (!block.isNew) {
      const bg = block.bgColor || { r: 1, g: 1, b: 1 };
      // Draw cover rectangle with 1.5pt padding to completely mask original glyphs
      page.drawRectangle({
        x: Math.max(0, block.pdfBounds.x - 1.5),
        y: Math.max(0, block.pdfBounds.y - 1.5),
        width: block.pdfBounds.width + 3,
        height: block.pdfBounds.height + 3,
        color: rgb(bg.r, bg.g, bg.b),
        opacity: 1,
      });
    }

    // 2. Draw new text if not deleted
    if (!block.isDeleted && block.currentText.trim() !== "") {
      const font = await getBestMatchingFont(pdfDoc, {
        fontFamily: block.fontFamily,
        isBold: block.isBold,
        isItalic: block.isItalic,
        textToEncode: block.currentText,
      });

      const textColor = block.color || { r: 0.1, g: 0.1, b: 0.1 };

      try {
        page.drawText(block.currentText, {
          x: block.x,
          y: block.y,
          size: block.fontSize || 12,
          font,
          color: rgb(textColor.r, textColor.g, textColor.b),
        });
      } catch (err) {
        // Safe character fallback: strip unsupported control characters if encode fails
        console.warn("Retrying text draw with sanitized characters:", err);
        const sanitized = block.currentText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
        page.drawText(sanitized, {
          x: block.x,
          y: block.y,
          size: block.fontSize || 12,
          font,
          color: rgb(textColor.r, textColor.g, textColor.b),
        });
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
