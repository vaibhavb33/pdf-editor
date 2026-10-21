"use client";

import React, { useState } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { PageNumberPosition } from "@/lib/pdf/page-numbers";
import { createDownloadBlob } from "@/lib/pdf/types";

export function PageNumbersWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<PageNumberPosition>("bottom-center");
  const [format, setFormat] = useState("Page {n} of {total}");
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(10);
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

  const handleAddNumbers = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(15);
    setStage("Calculating page bounds and font embedding...");
    setError(null);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());

      const { addPageNumbers } = await import("@/lib/pdf/page-numbers");
      const res = await addPageNumbers({
        fileData: buffer,
        position,
        format,
        startNumber,
        fontSize,
        outputFilename: `numbered-${file.name}`,
        onProgress: (p, s) => {
          setProgress(p);
          setStage(s);
        },
      });

      if (!res.data) throw new Error("No output generated from numbering.");

      const blob = createDownloadBlob(res.data, "application/pdf");
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        url: downloadUrl,
        size: blob.size,
        name: res.filename,
      });

      toast.success("Page Numbers Added", "All pages numbered successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to add page numbers.";
      setError(msg);
      toast.error("Numbering Failed", msg);
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
          <div className="flex-1 w-full rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/60 min-h-[400px] flex flex-col justify-between">
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

            {/* Visual sheet preview showing numbering location */}
            <div className="my-8 flex flex-col items-center justify-center text-center">
              <div className="relative flex aspect-[1/1.3] w-48 sm:w-56 flex-col justify-between rounded-lg border border-zinc-300 bg-white p-3 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                {/* Top slots */}
                <div className="flex justify-between text-[10px]">
                  <span className={`rounded px-1 ${position === "top-left" ? "bg-blue-600 text-white font-bold" : "text-transparent"}`}>1</span>
                  <span className={`rounded px-1 ${position === "top-center" ? "bg-blue-600 text-white font-bold" : "text-transparent"}`}>1</span>
                  <span className={`rounded px-1 ${position === "top-right" ? "bg-blue-600 text-white font-bold" : "text-transparent"}`}>1</span>
                </div>

                <div className="space-y-2 p-2 opacity-25">
                  <div className="h-2 bg-zinc-400 rounded w-full" />
                  <div className="h-2 bg-zinc-300 rounded w-5/6" />
                  <div className="h-2 bg-zinc-300 rounded w-full" />
                  <div className="h-2 bg-zinc-300 rounded w-4/6" />
                </div>

                {/* Bottom slots */}
                <div className="flex justify-between text-[10px]">
                  <span className={`rounded px-1 ${position === "bottom-left" ? "bg-blue-600 text-white font-bold" : "text-transparent"}`}>1</span>
                  <span className={`rounded px-1 ${position === "bottom-center" ? "bg-blue-600 text-white font-bold" : "text-transparent"}`}>1</span>
                  <span className={`rounded px-1 ${position === "bottom-right" ? "bg-blue-600 text-white font-bold" : "text-transparent"}`}>1</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-400">
                Preview showing placement: {position.replace("-", " ")}
              </p>
            </div>

            {isProcessing && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <ProgressBar progress={progress} stage={stage} />
              </div>
            )}
            {!isProcessing && <div />}
          </div>

          {/* Right Sidebar: Page Number Options + Full-width Action Button */}
          <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between min-h-[400px]">
            <div className="space-y-4">
              <h3 className="text-sm font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                Number Options
              </h3>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Position
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "bottom-left" as const, label: "Bottom L" },
                    { id: "bottom-center" as const, label: "Bottom C" },
                    { id: "bottom-right" as const, label: "Bottom R" },
                    { id: "top-left" as const, label: "Top L" },
                    { id: "top-center" as const, label: "Top C" },
                    { id: "top-right" as const, label: "Top R" },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setPosition(pos.id)}
                      className={`min-h-[38px] cursor-pointer rounded-xl border p-1 text-center text-[11px] font-semibold transition-all ${
                        position === pos.id
                          ? "border-blue-600 bg-blue-50/60 text-blue-900 ring-1 ring-blue-600 dark:bg-blue-950/40 dark:text-blue-100"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="format-select"
                  className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Format Pattern
                </label>
                <select
                  id="format-select"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <option value="Page {n} of {total}">Page &#123;n&#125; of &#123;total&#125;</option>
                  <option value="{n} of {total}">&#123;n&#125; of &#123;total&#125;</option>
                  <option value="Page {n}">Page &#123;n&#125;</option>
                  <option value="{n}">&#123;n&#125;</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="start-num"
                    className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    Start At
                  </label>
                  <input
                    id="start-num"
                    type="number"
                    min="1"
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                    className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="font-sz"
                    className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                  >
                    Font Size
                  </label>
                  <input
                    id="font-sz"
                    type="number"
                    min="6"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10) || 10)}
                    className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="primary"
                onClick={handleAddNumbers}
                disabled={isProcessing}
                className="w-full min-h-[50px] text-base font-bold shadow-sm"
              >
                Add Page Numbers →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
