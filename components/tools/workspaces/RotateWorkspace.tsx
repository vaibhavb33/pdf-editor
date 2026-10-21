"use client";

import React, { useState } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createDownloadBlob } from "@/lib/pdf/types";

export function RotateWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [degrees, setDegrees] = useState<90 | 180 | 270>(90);
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

  const handleRotate = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(20);
    setStage("Applying permanent orientation tags...");
    setError(null);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());

      const { rotatePdf } = await import("@/lib/pdf/rotate");
      const res = await rotatePdf({
        fileData: buffer,
        rotationDegrees: degrees,
        outputFilename: `rotated-${file.name}`,
        onProgress: (p, s) => {
          setProgress(p);
          setStage(s);
        },
      });

      if (!res.data) throw new Error("No data returned from rotation.");

      const blob = createDownloadBlob(res.data, "application/pdf");
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        url: downloadUrl,
        size: blob.size,
        name: res.filename,
      });

      toast.success("PDF Rotated", `Pages permanently rotated ${degrees}° clockwise.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to rotate PDF.";
      setError(msg);
      toast.error("Rotation Failed", msg);
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
          {/* Left: Document preview workspace */}
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

            {/* Visual rotation preview indicator */}
            <div className="my-8 flex flex-col items-center justify-center text-center">
              <div
                style={{
                  transform: `rotate(${degrees}deg)`,
                  transition: "transform 300ms ease",
                }}
                className="flex h-24 w-18 items-center justify-center rounded-lg border-2 border-dashed border-blue-500 bg-blue-50/50 text-blue-600 shadow-sm dark:bg-blue-950/30 dark:text-blue-400"
              >
                <span className="text-xs font-bold">PDF</span>
              </div>
              <p className="mt-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Rotation: {degrees}° clockwise
              </p>
            </div>

            {isProcessing && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <ProgressBar progress={progress} stage={stage} />
              </div>
            )}
            {!isProcessing && <div />}
          </div>

          {/* Right Sidebar: Rotation Options + Action Button */}
          <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between min-h-[380px]">
            <div className="space-y-4">
              <h3 className="text-sm font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                Rotate Options
              </h3>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { deg: 90 as const, label: "90° Right (Clockwise)", icon: "↻" },
                  { deg: 180 as const, label: "180° Flip (Upside Down)", icon: "↺↻" },
                  { deg: 270 as const, label: "270° Left (Counter-Clockwise)", icon: "↺" },
                ].map((item) => (
                  <button
                    key={item.deg}
                    type="button"
                    onClick={() => setDegrees(item.deg)}
                    className={`w-full flex items-center gap-3 cursor-pointer rounded-xl border p-3.5 text-left transition-all ${
                      degrees === item.deg
                        ? "border-blue-600 bg-blue-50/60 text-blue-950 ring-1 ring-blue-600 dark:bg-blue-950/40 dark:text-blue-100"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                    }`}
                  >
                    <span className="text-xl font-bold">{item.icon}</span>
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="primary"
                onClick={handleRotate}
                disabled={isProcessing}
                className="w-full min-h-[50px] text-base font-bold shadow-sm"
              >
                Rotate PDF →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
