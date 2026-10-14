import { PDFDocument } from "pdf-lib";
import { PdfProcessingOptions, ToolExecutionResult } from "./types";
import { safeLoadPdf, yieldToEventLoop } from "./safe-load";

export interface OrganizePdfOptions extends PdfProcessingOptions {
  fileData: Uint8Array | ArrayBuffer;
  orderedPageIndices: number[]; // 0-indexed new order of pages
  outputFilename?: string;
}

/**
 * Reorders, duplicates, or deletes pages in a PDF document client-side.
 */
export async function organizePdf(options: OrganizePdfOptions): Promise<ToolExecutionResult> {
  const {
    fileData,
    orderedPageIndices,
    outputFilename = "pdfivo-organized.pdf",
    onProgress,
  } = options;

  onProgress?.(15, "Loading source document...");
  const sourcePdf = await safeLoadPdf(fileData);
  const newPdf = await PDFDocument.create();

  onProgress?.(40, "Rearranging pages...");
  const copiedPages = await newPdf.copyPages(sourcePdf, orderedPageIndices);

  for (const page of copiedPages) {
    newPdf.addPage(page);
    await yieldToEventLoop();
  }

  onProgress?.(85, "Saving reorganized document...");
  const pdfBytes = await newPdf.save();
  onProgress?.(100, "Done!");

  return {
    success: true,
    data: pdfBytes,
    filename: outputFilename,
    mimeType: "application/pdf",
  };
}
