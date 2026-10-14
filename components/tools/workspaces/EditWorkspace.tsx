"use client";

import React, { useState } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { AnnotationItem, AnnotationType } from "@/lib/pdf/edit";
import { createDownloadBlob } from "@/lib/pdf/types";

export function EditWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [activeTool, setActiveTool] = useState<AnnotationType>("text");
  const [pageNumber, setPageNumber] = useState(1);
  const [textInput, setTextInput] = useState("Sample Annotation");
  const [fontSize, setFontSize] = useState(14);
  const [stampImageBytes, setStampImageBytes] = useState<Uint8Array | null>(null);

  const [annotations, setAnnotations] = useState<AnnotationItem[]>([]);
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

  const handleAddAnnotation = () => {
    const newAnnotation: AnnotationItem = {
      id: `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: activeTool,
      pageIndex: Math.max(0, pageNumber - 1),
      x: 100,
      y: 500 - annotations.length * 40,
      text: activeTool === "text" ? textInput : undefined,
      fontSize: activeTool === "text" ? fontSize : undefined,
      color: activeTool === "text" ? { r: 0.1, g: 0.1, b: 0.8 } : undefined,
      imageBytes: activeTool === "image" && stampImageBytes ? stampImageBytes : undefined,
    };

    setAnnotations((prev) => [...prev, newAnnotation]);
    toast.success("Element added", `Added ${activeTool} to page ${pageNumber}.`);
  };

  const handleApplyEdits = async () => {
    if (!file) return;

    if (annotations.length === 0) {
      toast.warning("No elements", "Add at least one text, shape, or highlight before saving.");
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setStage("Applying vector elements and text annotations...");
    setError(null);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());

      const { editPdf } = await import("@/lib/pdf/edit");
      const res = await editPdf({
        fileData: buffer,
        annotations,
        outputFilename: `edited-${file.name}`,
        onProgress: (p, s) => {
          setProgress(p);
          setStage(s);
        },
      });

      if (!res.data) throw new Error("No data returned from editing.");

      const blob = createDownloadBlob(res.data, "application/pdf");
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        url: downloadUrl,
        size: blob.size,
        name: res.filename,
      });

      toast.success("Edits Applied", "Annotated document exported successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to edit PDF.";
      setError(msg);
      toast.error("Edit Failed", msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setAnnotations([]);
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
              <p className="text-xs text-zinc-500">{annotations.length} items to apply</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="min-h-[44px] cursor-pointer px-3 text-xs font-semibold text-zinc-500 transition-colors hover:text-rose-600"
            >
              Change file
            </button>
          </div>

          {/* Annotation Toolbar */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "text" as AnnotationType, label: "Add Text", icon: "T" },
                { id: "highlight" as AnnotationType, label: "Highlight Box", icon: "✎" },
                { id: "rectangle" as AnnotationType, label: "Rectangle Shape", icon: "▭" },
                { id: "image" as AnnotationType, label: "Image Stamp", icon: "🖼" },
              ].map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl px-4 text-xs font-semibold transition-all sm:text-sm ${
                    activeTool === tool.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  <span>{tool.icon}</span>
                  <span>{tool.label}</span>
                </button>
              ))}
            </div>

            {/* Tool specific settings */}
            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
              {activeTool === "text" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-zinc-500">
                      Text Content
                    </label>
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-500">
                      Font Size (pt)
                    </label>
                    <input
                      type="number"
                      min="8"
                      max="48"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value, 10) || 14)}
                      className="min-h-[44px] w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  </div>
                </div>
              )}

              {activeTool === "image" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-500">
                    Select Stamp Image
                  </label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setStampImageBytes(new Uint8Array(await f.arrayBuffer()));
                      }
                    }}
                    className="w-full text-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs">
                  <label
                    htmlFor="target-page-num"
                    className="font-semibold text-zinc-600 dark:text-zinc-400"
                  >
                    Apply to Page:
                  </label>
                  <input
                    id="target-page-num"
                    type="number"
                    min="1"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(parseInt(e.target.value, 10) || 1)}
                    className="min-h-[44px] w-16 rounded-xl border border-zinc-200 bg-white px-2 text-center text-sm font-bold dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </div>

                <Button variant="secondary" size="sm" onClick={handleAddAnnotation}>
                  + Add to Document
                </Button>
              </div>
            </div>

            {/* List of pending annotations */}
            {annotations.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                  Pending Elements ({annotations.length})
                </h5>
                <div className="flex flex-wrap gap-2">
                  {annotations.map((ann, i) => (
                    <span
                      key={ann.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      <span className="font-semibold text-blue-600 capitalize">{ann.type}</span>
                      <span>(p.{ann.pageIndex + 1})</span>
                      <button
                        type="button"
                        onClick={() => setAnnotations((prev) => prev.filter((_, idx) => idx !== i))}
                        className="ml-1 cursor-pointer text-rose-500 hover:text-rose-700"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <ProgressBar progress={progress} stage={stage} />
            </div>
          )}

          {!isProcessing && (
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={handleApplyEdits}
                disabled={annotations.length === 0}
                className="min-h-[48px] px-8"
              >
                Apply All & Export PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
