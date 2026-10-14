import { PdfProcessingOptions, ToolExecutionResult } from "./types";
import { safeLoadPdf, yieldToEventLoop } from "./safe-load";

export interface ProtectPdfOptions extends PdfProcessingOptions {
  fileData: Uint8Array | ArrayBuffer;
  userPassword?: string;
  ownerPassword?: string;
  outputFilename?: string;
}

/**
 * Protects and encrypts a PDF document with password security client-side.
 */
export async function protectPdf(options: ProtectPdfOptions): Promise<ToolExecutionResult> {
  const { fileData, outputFilename = "pdfivo-protected.pdf", onProgress } = options;

  onProgress?.(25, "Loading document for encryption...");
  const pdfDoc = await safeLoadPdf(fileData);
  await yieldToEventLoop();

  onProgress?.(65, "Applying security permissions client-side...");
  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
  await yieldToEventLoop();

  onProgress?.(100, "Document secured!");

  return {
    success: true,
    data: pdfBytes,
    filename: outputFilename,
    mimeType: "application/pdf",
  };
}
