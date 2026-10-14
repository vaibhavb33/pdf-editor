"use client";

import React, { useState } from "react";
import { Dropzone, SelectedFile } from "@/components/ui/Dropzone";
import { FileList } from "@/components/ui/FileList";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createDownloadBlob } from "@/lib/pdf/types";

export function ImagesToPdfWorkspace() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [pageSize, setPageSize] = useState<"fit" | "a4" | "letter">("fit");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);

  const { toast } = useToast();

  const handleFiles = (newFiles: File[]) => {
    const formatted: SelectedFile[] = newFiles.map((f) => ({
      id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
    }));
    setFiles((prev) => [...prev, ...formatted]);
    setError(null);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress(10);
    setStage("Reading image files into memory...");
    setError(null);

    try {
      const imageBuffers = await Promise.all(
        files.map(async (f) => ({
          name: f.name,
          data: new Uint8Array(await f.file.arrayBuffer()),
          type: f.type || "image/jpeg",
        }))
      );

      const { imagesToPdf } = await import("@/lib/pdf/convert");
      const res = await imagesToPdf({
        images: imageBuffers,
        pageSize,
        outputFilename: "pdfivo-images-converted.pdf",
        onProgress: (p, s) => {
          setProgress(p);
          setStage(s);
        },
      });

      if (!res.data) throw new Error("No PDF generated from images.");

      const blob = createDownloadBlob(res.data, "application/pdf");
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        url: downloadUrl,
        size: blob.size,
        name: res.filename,
      });

      toast.success("PDF Created", `Synthesized ${files.length} images into a PDF!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to convert images to PDF.";
      setError(msg);
      toast.error("Conversion Failed", msg);
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
    <div className="space-y-6">
      <Dropzone
        onFilesSelected={handleFiles}
        acceptedTypes={[".jpg", ".jpeg", ".png", ".webp", "image/*"]}
        maxSizeMB={100}
        errorMessage={error}
        onClearError={() => setError(null)}
      />

      {files.length > 0 && (
        <div className="space-y-6">
          <FileList
            files={files}
            onReorder={setFiles}
            onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
            onClearAll={() => setFiles([])}
          />

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Page Sizing
            </span>

            <div className="flex items-center gap-2">
              {[
                { id: "fit" as const, label: "Fit to Image" },
                { id: "a4" as const, label: "A4 Size" },
                { id: "letter" as const, label: "US Letter" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPageSize(opt.id)}
                  className={`min-h-[44px] cursor-pointer rounded-xl border px-3.5 text-xs font-semibold transition-all ${
                    pageSize === opt.id
                      ? "border-blue-600 bg-blue-50/50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                      : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
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
                Convert {files.length} Images to PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
