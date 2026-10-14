import { PDFDocument } from "pdf-lib";
import { PdfProcessingOptions, ToolExecutionResult } from "./types";
import { safeLoadPdf, yieldToEventLoop } from "./safe-load";

export interface DeletePagesOptions extends PdfProcessingOptions {
  fileData: Uint8Array | ArrayBuffer;
  pageIndicesToDelete: number[]; // 0-indexed page indices
  outputFilename?: string;
}

/**
 * Removes specified pages from a PDF document and exports the remaining pages client-side.
 */
export async function deletePages(options: DeletePagesOptions): Promise<ToolExecutionResult> {
  const {
    fileData,
    pageIndicesToDelete,
    outputFilename = "pdfivo-deleted-pages.pdf",
    onProgress,
  } = options;

  onProgress?.(15, "Loading source document...");
  const sourceDoc = await safeLoadPdf(fileData);
  const totalPages = sourceDoc.getPageCount();

  const toDeleteSet = new Set(pageIndicesToDelete);
  const pagesToKeep: number[] = [];

  for (let i = 0; i < totalPages; i++) {
    if (!toDeleteSet.has(i)) {
      pagesToKeep.push(i);
    }
  }

  if (pagesToKeep.length === 0) {
    throw new Error("Cannot delete all pages. The output document must contain at least one page.");
  }

  onProgress?.(45, `Exporting ${pagesToKeep.length} remaining page(s)...`);
  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(sourceDoc, pagesToKeep);

  for (const page of copiedPages) {
    newDoc.addPage(page);
    await yieldToEventLoop();
  }

  onProgress?.(85, "Saving updated document...");
  const pdfBytes = await newDoc.save();
  onProgress?.(100, "Done!");

  return {
    success: true,
    data: pdfBytes,
    filename: outputFilename,
    mimeType: "application/pdf",
  };
}
