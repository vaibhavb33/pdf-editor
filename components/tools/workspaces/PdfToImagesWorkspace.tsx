"use client";

import React, { useState } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createDownloadBlob } from "@/lib/pdf/types";

export function PdfToImagesWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"image/jpeg" | "image/png">("image/jpeg");
  const [scale, setScale] = useState<number>(1.5);
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

  const handleConvert = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(10);
    setStage("Loading client-side PDF rendering canvas...");
    setError(null);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());

      const { pdfToImages } = await import("@/lib/pdf/convert");
      const res = await pdfToImages({
        pdfData: buffer,
        outputFormat: format,
        scale,
        onProgress: (p, s) => {
          setProgress(p);
          setStage(s);
        },
      });

      if (!res.data) throw new Error("No image data returned from rendering.");

      const blob = createDownloadBlob(res.data, "application/zip");
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        url: downloadUrl,
        size: blob.size,
        name: res.filename,
      });

      toast.success("Images Ready", "All pages rendered and bundled into a ZIP file!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to convert PDF to images.";
      setError(msg);
      toast.error("Conversion Failed", msg);
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
                Output Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat("image/jpeg")}
                  className={`min-h-[44px] cursor-pointer rounded-xl border text-sm font-semibold transition-all ${
                    format === "image/jpeg"
                      ? "border-blue-600 bg-blue-50/50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                      : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  JPG (Compact)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("image/png")}
                  className={`min-h-[44px] cursor-pointer rounded-xl border text-sm font-semibold transition-all ${
                    format === "image/png"
                      ? "border-blue-600 bg-blue-50/50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                      : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  PNG (Lossless)
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                Resolution Quality
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScale(1.5)}
                  className={`min-h-[44px] cursor-pointer rounded-xl border text-sm font-semibold transition-all ${
                    scale === 1.5
                      ? "border-blue-600 bg-blue-50/50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                      : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  Standard (150 DPI)
                </button>
                <button
                  type="button"
                  onClick={() => setScale(2.0)}
                  className={`min-h-[44px] cursor-pointer rounded-xl border text-sm font-semibold transition-all ${
                    scale === 2.0
                      ? "border-blue-600 bg-blue-50/50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                      : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  High Res (300 DPI)
                </button>
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
              <Button variant="primary" onClick={handleConvert} className="min-h-[48px] px-8">
                Convert to {format === "image/jpeg" ? "JPG" : "PNG"} ZIP
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
