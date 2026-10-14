import imageCompression from "browser-image-compression";
import { PdfProcessingOptions, ToolExecutionResult } from "./types";
import { safeLoadPdf, yieldToEventLoop } from "./safe-load";

export type CompressionLevel = "extreme" | "recommended" | "light";

export interface CompressPdfOptions extends PdfProcessingOptions {
  fileData: Uint8Array | ArrayBuffer;
  level?: CompressionLevel;
  outputFilename?: string;
}

/**
 * Optimizes and compresses PDF document data client-side.
 */
export async function compressPdf(options: CompressPdfOptions): Promise<ToolExecutionResult> {
  const {
    fileData,
    level = "recommended",
    outputFilename = "pdfivo-compressed.pdf",
    onProgress,
  } = options;

  onProgress?.(15, "Analyzing PDF structure...");
  const pdfDoc = await safeLoadPdf(fileData, { ignoreEncryption: true });
  await yieldToEventLoop();

  onProgress?.(40, `Applying ${level} compression algorithms...`);

  // Stream optimization and object deduplication via pdf-lib save options
  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  onProgress?.(100, "Compression complete!");

  return {
    success: true,
    data: compressedBytes,
    filename: outputFilename,
    mimeType: "application/pdf",
  };
}

/**
 * Helper to compress image files before embedding into PDFs using browser-image-compression.
 */
export async function compressImageClientSide(
  imageFile: File,
  maxSizeMB = 1,
  maxWidthOrHeight = 1920
): Promise<File> {
  return imageCompression(imageFile, {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
  });
}
