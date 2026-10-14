import { rgb, degrees, StandardFonts } from "pdf-lib";
import { PdfProcessingOptions, ToolExecutionResult } from "./types";
import { safeLoadPdf, yieldToEventLoop } from "./safe-load";

export interface WatermarkOptions extends PdfProcessingOptions {
  fileData: Uint8Array | ArrayBuffer;
  text?: string;
  imageBytes?: Uint8Array | ArrayBuffer;
  imageType?: "png" | "jpg";
  fontSize?: number;
  opacity?: number; // 0 to 1
  rotationDegrees?: number; // e.g. 45 for diagonal
  color?: { r: number; g: number; b: number };
  outputFilename?: string;
}

/**
 * Adds custom text or image watermarks across PDF pages client-side.
 */
export async function addWatermark(options: WatermarkOptions): Promise<ToolExecutionResult> {
  const {
    fileData,
    text = "CONFIDENTIAL",
    imageBytes,
    imageType = "png",
    fontSize = 50,
    opacity = 0.3,
    rotationDegrees = 45,
    color = { r: 0.8, g: 0.2, b: 0.2 },
    outputFilename = "pdfivo-watermarked.pdf",
    onProgress,
  } = options;

  onProgress?.(15, "Loading PDF document...");
  const pdfDoc = await safeLoadPdf(fileData);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let embeddedImage;
  if (imageBytes) {
    embeddedImage =
      imageType === "png" ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes);
  }

  const total = pages.length;
  for (let i = 0; i < total; i++) {
    onProgress?.(20 + Math.round(((i + 1) / total) * 65), `Stamping page ${i + 1} of ${total}...`);

    const page = pages[i];
    const { width, height } = page.getSize();

    if (embeddedImage) {
      const imgWidth = Math.min(width * 0.6, embeddedImage.width);
      const imgHeight = (imgWidth / embeddedImage.width) * embeddedImage.height;
      page.drawImage(embeddedImage, {
        x: (width - imgWidth) / 2,
        y: (height - imgHeight) / 2,
        width: imgWidth,
        height: imgHeight,
        opacity,
        rotate: degrees(rotationDegrees),
      });
    } else if (text) {
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      // Centered with diagonal rotation
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: (height - textHeight) / 2,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity,
        rotate: degrees(rotationDegrees),
      });
    }

    await yieldToEventLoop();
  }

  onProgress?.(90, "Saving watermarked PDF...");
  const pdfBytes = await pdfDoc.save();
  onProgress?.(100, "Done!");

  return {
    success: true,
    data: pdfBytes,
    filename: outputFilename,
    mimeType: "application/pdf",
  };
}
