"use client";

import React, { useState } from "react";
import { Dropzone, SelectedFile } from "@/components/ui/Dropzone";
import { FileList } from "@/components/ui/FileList";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function InteractiveWorkspacePreview() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [processingState, setProcessingState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("Initializing Web Worker...");
  const { toast } = useToast();

  const handleFilesSelected = (newRawFiles: File[]) => {
    const formatted: SelectedFile[] = newRawFiles.map((file) => ({
      id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setFiles((prev) => [...prev, ...formatted]);
    setProcessingState("idle");
    toast.success(
      "Files loaded",
      `${newRawFiles.length} file(s) loaded into local browser memory.`
    );
  };

  const handleStartProcessing = () => {
    if (files.length === 0) return;

    setProcessingState("loading");
    setProgress(15);
    setStage("Reading PDF documents via Web Worker...");
    toast.info("Processing started", "Web Worker running in background thread.");

    setTimeout(() => {
      setProgress(55);
      setStage("Reorganizing & optimizing streams...");
    }, 600);

    setTimeout(() => {
      setProgress(85);
      setStage("Compressing client-side buffer...");
    }, 1200);

    setTimeout(() => {
      setProgress(100);
      setStage("Complete!");
      setProcessingState("success");
      toast.success("Processing complete!", "Document synthesized with zero server interaction.");
    }, 1800);
  };

  const handleSimulateError = () => {
    setProcessingState("loading");
    setProgress(30);
    setStage("Verifying document encryption...");

    setTimeout(() => {
      setProcessingState("error");
      toast.error("Simulation error", "Encrypted PDF requires a valid password to parse.");
    }, 800);
  };

  const handleReset = () => {
    setFiles([]);
    setProcessingState("idle");
    setProgress(0);
  };

  return (
    <div className="w-full space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/60">
      {/* Header & Breadcrumb preview */}
      <div className="flex flex-col justify-between gap-3 border-b border-zinc-100 pb-4 sm:flex-row sm:items-center dark:border-zinc-800/80">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
              Interactive Design System Demo
            </span>
            <Badge variant="success" className="text-[10px]">
              Live Components
            </Badge>
          </div>
          <Breadcrumbs
            items={[{ label: "Design System", href: "/#preview" }, { label: "Component Suite" }]}
          />
        </div>

        {/* Toast test triggers */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-1 hidden text-[11px] text-zinc-500 sm:inline">Test Toast:</span>
          <button
            type="button"
            onClick={() => toast.success("Success Toast", "Operation finished!")}
            className="cursor-pointer rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
          >
            Success
          </button>
          <button
            type="button"
            onClick={() => toast.error("Error Toast", "Something failed!")}
            className="cursor-pointer rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300"
          >
            Error
          </button>
          <button
            type="button"
            onClick={() => toast.warning("Warning Toast", "Memory limit near.")}
            className="cursor-pointer rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300"
          >
            Warning
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      {processingState === "success" ? (
        /* 1. ResultCard State */
        <ResultCard
          filename="pdfivo-optimized-document.pdf"
          filesize={1240000}
          originalSize={2850000}
          downloadUrl="#download-ready"
          onReset={handleReset}
        />
      ) : processingState === "error" ? (
        /* 2. Error State */
        <ResultCard
          filename="failed-document.pdf"
          downloadUrl="#"
          status="error"
          errorMessage="The document could not be processed due to a corrupt stream header. Please check your file and retry."
          onRetry={handleStartProcessing}
          onReset={handleReset}
        />
      ) : (
        /* 3. Dropzone & FileList State */
        <div className="space-y-6">
          <Dropzone
            onFilesSelected={handleFilesSelected}
            acceptedTypes={[".pdf", "application/pdf"]}
            maxSizeMB={100}
          />

          {files.length > 0 && (
            <div className="space-y-6 pt-2">
              <FileList
                files={files}
                onReorder={(newOrder) => setFiles(newOrder)}
                onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
                onClearAll={handleReset}
              />

              {/* Progress State */}
              {processingState === "loading" && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <ProgressBar progress={progress} stage={stage} />
                </div>
              )}

              {/* Action Buttons */}
              {processingState === "idle" && (
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={handleSimulateError} className="text-xs">
                    Simulate Error State
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleStartProcessing}
                    className="min-h-[48px] px-6"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Process Files Client-Side
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
