import { degrees } from "pdf-lib";
import { PdfProcessingOptions, ToolExecutionResult } from "./types";
import { safeLoadPdf, yieldToEventLoop } from "./safe-load";

export interface RotatePdfOptions extends PdfProcessingOptions {
  fileData: Uint8Array | ArrayBuffer;
  rotationDegrees: 90 | 180 | 270;
  pages?: number[]; // 1-indexed; if omitted, rotates all pages
  outputFilename?: string;
}

/**
 * Rotates PDF pages clockwise client-side.
 */
export async function rotatePdf(options: RotatePdfOptions): Promise<ToolExecutionResult> {
  const {
    fileData,
    rotationDegrees,
    pages,
    outputFilename = "pdfivo-rotated.pdf",
    onProgress,
  } = options;

  onProgress?.(20, "Loading PDF document...");
  const pdfDoc = await safeLoadPdf(fileData);
  const totalPages = pdfDoc.getPageCount();

  const targetIndices = pages
    ? pages.map((p) => p - 1).filter((idx) => idx >= 0 && idx < totalPages)
    : Array.from({ length: totalPages }, (_, i) => i);

  onProgress?.(50, `Rotating ${targetIndices.length} page(s)...`);
  for (const index of targetIndices) {
    const page = pdfDoc.getPage(index);
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + rotationDegrees) % 360));
    await yieldToEventLoop();
  }

  onProgress?.(80, "Saving rotated document...");
  const pdfBytes = await pdfDoc.save();
  onProgress?.(100, "Done!");

  return {
    success: true,
    data: pdfBytes,
    filename: outputFilename,
    mimeType: "application/pdf",
  };
}
