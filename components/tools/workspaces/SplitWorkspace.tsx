"use client";

import React, { useState } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createDownloadBlob } from "@/lib/pdf/types";

export function SplitWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [splitMode, setSplitMode] = useState<"all" | "range">("all");
  const [rangeInput, setRangeInput] = useState("1-2");
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

  const parseRanges = (str: string): number[][] => {
    const parts = str.split(",").map((s) => s.trim());
    const ranges: number[][] = [];

    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          const range: number[] = [];
          for (let p = start; p <= end; p++) range.push(p);
          ranges.push(range);
        }
      } else {
        const num = parseInt(part, 10);
        if (!isNaN(num)) ranges.push([num]);
      }
    }

    return ranges;
  };

  const handleSplit = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setStage("Reading PDF file...");
    setError(null);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const baseName = file.name.replace(/\.pdf$/i, "");

      const ranges = splitMode === "range" ? parseRanges(rangeInput) : undefined;
      if (splitMode === "range" && (!ranges || ranges.length === 0)) {
        throw new Error("Please specify valid page numbers or ranges (e.g. 1-3, 5).");
      }

      const { splitPdf } = await import("@/lib/pdf/split");
      const res = await splitPdf({
        fileData: buffer,
        splitAllPages: splitMode === "all",
        pageRanges: ranges,
        baseFilename: baseName,
        onProgress: (p, s) => {
          setProgress(p);
          setStage(s);
        },
      });

      if (!res.data) throw new Error("No output generated from split operation.");

      const blob = createDownloadBlob(res.data, res.mimeType);
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        url: downloadUrl,
        size: blob.size,
        name: res.filename,
      });

      toast.success("Split Complete", "Pages extracted and packaged successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to split document.";
      setError(msg);
      toast.error("Split Failed", msg);
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

            {/* Visual Split preview indicator */}
            <div className="my-8 flex flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {splitMode === "all" ? "Extracting each page as individual PDF" : `Extracting ranges: ${rangeInput || "custom"}`}
              </p>
              <p className="text-xs text-zinc-400">
                All pages are processed in browser memory and packaged as a ZIP download
              </p>
            </div>

            {isProcessing && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <ProgressBar progress={progress} stage={stage} />
              </div>
            )}
            {!isProcessing && <div />}
          </div>

          {/* Right Sidebar: Split Options + Full-width Action Button */}
          <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between min-h-[380px]">
            <div className="space-y-4">
              <h3 className="text-sm font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                Split Options
              </h3>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setSplitMode("all")}
                  className={`w-full cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
                    splitMode === "all"
                      ? "border-blue-600 bg-blue-50/60 text-blue-950 ring-1 ring-blue-600 dark:bg-blue-950/40 dark:text-blue-100"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                  }`}
                >
                  <div className="text-xs font-bold">Split all pages</div>
                  <div className="mt-0.5 text-[11px] text-zinc-500">
                    Extract every page into individual files in a ZIP
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitMode("range")}
                  className={`w-full cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
                    splitMode === "range"
                      ? "border-blue-600 bg-blue-50/60 text-blue-950 ring-1 ring-blue-600 dark:bg-blue-950/40 dark:text-blue-100"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                  }`}
                >
                  <div className="text-xs font-bold">Extract custom ranges</div>
                  <div className="mt-0.5 text-[11px] text-zinc-500">
                    Extract specific pages (e.g. 1-3, 5)
                  </div>
                </button>
              </div>

              {splitMode === "range" && (
                <div className="space-y-1.5 pt-2">
                  <label
                    htmlFor="range-input"
                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Pages or ranges:
                  </label>
                  <input
                    id="range-input"
                    type="text"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder="e.g. 1-3, 5, 7-10"
                    className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="primary"
                onClick={handleSplit}
                disabled={isProcessing}
                className="w-full min-h-[50px] text-base font-bold shadow-sm"
              >
                Split PDF →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
