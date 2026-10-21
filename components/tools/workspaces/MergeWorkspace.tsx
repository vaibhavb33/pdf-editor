"use client";

import React, { useState } from "react";
import { Dropzone, SelectedFile } from "@/components/ui/Dropzone";
import { FileList } from "@/components/ui/FileList";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createDownloadBlob } from "@/lib/pdf/types";

export function MergeWorkspace() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);

  const { toast } = useToast();

  const handleFiles = (newFiles: File[]) => {
    const formatted: SelectedFile[] = newFiles.map((f) => ({
      id: `merge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
    }));
    setFiles((prev) => [...prev, ...formatted]);
    setError(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.warning("Select more files", "At least two PDF files are required to merge.");
      return;
    }

    setIsProcessing(true);
    setProgress(5);
    setStage("Reading documents into memory...");
    setError(null);

    try {
      const fileBuffers = await Promise.all(
        files.map(async (f) => ({
          name: f.name,
          data: new Uint8Array(await f.file.arrayBuffer()),
        }))
      );

      const { mergePdf } = await import("@/lib/pdf/merge");
      const res = await mergePdf({
        files: fileBuffers,
        outputFilename: "pdfivo-merged.pdf",
        onProgress: (p, s) => {
          setProgress(p);
          setStage(s);
        },
      });

      if (!res.data) throw new Error("No output generated from merge operation.");

      const blob = createDownloadBlob(res.data, "application/pdf");
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        url: downloadUrl,
        size: blob.size,
        name: res.filename,
      });

      toast.success("PDFs Merged", `${files.length} documents merged successfully!`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message.includes("Password")
            ? "One or more files is password protected. Please unlock before merging."
            : err.message
          : "Failed to merge documents.";
      setError(msg);
      toast.error("Merge Failed", msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFiles([]);
    setResult(null);
    setError(null);
    setProgress(0);
  };

  if (result) {
    const totalOriginalSize = files.reduce((acc, f) => acc + f.size, 0);
    return (
      <ResultCard
        filename={result.name}
        filesize={result.size}
        originalSize={totalOriginalSize}
        downloadUrl={result.url}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="w-full">
      {files.length === 0 ? (
        <Dropzone
          onFilesSelected={handleFiles}
          acceptedTypes={[".pdf", "application/pdf"]}
          maxSizeMB={100}
          errorMessage={error}
          onClearError={() => setError(null)}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          {/* Left: Reorderable Document List Workspace */}
          <div className="flex-1 w-full rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/60 min-h-[420px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Selected Documents ({files.length})
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Drag and drop cards to reorder your merged document
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                    <span>+ Add files</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFiles(Array.from(e.target.files));
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="cursor-pointer px-2 text-xs font-semibold text-zinc-400 hover:text-rose-600"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              <FileList
                files={files}
                onReorder={setFiles}
                onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
                onClearAll={() => setFiles([])}
              />
            </div>

            {isProcessing && (
              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <ProgressBar progress={progress} stage={stage} />
              </div>
            )}
            {!isProcessing && <div />}
          </div>

          {/* Right: Merge Options & Action Sidebar */}
          <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between min-h-[420px]">
            <div className="space-y-4">
              <h3 className="text-sm font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                Merge Settings
              </h3>

              <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-800/40 text-xs">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Total files:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{files.length}</span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Total size:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Privacy:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Client-Side</span>
                </div>
              </div>

              {files.length < 2 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  * Please add at least 2 PDF files to merge.
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="primary"
                onClick={handleMerge}
                disabled={files.length < 2 || isProcessing}
                className="w-full min-h-[50px] text-base font-bold shadow-sm"
              >
                Merge PDF →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
