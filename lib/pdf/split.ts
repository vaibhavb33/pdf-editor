import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { PdfProcessingOptions, ToolExecutionResult } from "./types";
import { safeLoadPdf, yieldToEventLoop } from "./safe-load";

export interface SplitPdfOptions extends PdfProcessingOptions {
  fileData: Uint8Array | ArrayBuffer;
  pageRanges?: number[][]; // 1-indexed ranges e.g. [[1, 2], [3, 4]]
  splitAllPages?: boolean;
  baseFilename?: string;
}

/**
 * Splits a PDF document into multiple files or extracts specific ranges client-side.
 */
export async function splitPdf(options: SplitPdfOptions): Promise<ToolExecutionResult> {
  const {
    fileData,
    pageRanges,
    splitAllPages = false,
    baseFilename = "document",
    onProgress,
  } = options;

  onProgress?.(10, "Loading document...");
  const sourcePdf = await safeLoadPdf(fileData, undefined, `${baseFilename}.pdf`);
  const totalPages = sourcePdf.getPageCount();

  const zip = new JSZip();

  if (splitAllPages) {
    for (let i = 0; i < totalPages; i++) {
      onProgress?.(
        10 + Math.round(((i + 1) / totalPages) * 75),
        `Extracting page ${i + 1} of ${totalPages}...`
      );
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(sourcePdf, [i]);
      newDoc.addPage(copiedPage);
      const pageBytes = await newDoc.save();
      zip.file(`${baseFilename}_page_${i + 1}.pdf`, pageBytes);
      await yieldToEventLoop();
    }
  } else if (pageRanges && pageRanges.length > 0) {
    for (let i = 0; i < pageRanges.length; i++) {
      const range = pageRanges[i];
      const indices = range.map((p) => p - 1).filter((idx) => idx >= 0 && idx < totalPages);

      if (indices.length === 0) continue;

      onProgress?.(
        10 + Math.round(((i + 1) / pageRanges.length) * 75),
        `Creating segment ${i + 1}...`
      );

      const newDoc = await PDFDocument.create();
      const copiedPages = await newDoc.copyPages(sourcePdf, indices);
      for (const page of copiedPages) {
        newDoc.addPage(page);
      }
      const segmentBytes = await newDoc.save();
      zip.file(`${baseFilename}_part_${i + 1}.pdf`, segmentBytes);
      await yieldToEventLoop();
    }
  }

  onProgress?.(90, "Compressing ZIP archive...");
  const zipBlob = await zip.generateAsync({ type: "uint8array" });
  onProgress?.(100, "Done!");

  return {
    success: true,
    data: zipBlob,
    filename: `${baseFilename}-split.zip`,
    mimeType: "application/zip",
  };
}
