"use client";

import React, { useState } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { PageThumbnail } from "@/lib/pdf/render-thumbnails";
import { createDownloadBlob } from "@/lib/pdf/types";

interface PageItem {
  id: string;
  originalIndex: number;
  thumbnailUrl?: string;
}

export function OrganizeWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);

  const { toast } = useToast();

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const targetFile = files[0];
    setFile(targetFile);
    setError(null);
    setIsLoadingPages(true);
    setProgress(10);
    setStage("Generating page previews...");

    try {
      const buffer = new Uint8Array(await targetFile.arrayBuffer());
      const { renderPdfThumbnails } = await import("@/lib/pdf/render-thumbnails");
      const thumbnails = await renderPdfThumbnails(buffer, 30, 0.3, (p, page, total) => {
        setProgress(p);
        setStage(`Rendering page ${page} of ${total}...`);
      });

      const items: PageItem[] = thumbnails.map((t: PageThumbnail) => ({
        id: `p_${t.pageIndex}_${Math.random().toString(36).slice(2, 6)}`,
        originalIndex: t.pageIndex,
        thumbnailUrl: t.dataUrl,
      }));

      // If rendering generated 0 thumbnails (fallback)
      if (items.length === 0) {
        items.push({ id: "p_0", originalIndex: 0 });
      }

      setPages(items);
    } catch (err: unknown) {
      console.warn("Could not render page previews, fallback to generic page slots", err);
      // Fallback: create default 3 slots
      setPages([
        { id: "p_0", originalIndex: 0 },
        { id: "p_1", originalIndex: 1 },
      ]);
    } finally {
      setIsLoadingPages(false);
    }
  };

  const movePage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const copy = [...pages];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setPages(copy);
  };

  const removePage = (index: number) => {
    if (pages.length <= 1) {
      toast.warning("Cannot remove", "The document must contain at least one page.");
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicatePage = (index: number) => {
    const item = pages[index];
    const copy = [...pages];
    copy.splice(index + 1, 0, {
      id: `dup_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      originalIndex: item.originalIndex,
      thumbnailUrl: item.thumbnailUrl,
    });
    setPages(copy);
    toast.info("Page duplicated");
  };

  const handleSave = async () => {
    if (!file || pages.length === 0) return;

    setIsProcessing(true);
    setProgress(20);
    setStage("Synthesizing reorganized PDF...");
    setError(null);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const orderedIndices = pages.map((p) => p.originalIndex);
      const { organizePdf } = await import("@/lib/pdf/organize");
      const res = await organizePdf({
        fileData: buffer,
        orderedPageIndices: orderedIndices,
        outputFilename: `organized-${file.name}`,
        onProgress: (p, s) => {
          setProgress(p);
          setStage(s);
        },
      });

      if (!res.data) throw new Error("No data returned from reorganization.");

      const blob = createDownloadBlob(res.data, "application/pdf");
      const downloadUrl = URL.createObjectURL(blob);

      setResult({
        url: downloadUrl,
        size: blob.size,
        name: res.filename,
      });

      toast.success("Document Organized", "Page order reconfigured successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to organize PDF.";
      setError(msg);
      toast.error("Reorganization Failed", msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setPages([]);
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
              <p className="text-xs text-zinc-500">{pages.length} Pages</p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="min-h-[44px] cursor-pointer px-3 text-xs font-semibold text-zinc-500 transition-colors hover:text-rose-600"
            >
              Change file
            </button>
          </div>

          {isLoadingPages ? (
            <div className="space-y-3 p-8 text-center">
              <ProgressBar progress={progress} stage={stage} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Use arrows to reorder pages or trash to remove</span>
                <span>{pages.length} pages total</span>
              </div>

              {/* Page Thumbnails Grid */}
              <div className="grid max-h-[500px] grid-cols-2 gap-4 overflow-y-auto p-2 sm:grid-cols-3 md:grid-cols-4">
                {pages.map((p, idx) => (
                  <div
                    key={p.id}
                    className="group relative flex flex-col items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-3 shadow-xs transition-all hover:border-blue-500/50 dark:border-zinc-800 dark:bg-zinc-900/80"
                  >
                    <div className="mb-2 flex w-full items-center justify-between text-xs font-bold text-zinc-500">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px] dark:bg-zinc-800">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] text-zinc-400">Page {p.originalIndex + 1}</span>
                    </div>

                    {/* Thumbnail Image */}
                    <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                      {p.thumbnailUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.thumbnailUrl}
                          alt={`Page ${idx + 1}`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs font-medium text-zinc-400">Page {idx + 1}</span>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="mt-2 flex w-full items-center justify-between gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={() => movePage(idx, "left")}
                        disabled={idx === 0}
                        aria-label="Move left"
                        className="flex min-h-[44px] min-w-[36px] flex-1 cursor-pointer items-center justify-center text-xs text-zinc-600 hover:text-blue-600 disabled:opacity-30 dark:text-zinc-400"
                      >
                        ←
                      </button>

                      <button
                        type="button"
                        onClick={() => duplicatePage(idx)}
                        aria-label="Duplicate page"
                        className="flex min-h-[44px] min-w-[36px] flex-1 cursor-pointer items-center justify-center text-xs text-zinc-600 hover:text-blue-600 dark:text-zinc-400"
                        title="Duplicate"
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() => removePage(idx)}
                        aria-label="Delete page"
                        className="flex min-h-[44px] min-w-[36px] flex-1 cursor-pointer items-center justify-center text-xs text-rose-500 hover:text-rose-700"
                        title="Delete"
                      >
                        ✕
                      </button>

                      <button
                        type="button"
                        onClick={() => movePage(idx, "right")}
                        disabled={idx === pages.length - 1}
                        aria-label="Move right"
                        className="flex min-h-[44px] min-w-[36px] flex-1 cursor-pointer items-center justify-center text-xs text-zinc-600 hover:text-blue-600 disabled:opacity-30 dark:text-zinc-400"
                      >
                        →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <ProgressBar progress={progress} stage={stage} />
            </div>
          )}

          {!isProcessing && !isLoadingPages && (
            <div className="flex justify-end pt-2">
              <Button variant="primary" onClick={handleSave} className="min-h-[48px] px-8">
                Save & Export Reordered PDF
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
