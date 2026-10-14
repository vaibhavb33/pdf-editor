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
    <div className="space-y-6">
      <Dropzone
        onFilesSelected={handleFiles}
        acceptedTypes={[".pdf", "application/pdf"]}
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

          {isProcessing && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
              <ProgressBar progress={progress} stage={stage} />
            </div>
          )}

          {!isProcessing && (
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleMerge}
                disabled={files.length < 2}
                className="min-h-[48px] px-8 text-base"
              >
                Merge {files.length} PDFs
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
