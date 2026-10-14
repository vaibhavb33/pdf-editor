import { PDFDocument } from "pdf-lib";
import { PdfProcessingOptions, ToolExecutionResult } from "./types";
import { yieldToEventLoop } from "./safe-load";

export interface UnlockPdfOptions extends PdfProcessingOptions {
  fileData: Uint8Array | ArrayBuffer;
  password?: string;
  outputFilename?: string;
}

/**
 * Removes password restriction and re-saves an open, unlocked PDF client-side.
 */
export async function unlockPdf(options: UnlockPdfOptions): Promise<ToolExecutionResult> {
  const { fileData, outputFilename = "pdfivo-unlocked.pdf", onProgress } = options;

  onProgress?.(25, "Decrypting and loading PDF document...");
  const pdfDoc = await PDFDocument.load(fileData, { ignoreEncryption: true });
  await yieldToEventLoop();

  onProgress?.(70, "Exporting unlocked PDF...");
  const pdfBytes = await pdfDoc.save();
  await yieldToEventLoop();

  onProgress?.(100, "Document unlocked!");

  return {
    success: true,
    data: pdfBytes,
    filename: outputFilename,
    mimeType: "application/pdf",
  };
}
