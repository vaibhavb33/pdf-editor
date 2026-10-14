"use client";

import React, { useState, useRef, useEffect } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createDownloadBlob } from "@/lib/pdf/types";

export function SignWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [signMode, setSignMode] = useState<"draw" | "type" | "upload">("draw");
  const [typedName, setTypedName] = useState("John Doe");
  const [uploadedSigUrl, setUploadedSigUrl] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const { toast } = useToast();

  const handleFiles = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setError(null);
    }
  };

  // Canvas drawing handlers
  useEffect(() => {
    if (signMode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [signMode]);

  const startDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const generateSignatureDataUrl = (): string => {
    if (signMode === "upload" && uploadedSigUrl) {
      return uploadedSigUrl;
    }

    if (signMode === "type") {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 400;
      tempCanvas.height = 160;
      const ctx = tempCanvas.getContext("2d");
      if (ctx) {
        ctx.font = "italic 38px 'Brush Script MT', cursive, sans-serif";
        ctx.fillStyle = "#1e3a8a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(typedName, 200, 80);
      }
      return tempCanvas.toDataURL("image/png");
    }

    // Draw mode
    const canvas = canvasRef.current;
    if (canvas) {
      return canvas.toDataURL("image/png");
    }
    throw new Error("No signature created.");
  };

  const handleSign = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(15);
    setStage("Rendering digital signature stamp...");
    setError(null);

    try {
      const sigDataUrl = generateSignatureDataUrl();
      const base64 = sigDataUrl.split(",")[1];
      const binaryString = atob(base64);
      const sigBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        sigBytes[i] = binaryString.charCodeAt(i);
      }

      const buffer = new Uint8Array(await file.arrayBuffer());

      const { signPdf } = await import("@/lib/pdf/sign");
      const res = await signPdf({
        fileData: buffer,
        signatureImageBytes: sigBytes,
        placements: [
          {
            pageIndex: Math.max(0, pageNumber - 1),
            x: 350,
            y: 80,
            width: 180,
            height: 70,
          },
        ],
        outputFilename: `signed-${file.name}`,
        onProgress: (p, s) => {
          setProgress(p);
          setStage(s);
        },
      });

      if (!res.data) throw new Error("No data returned from signing.");

      const blob = createDownloadBlob(res.data, "application/pdf");
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        url: downloadUrl,
        size: blob.size,
        name: res.filename,
      });

      toast.success("Document Signed", `Signature embedded on page ${pageNumber}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign PDF.";
      setError(msg);
      toast.error("Signing Failed", msg);
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
            {/* Signature Creation Mode Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
              {[
                { id: "draw" as const, label: "Draw Signature" },
                { id: "type" as const, label: "Type Signature" },
                { id: "upload" as const, label: "Upload Image" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSignMode(m.id)}
                  className={`min-h-[44px] cursor-pointer rounded-xl px-4 text-xs font-semibold transition-all sm:text-sm ${
                    signMode === m.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Mode 1: Draw Pad */}
            {signMode === "draw" && (
              <div className="space-y-2">
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950">
                  <canvas
                    ref={canvasRef}
                    width={450}
                    height={160}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                    className="h-36 w-full cursor-crosshair touch-none rounded-xl border border-dashed border-zinc-200 bg-white dark:border-zinc-800"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Sign inside the box using mouse or finger</span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="min-h-[44px] cursor-pointer px-2 font-semibold text-rose-600"
                  >
                    Clear pad
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2: Type Signature */}
            {signMode === "type" && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  Type Your Full Name
                </label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-900"
                />
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950">
                  <span className="font-serif text-3xl text-blue-700 italic dark:text-blue-400">
                    {typedName || "Your Signature"}
                  </span>
                </div>
              </div>
            )}

            {/* Mode 3: Upload Signature */}
            {signMode === "upload" && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  Upload Transparent PNG Signature
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const reader = new FileReader();
                      reader.onload = () => setUploadedSigUrl(reader.result as string);
                      reader.readAsDataURL(f);
                    }
                  }}
                  className="w-full text-xs"
                />
                {uploadedSigUrl && (
                  <div className="mx-auto max-w-xs rounded-xl border bg-white p-4 text-center dark:bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedSigUrl}
                      alt="Signature Preview"
                      className="mx-auto max-h-24"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Placement page selector */}
            <div className="flex items-center gap-3 pt-2">
              <label
                htmlFor="target-page"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                Target Page Number:
              </label>
              <input
                id="target-page"
                type="number"
                min="1"
                value={pageNumber}
                onChange={(e) => setPageNumber(parseInt(e.target.value, 10) || 1)}
                className="min-h-[44px] w-20 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-center text-sm font-bold dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
          </div>

          {isProcessing && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <ProgressBar progress={progress} stage={stage} />
            </div>
          )}

          {!isProcessing && (
            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={handleSign} className="min-h-[48px] px-8">
                Stamp Signature & Download
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
