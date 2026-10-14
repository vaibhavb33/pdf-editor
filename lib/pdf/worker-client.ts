import { WorkerTaskPayload, WorkerTaskResponse, ProgressCallback } from "./types";

/**
 * Executes a client-side background PDF task via Web Workers.
 * Ensures all PDF operations remain 100% inside the user's browser with zero network transfer.
 */
export async function executeInWorker<TPayload, TResult>(
  workerScriptUrl: string,
  tool: string,
  payload: TPayload,
  onProgress?: ProgressCallback
): Promise<TResult> {
  if (typeof window === "undefined") {
    throw new Error("PDF processing can only run client-side in the browser.");
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerScriptUrl, { type: "module" });
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const message: WorkerTaskPayload<TPayload> = {
      taskId,
      tool,
      payload,
    };

    worker.onmessage = (event: MessageEvent<WorkerTaskResponse<TResult>>) => {
      const response = event.data;
      if (response.taskId !== taskId) return;

      if (response.status === "progress") {
        onProgress?.(response.progress ?? 0, response.stage ?? "Processing...");
      } else if (response.status === "success" && response.result !== undefined) {
        worker.terminate();
        resolve(response.result);
      } else if (response.status === "error") {
        worker.terminate();
        reject(new Error(response.error || "Unknown worker processing error"));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };

    worker.postMessage(message);
  });
}
