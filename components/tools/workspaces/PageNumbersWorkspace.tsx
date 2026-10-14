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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                Numbering Position
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "bottom-left" as const, label: "Bottom Left" },
                  { id: "bottom-center" as const, label: "Bottom Center" },
                  { id: "bottom-right" as const, label: "Bottom Right" },
                  { id: "top-left" as const, label: "Top Left" },
                  { id: "top-center" as const, label: "Top Center" },
                  { id: "top-right" as const, label: "Top Right" },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setPosition(pos.id)}
                    className={`min-h-[44px] cursor-pointer rounded-xl border p-2 text-center text-[11px] font-semibold transition-all ${
                      position === pos.id
                        ? "border-blue-600 bg-blue-50/50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                        : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="format-select"
                  className="mb-1.5 block text-xs font-semibold tracking-wider text-zinc-500 uppercase"
                >
                  Format Pattern
                </label>
                <select
                  id="format-select"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <option value="Page {n} of {total}">
                    Page &#123;n&#125; of &#123;total&#125;
                  </option>
                  <option value="{n} of {total}">&#123;n&#125; of &#123;total&#125;</option>
                  <option value="Page {n}">Page &#123;n&#125;</option>
                  <option value="{n}">&#123;n&#125;</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="start-num"
                    className="mb-1 block text-xs font-semibold tracking-wider text-zinc-500 uppercase"
                  >
                    First Number
                  </label>
                  <input
                    id="start-num"
                    type="number"
                    min="1"
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                    className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="font-sz"
                    className="mb-1 block text-xs font-semibold tracking-wider text-zinc-500 uppercase"
                  >
                    Font Size (pt)
                  </label>
                  <input
                    id="font-sz"
                    type="number"
                    min="6"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10) || 10)}
                    className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {isProcessing && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <ProgressBar progress={progress} stage={stage} />
            </div>
          )}

          {!isProcessing && (
            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={handleAddNumbers} className="min-h-[48px] px-8">
                Add Page Numbers
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
