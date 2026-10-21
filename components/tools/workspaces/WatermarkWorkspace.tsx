"use client";

import React, { useState } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createDownloadBlob } from "@/lib/pdf/types";

export function WatermarkWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.25);
  const [rotation, setRotation] = useState(45);
  const [fontSize, setFontSize] = useState(48);
  const [colorHex, setColorHex] = useState("#dc2626"); // red
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

  const hexToRgb = (hex: string) => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return { r: isNaN(r) ? 0.8 : r, g: isNaN(g) ? 0.2 : g, b: isNaN(b) ? 0.2 : b };
  };

  const handleWatermark = async () => {
    if (!file || !text.trim()) return;

    setIsProcessing(true);
    setProgress(15);
    setStage("Loading PDF document...");
    setError(null);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());

      const { addWatermark } = await import("@/lib/pdf/watermark");
      const res = await addWatermark({
        fileData: buffer,
        text,
        fontSize,
        opacity,
        rotationDegrees: rotation,
        color: hexToRgb(colorHex),
        outputFilename: `watermarked-${file.name}`,
        onProgress: (p, s) => {
          setProgress(p);
          setStage(s);
        },
      });

      if (!res.data) throw new Error("No output generated from watermarking.");

      const blob = createDownloadBlob(res.data, "application/pdf");
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        url: downloadUrl,
        size: blob.size,
        name: res.filename,
      });

      toast.success("Watermark Applied", "All pages stamped with custom watermark!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to watermark PDF.";
      setError(msg);
      toast.error("Watermark Failed", msg);
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
          {/* Left: Document workspace preview with live watermark simulation */}
          <div className="flex-1 w-full rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/60 min-h-[440px] flex flex-col justify-between">
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

            {/* Visual preview of document sheet with simulated watermark */}
            <div className="my-8 flex flex-col items-center justify-center text-center">
              <div className="relative flex aspect-[1/1.3] w-48 sm:w-56 items-center justify-center overflow-hidden rounded-lg border border-zinc-300 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                <div className="space-y-2 p-4 w-full opacity-20">
                  <div className="h-2.5 bg-zinc-400 rounded w-3/4" />
                  <div className="h-2 bg-zinc-300 rounded w-full" />
                  <div className="h-2 bg-zinc-300 rounded w-5/6" />
                  <div className="h-2 bg-zinc-300 rounded w-full" />
                  <div className="h-2 bg-zinc-300 rounded w-4/5" />
                </div>
                {/* Simulated Watermark Text */}
                <div
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    opacity: opacity,
                    color: colorHex,
                    fontSize: `${Math.max(12, Math.min(28, fontSize * 0.4))}px`,
                    transition: "all 150ms ease",
                  }}
                  className="absolute font-black tracking-widest uppercase select-none pointer-events-none truncate max-w-[90%]"
                >
                  {text || "WATERMARK"}
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-400">
                Simulated document page with your live watermark settings
              </p>
            </div>

            {isProcessing && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                <ProgressBar progress={progress} stage={stage} />
              </div>
            )}
            {!isProcessing && <div />}
          </div>

          {/* Right Sidebar: Watermark Options + Full-width Action Button */}
          <div className="w-full lg:w-80 shrink-0 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between min-h-[440px]">
            <div className="space-y-4">
              <h3 className="text-sm font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                Watermark Options
              </h3>

              <div>
                <label
                  htmlFor="watermark-text"
                  className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  Text
                </label>
                <input
                  id="watermark-text"
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL, DRAFT"
                  className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-xs focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Angle
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { deg: 0, label: "0° Horizontal" },
                    { deg: 45, label: "45° Diagonal" },
                    { deg: 90, label: "90° Vertical" },
                  ].map((r) => (
                    <button
                      key={r.deg}
                      type="button"
                      onClick={() => setRotation(r.deg)}
                      className={`min-h-[38px] cursor-pointer rounded-xl border text-xs font-semibold transition-all ${
                        rotation === r.deg
                          ? "border-blue-600 bg-blue-50/60 text-blue-900 ring-1 ring-blue-600 dark:bg-blue-950/40 dark:text-blue-100"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {r.deg}°
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>Opacity</span>
                  <span>{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  id="opacity-slider"
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>Font Size</span>
                  <span>{fontSize} pt</span>
                </div>
                <input
                  id="font-size-slider"
                  type="range"
                  min="20"
                  max="90"
                  step="2"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { hex: "#dc2626", label: "Red" },
                    { hex: "#2563eb", label: "Blue" },
                    { hex: "#18181b", label: "Dark" },
                    { hex: "#16a34a", label: "Green" },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColorHex(c.hex)}
                      className={`flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-all ${
                        colorHex === c.hex
                          ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      <span
                        className="inline-block h-3 w-3 rounded-full border border-black/10"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="primary"
                onClick={handleWatermark}
                disabled={isProcessing}
                className="w-full min-h-[50px] text-base font-bold shadow-sm"
              >
                Apply Watermark →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
