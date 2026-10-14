"use client";

import React, { useState } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { CompressionLevel } from "@/lib/pdf/compress";
import { createDownloadBlob } from "@/lib/pdf/types";

export function CompressWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>("recommended");
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

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(15);
    setStage("Parsing PDF stream objects...");
    setError(null);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());

      const { compressPdf } = await import("@/lib/pdf/compress");
      const res = await compressPdf({
        fileData: buffer,
        level,
        outputFilename: `compressed-${file.name}`,
        onProgress: (p, s) => {
          setProgress(p);
          setStage(s);
        },
      });

      if (!res.data) throw new Error("No data returned from compression.");

      const blob = createDownloadBlob(res.data, "application/pdf");
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        url: downloadUrl,
        size: blob.size,
        name: res.filename,
      });

      toast.success("PDF Compressed", "Optimized without transmitting data to any server!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to compress PDF.";
      setError(msg);
      toast.error("Compression Failed", msg);
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
              <p className="text-xs text-zinc-500">
                Original Size: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
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
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Select Compression Level
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  id: "extreme" as CompressionLevel,
                  title: "Extreme",
                  desc: "Highest reduction, stream deduplication",
                },
                {
                  id: "recommended" as CompressionLevel,
                  title: "Recommended",
                  desc: "Balanced reduction & crisp quality",
                },
                {
                  id: "light" as CompressionLevel,
                  title: "Light",
                  desc: "Minimal compression, maximum quality",
                },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setLevel(lvl.id)}
                  className={`cursor-pointer rounded-2xl border p-4 text-left transition-all ${
                    level === lvl.id
                      ? "border-blue-600 bg-blue-50/50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                  }`}
                >
                  <div className="text-sm font-bold">{lvl.title}</div>
                  <div className="mt-1 text-xs text-zinc-500">{lvl.desc}</div>
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
              <Button variant="primary" onClick={handleCompress} className="min-h-[48px] px-8">
                Compress PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
