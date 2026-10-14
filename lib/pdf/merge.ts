import { PDFDocument } from "pdf-lib";
import { PdfProcessingOptions, ToolExecutionResult } from "./types";
import { safeLoadPdf, yieldToEventLoop } from "./safe-load";

export interface MergePdfOptions extends PdfProcessingOptions {
  files: { name: string; data: Uint8Array | ArrayBuffer }[];
  outputFilename?: string;
}

/**
 * Merges multiple PDF files into a single document client-side.
 */
export async function mergePdf(options: MergePdfOptions): Promise<ToolExecutionResult> {
  const { files, outputFilename = "pdfivo-merged.pdf", onProgress } = options;

  if (files.length === 0) {
    throw new Error("At least one PDF file is required to merge.");
  }

  onProgress?.(10, "Initializing merged document...");
  const mergedPdf = await PDFDocument.create();

  const total = files.length;
  for (let i = 0; i < total; i++) {
    const file = files[i];
    onProgress?.(10 + Math.round(((i + 0.5) / total) * 70), `Copying pages from ${file.name}...`);

    const sourcePdf = await safeLoadPdf(file.data, undefined, file.name);
    const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());

    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }

    await yieldToEventLoop();
  }

  onProgress?.(90, "Saving synthesized PDF...");
  const mergedPdfBytes = await mergedPdf.save();
  onProgress?.(100, "Done!");

  return {
    success: true,
    data: mergedPdfBytes,
    filename: outputFilename,
    mimeType: "application/pdf",
  };
}
