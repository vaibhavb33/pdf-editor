export type ProgressCallback = (progress: number, stage: string) => void;

export interface PdfProcessingOptions {
  onProgress?: ProgressCallback;
  signal?: AbortSignal;
}

export interface PdfFileItem {
  id: string;
  name: string;
  size: number;
  data: Uint8Array | ArrayBuffer;
  pageCount?: number;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: Uint8Array | Blob;
  filename: string;
  mimeType: string;
  error?: string;
}

export interface WorkerTaskPayload<T = unknown> {
  taskId: string;
  tool: string;
  payload: T;
}

export interface WorkerTaskResponse<R = unknown> {
  taskId: string;
  status: "progress" | "success" | "error";
  progress?: number;
  stage?: string;
  result?: R;
  error?: string;
}

/**
 * Creates a safe browser Blob from Uint8Array or Blob without TypeScript SharedArrayBuffer conflicts.
 */
export function createDownloadBlob(data: Uint8Array | Blob, mimeType: string): Blob {
  if (typeof Blob === "undefined") {
    throw new Error("Blob is only available in browser environments.");
  }
  if (data instanceof Blob) return data;
  return new Blob([data as unknown as BlobPart], { type: mimeType });
}
