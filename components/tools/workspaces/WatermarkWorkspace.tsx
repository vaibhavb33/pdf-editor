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

          <div className="space-y-4">
            <div>
              <label
                htmlFor="watermark-text"
                className="mb-1.5 block text-xs font-semibold tracking-wider text-zinc-500 uppercase"
              >
                Watermark Text
              </label>
              <input
                id="watermark-text"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
                className="min-h-[48px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  Rotation Angle
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { deg: 0, label: "0°" },
                    { deg: 45, label: "45°" },
                    { deg: 90, label: "90°" },
                  ].map((r) => (
                    <button
                      key={r.deg}
                      type="button"
                      onClick={() => setRotation(r.deg)}
                      className={`min-h-[44px] cursor-pointer rounded-xl border text-xs font-semibold transition-all ${
                        rotation === r.deg
                          ? "border-blue-600 bg-blue-50/50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                          : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="opacity-slider"
                  className="mb-1.5 block text-xs font-semibold tracking-wider text-zinc-500 uppercase"
                >
                  Opacity ({Math.round(opacity * 100)}%)
                </label>
                <input
                  id="opacity-slider"
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="min-h-[44px] w-full accent-blue-600"
                />
              </div>

              <div>
                <label
                  htmlFor="font-size-slider"
                  className="mb-1.5 block text-xs font-semibold tracking-wider text-zinc-500 uppercase"
                >
                  Font Size ({fontSize} pt)
                </label>
                <input
                  id="font-size-slider"
                  type="range"
                  min="20"
                  max="90"
                  step="2"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  className="min-h-[44px] w-full accent-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                Watermark Color
              </label>
              <div className="flex items-center gap-2">
                {[
                  { hex: "#dc2626", label: "Red" },
                  { hex: "#1e3a8a", label: "Navy" },
                  { hex: "#18181b", label: "Dark" },
                  { hex: "#059669", label: "Green" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColorHex(c.hex)}
                    className={`flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold transition-all ${
                      colorHex === c.hex
                        ? "border-blue-600 bg-blue-50/50 font-bold text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                        : "border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
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

          {isProcessing && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <ProgressBar progress={progress} stage={stage} />
            </div>
          )}

          {!isProcessing && (
            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={handleWatermark} className="min-h-[48px] px-8">
                Apply Watermark
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
