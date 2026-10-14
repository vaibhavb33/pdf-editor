import { PdfProcessingOptions, ToolExecutionResult } from "./types";
import { safeLoadPdf, yieldToEventLoop } from "./safe-load";

export interface SignaturePlacement {
  pageIndex: number; // 0-indexed
  x: number; // PDF points from bottom-left
  y: number;
  width: number;
  height: number;
}

export interface SignPdfOptions extends PdfProcessingOptions {
  fileData: Uint8Array | ArrayBuffer;
  signatureImageBytes: Uint8Array | ArrayBuffer; // PNG format recommended with transparency
  placements: SignaturePlacement[];
  outputFilename?: string;
}

/**
 * Stamps an electronic signature image onto specified PDF pages client-side.
 */
export async function signPdf(options: SignPdfOptions): Promise<ToolExecutionResult> {
  const {
    fileData,
    signatureImageBytes,
    placements,
    outputFilename = "pdfivo-signed.pdf",
    onProgress,
  } = options;

  onProgress?.(15, "Loading PDF document...");
  const pdfDoc = await safeLoadPdf(fileData);
  const pages = pdfDoc.getPages();

  onProgress?.(35, "Embedding signature...");
  const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

  const total = placements.length;
  for (let i = 0; i < total; i++) {
    const placement = placements[i];
    if (placement.pageIndex < 0 || placement.pageIndex >= pages.length) continue;

    onProgress?.(
      40 + Math.round(((i + 1) / total) * 45),
      `Stamping signature on page ${placement.pageIndex + 1}...`
    );

    const page = pages[placement.pageIndex];
    page.drawImage(signatureImage, {
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
    });
    await yieldToEventLoop();
  }

  onProgress?.(90, "Finalizing signed document...");
  const pdfBytes = await pdfDoc.save();
  onProgress?.(100, "Done!");

  return {
    success: true,
    data: pdfBytes,
    filename: outputFilename,
    mimeType: "application/pdf",
  };
}
