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
        <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div>
              <h4 className="max-w-xs truncate text-sm font-bold text-zinc-900 sm:max-w-md dark:text-zinc-100">
                {file.name}
              </h4>
              <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="min-h-[44px] cursor-pointer px-3 text-xs font-semibold text-zinc-500 transition-colors hover:text-rose-600"
            >
              Change file
            </button>
          </div>

          <div className="space-y-3">
            <label
              htmlFor="delete-pages-input"
              className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Pages to Delete (comma-separated or ranges):
            </label>
            <input
              id="delete-pages-input"
              type="text"
              value={pagesInput}
              onChange={(e) => setPagesInput(e.target.value)}
              placeholder="e.g. 2, 4, 6-8"
              className="min-h-[48px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900"
            />
            <p className="text-xs text-zinc-500">
              Enter page numbers (1-indexed) to omit. Example: &ldquo;1, 3-5&rdquo; deletes pages 1,
              3, 4, and 5.
            </p>
          </div>

          {isProcessing && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <ProgressBar progress={progress} stage={stage} />
            </div>
          )}

          {!isProcessing && (
            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={handleDelete} className="min-h-[48px] px-8">
                Delete Selected Pages
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
