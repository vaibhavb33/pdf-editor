import { rgb, StandardFonts } from "pdf-lib";
import { PdfProcessingOptions, ToolExecutionResult } from "./types";
import { safeLoadPdf, yieldToEventLoop } from "./safe-load";
export { applyPdfEdits } from "./edit-engine";
export type { ApplyEditsOptions } from "./edit-engine";
export * from "./edit-types";

export type AnnotationType = "text" | "rectangle" | "highlight" | "circle" | "image";

export interface AnnotationItem {
  id: string;
  type: AnnotationType;
  pageIndex: number; // 0-indexed
  x: number; // PDF points
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  color?: { r: number; g: number; b: number };
  opacity?: number;
  imageBytes?: Uint8Array | ArrayBuffer;
  imageFormat?: "png" | "jpg";
}

export interface EditPdfOptions extends PdfProcessingOptions {
  fileData: Uint8Array | ArrayBuffer;
  annotations: AnnotationItem[];
  outputFilename?: string;
}

/**
 * Applies text, shapes, highlights, and images onto PDF pages client-side.
 */
export async function editPdf(options: EditPdfOptions): Promise<ToolExecutionResult> {
  const { fileData, annotations, outputFilename = "pdfivo-edited.pdf", onProgress } = options;

  onProgress?.(15, "Loading PDF document...");
  const pdfDoc = await safeLoadPdf(fileData);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const total = annotations.length;
  for (let i = 0; i < total; i++) {
    const item = annotations[i];
    if (item.pageIndex < 0 || item.pageIndex >= pages.length) continue;

    onProgress?.(
      20 + Math.round(((i + 1) / total) * 65),
      `Applying annotation ${i + 1} of ${total}...`
    );

    const page = pages[item.pageIndex];
    const itemColor = item.color || { r: 0, g: 0, b: 0 };
    const pdfColor = rgb(itemColor.r, itemColor.g, itemColor.b);

    switch (item.type) {
      case "text":
        if (item.text) {
          page.drawText(item.text, {
            x: item.x,
            y: item.y,
            size: item.fontSize || 14,
            font,
            color: pdfColor,
            opacity: item.opacity ?? 1,
          });
        }
        break;

      case "highlight":
        // Semi-transparent yellow/custom rectangle
        page.drawRectangle({
          x: item.x,
          y: item.y,
          width: item.width || 120,
          height: item.height || 20,
          color: item.color ? pdfColor : rgb(1, 0.9, 0.2),
          opacity: item.opacity ?? 0.35,
        });
        break;

      case "rectangle":
        page.drawRectangle({
          x: item.x,
          y: item.y,
          width: item.width || 100,
          height: item.height || 60,
          borderColor: pdfColor,
          borderWidth: 2,
          opacity: item.opacity ?? 1,
        });
        break;

      case "circle":
        page.drawCircle({
          x: item.x,
          y: item.y,
          size: (item.width || 40) / 2,
          borderColor: pdfColor,
          borderWidth: 2,
          opacity: item.opacity ?? 1,
        });
        break;

      case "image":
        if (item.imageBytes) {
          const img =
            item.imageFormat === "jpg"
              ? await pdfDoc.embedJpg(item.imageBytes)
              : await pdfDoc.embedPng(item.imageBytes);
          page.drawImage(img, {
            x: item.x,
            y: item.y,
            width: item.width || 100,
            height: item.height || 100,
            opacity: item.opacity ?? 1,
          });
        }
        break;
    }

    await yieldToEventLoop();
  }

  onProgress?.(90, "Saving edited document...");
  const pdfBytes = await pdfDoc.save();
  onProgress?.(100, "Done!");

  return {
    success: true,
    data: pdfBytes,
    filename: outputFilename,
    mimeType: "application/pdf",
  };
}
