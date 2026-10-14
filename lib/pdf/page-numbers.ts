import { rgb, StandardFonts } from "pdf-lib";
import { PdfProcessingOptions, ToolExecutionResult } from "./types";
import { safeLoadPdf, yieldToEventLoop } from "./safe-load";

export type PageNumberPosition =
  "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";

export interface PageNumbersOptions extends PdfProcessingOptions {
  fileData: Uint8Array | ArrayBuffer;
  position?: PageNumberPosition;
  format?: string; // e.g. "Page {n} of {total}" or "{n}"
  startNumber?: number;
  fontSize?: number;
  margin?: number;
  outputFilename?: string;
}

/**
 * Inserts formatted page numbers onto PDF pages client-side.
 */
export async function addPageNumbers(options: PageNumbersOptions): Promise<ToolExecutionResult> {
  const {
    fileData,
    position = "bottom-center",
    format = "Page {n} of {total}",
    startNumber = 1,
    fontSize = 10,
    margin = 30,
    outputFilename = "pdfivo-numbered.pdf",
    onProgress,
  } = options;

  onProgress?.(15, "Loading PDF document...");
  const pdfDoc = await safeLoadPdf(fileData);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const total = pages.length;

  for (let i = 0; i < total; i++) {
    onProgress?.(20 + Math.round(((i + 1) / total) * 65), `Numbering page ${i + 1} of ${total}...`);

    const page = pages[i];
    const { width, height } = page.getSize();
    const currentNum = startNumber + i;

    const label = format
      .replace("{n}", currentNum.toString())
      .replace("{total}", (startNumber + total - 1).toString());

    const textWidth = font.widthOfTextAtSize(label, fontSize);

    let x = (width - textWidth) / 2;
    let y = margin;

    switch (position) {
      case "bottom-left":
        x = margin;
        y = margin;
        break;
      case "bottom-right":
        x = width - textWidth - margin;
        y = margin;
        break;
      case "bottom-center":
        x = (width - textWidth) / 2;
        y = margin;
        break;
      case "top-left":
        x = margin;
        y = height - margin;
        break;
      case "top-right":
        x = width - textWidth - margin;
        y = height - margin;
        break;
      case "top-center":
        x = (width - textWidth) / 2;
        y = height - margin;
        break;
    }

    page.drawText(label, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    await yieldToEventLoop();
  }

  onProgress?.(90, "Saving numbered PDF...");
  const pdfBytes = await pdfDoc.save();
  onProgress?.(100, "Done!");

  return {
    success: true,
    data: pdfBytes,
    filename: outputFilename,
    mimeType: "application/pdf",
  };
}
