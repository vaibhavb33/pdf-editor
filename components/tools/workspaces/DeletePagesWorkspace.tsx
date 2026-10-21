"use client";

import React, { useState } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createDownloadBlob } from "@/lib/pdf/types";

export function DeletePagesWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [pagesInput, setPagesInput] = useState("2, 4");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);

  const { toast } = useToast();

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setError(null);
    }
  };

  const parseIndices = (str: string): number[] => {
    const parts = str.split(",").map((s) => s.trim());
    const indices: number[] = [];

    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let p = start; p <= end; p++) indices.push(p - 1);
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num)) indices.push(num - 1);
      }
    }

    return Array.from(new Set(indices));
  };

  const handleDelete = async () => {
    if (!file) return;

    const indices = parseIndices(pagesInput);
    if (indices.length === 0) {
      toast.warning("Specify pages", "Please enter valid page numbers to delete (e.g. 2, 4).");
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setStage("Filtering page stream objects...");
    setError(null);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());

      const { deletePages } = await import("@/lib/pdf/delete-pages");
      const res = await deletePages({
        fileData: buffer,
        pageIndicesToDelete: indices,
        outputFilename: `trimmed-${file.name}`,
        onProgress: (p, s) => {
          setProgress(p);
          setStage(s);
        },
      });

      if (!res.data) throw new Error("No output generated from deletion.");

      const blob = createDownloadBlob(res.data, "application/pdf");
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        url: downloadUrl,
        size: blob.size,
        name: res.filename,
      });

      toast.success("Pages Removed", `Deleted ${indices.length} page(s) successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete pages.";
      setError(msg);
      toast.error("Deletion Failed", msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  if (result) {
    return (
      <ResultCard
        filename={result.name}
        filesize={result.size}
        originalSize={file?.size}
        downloadUrl={result.url}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-6">
      {!file ? (
        <Dropzone
          onFilesSelected={handleFiles}
          acceptedTypes={[".pdf", "application/pdf"]}
          maxFiles={1}
          errorMessage={error}
          onClearError={() => setError(null)}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          {/* Left: Document workspace preview */}
          <div className="flex-1 w-full rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/60 min-h-[380px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="max-w-xs truncate text-base font-bold text-zinc-900 sm:max-w-md dark:text-zinc-100">
                    {file.name}
                  </h4>
                  <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="min-h-[44px] cursor-pointer px-3 text-xs font-semibold text-zinc-500 transition-colors hover:text-rose-600"
              >
                Change file
              </button>
            </div>

            {/* Center Visual Indicator */}
            <div className="my-8 flex flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {pagesInput ? `Selected for removal: ${pagesInput}` : "Ready to remove pages"}
              </p>
              <p className="text-xs text-zinc-400">
                Enter page numbers in the sidebar to delete
              </p>
            </div>

            {isProcessing && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <ProgressBar progress={progress} stage={stage} />
              </div>
            )}
            {!isProcessing && <div />}
          </div>

          {/* Right Sidebar: Delete Options + Full-width Action Button */}
          <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between min-h-[380px]">
            <div className="space-y-4">
              <h3 className="text-sm font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                Delete Options
              </h3>

              <div>
                <label
                  htmlFor="delete-pages-input"
                  className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Pages to Delete
                </label>
                <input
                  id="delete-pages-input"
                  type="text"
                  value={pagesInput}
                  onChange={(e) => setPagesInput(e.target.value)}
                  placeholder="e.g. 2, 4, 6-8"
                  className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                  Enter comma-separated page numbers or ranges (e.g. 1, 3-5).
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="primary"
                onClick={handleDelete}
                disabled={isProcessing}
                className="w-full min-h-[50px] text-base font-bold shadow-sm"
              >
                Delete Pages →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
