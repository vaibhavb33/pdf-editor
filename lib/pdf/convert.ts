import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { PdfProcessingOptions, ToolExecutionResult } from "./types";
import { yieldToEventLoop } from "./safe-load";

export interface ImagesToPdfOptions extends PdfProcessingOptions {
  images: { name: string; data: Uint8Array | ArrayBuffer; type: string }[];
  outputFilename?: string;
  pageSize?: "fit" | "a4" | "letter";
}

/**
 * Converts multiple raster images (JPG, PNG) into a single PDF client-side.
 */
export async function imagesToPdf(options: ImagesToPdfOptions): Promise<ToolExecutionResult> {
  const { images, outputFilename = "pdfivo-converted.pdf", onProgress } = options;

  if (images.length === 0) {
    throw new Error("At least one image is required.");
  }

  onProgress?.(10, "Creating document...");
  const pdfDoc = await PDFDocument.create();

  const total = images.length;
  for (let i = 0; i < total; i++) {
    const img = images[i];
    onProgress?.(10 + Math.round(((i + 0.5) / total) * 75), `Embedding ${img.name}...`);

    let embeddedImage;
    if (img.type.includes("png") || img.name.toLowerCase().endsWith(".png")) {
      embeddedImage = await pdfDoc.embedPng(img.data);
    } else {
      embeddedImage = await pdfDoc.embedJpg(img.data);
    }

    const { width, height } = embeddedImage;
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
    await yieldToEventLoop();
  }

  onProgress?.(90, "Finalizing PDF...");
  const pdfBytes = await pdfDoc.save();
  onProgress?.(100, "Done!");

  return {
    success: true,
    data: pdfBytes,
    filename: outputFilename,
    mimeType: "application/pdf",
  };
}

export interface PdfToImagesOptions extends PdfProcessingOptions {
  pdfData: Uint8Array | ArrayBuffer;
  scale?: number;
  outputFormat?: "image/jpeg" | "image/png";
}

/**
 * Converts PDF pages into images using pdfjs-dist on client-side canvas.
 * Wrapped in dynamic browser execution to ensure clean static export (SSG).
 */
export async function pdfToImages(options: PdfToImagesOptions): Promise<ToolExecutionResult> {
  const { pdfData, scale = 1.5, outputFormat = "image/jpeg", onProgress } = options;

  if (typeof window === "undefined") {
    throw new Error("PDF rendering to image requires a browser environment.");
  }

  onProgress?.(10, "Loading PDF rendering engine...");
  // Dynamic import of pdfjs-dist avoids server-side bundling issues during static export
  const pdfjs = await import("pdfjs-dist");

  // Ensure worker is configured for browser
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  const loadingTask = pdfjs.getDocument({ data: pdfData });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const zip = new JSZip();

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(10 + Math.round((i / numPages) * 75), `Rendering page ${i} of ${numPages}...`);

    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");

    if (!context) continue;

    // Cast context to any to accommodate pdfjs RenderParameters across versions
    await (page.render as (params: unknown) => { promise: Promise<void> })({
      canvasContext: context,
      viewport,
    }).promise;

    const dataUrl = canvas.toDataURL(outputFormat, 0.92);
    const base64Data = dataUrl.split(",")[1];
    const ext = outputFormat === "image/png" ? "png" : "jpg";

    zip.file(`page_${i}.${ext}`, base64Data, { base64: true });
    await yieldToEventLoop();
  }

  onProgress?.(90, "Bundling images into ZIP archive...");
  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  onProgress?.(100, "Done!");

  return {
    success: true,
    data: zipBytes,
    filename: "pdfivo-images.zip",
    mimeType: "application/zip",
  };
}
