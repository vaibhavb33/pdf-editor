import { PDFDocument, LoadOptions } from "pdf-lib";

/**
 * Yields control back to the browser's microtask / message loop to ensure
 * smooth 60fps animations, responsive buttons, and zero freezing on the main thread.
 */
export async function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Safely loads a PDFDocument with human-readable error messages for corrupt,
 * encrypted, or malformed files.
 */
export async function safeLoadPdf(
  data: Uint8Array | ArrayBuffer,
  options?: LoadOptions,
  filename?: string
): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(data, options);
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const fileLabel = filename ? `"${filename}"` : "The document";

    if (
      errMessage.includes("encrypt") ||
      errMessage.includes("password") ||
      errMessage.includes("Encrypted")
    ) {
      throw new Error(
        `${fileLabel} is encrypted or password-protected. Please unlock it using PDFivo's Unlock tool before processing.`
      );
    }

    if (
      errMessage.includes("corrupt") ||
      errMessage.includes("invalid") ||
      errMessage.includes("PDF header") ||
      errMessage.includes("No PDF header found") ||
      errMessage.includes("Failed to find PDF header") ||
      errMessage.includes("Failed to parse PDF document") ||
      errMessage.includes("EOF")
    ) {
      throw new Error(
        `${fileLabel} appears to be corrupted or is not a valid PDF file. Please check the file and try again.`
      );
    }

    throw new Error(`Failed to load ${fileLabel}: ${errMessage || "Unknown format error"}`);
  }
}
