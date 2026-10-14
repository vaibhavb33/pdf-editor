/**
 * Renders thumbnail images for PDF pages client-side using pdfjs-dist.
 * Ensures the main UI thread never freezes by yielding between page renders.
 */
export interface PageThumbnail {
  pageIndex: number;
  dataUrl: string;
  width: number;
  height: number;
  rotation: number;
}

export async function renderPdfThumbnails(
  fileData: Uint8Array | ArrayBuffer,
  maxThumbnails = 50,
  scale = 0.4,
  onProgress?: (progress: number, page: number, total: number) => void
): Promise<PageThumbnail[]> {
  if (typeof window === "undefined") {
    return [];
  }

  const pdfjs = await import("pdfjs-dist");

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  const loadingTask = pdfjs.getDocument({ data: fileData });
  const pdfDoc = await loadingTask.promise;
  const totalPages = Math.min(pdfDoc.numPages, maxThumbnails);
  const thumbnails: PageThumbnail[] = [];

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(Math.round((i / totalPages) * 100), i, totalPages);

    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext("2d");

    if (context) {
      // Cast to accommodate pdfjs render type definitions
      await (page.render as (params: unknown) => { promise: Promise<void> })({
        canvasContext: context,
        viewport,
      }).promise;

      thumbnails.push({
        pageIndex: i - 1,
        dataUrl: canvas.toDataURL("image/jpeg", 0.8),
        width: viewport.width,
        height: viewport.height,
        rotation: page.rotate,
      });
    }

    // Yield control to prevent freezing the browser event loop
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return thumbnails;
}
