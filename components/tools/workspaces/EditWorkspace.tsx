"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { useToast } from "@/components/ui/Toast";
import { TextBlock } from "@/lib/pdf/edit-types";
import { extractPageText } from "@/lib/pdf/text-extractor";
import { applyPdfEdits } from "@/lib/pdf/edit-engine";
import { createDownloadBlob } from "@/lib/pdf/types";
import { EditToolbar } from "./edit/EditToolbar";
import { EditThumbnailSidebar } from "./edit/EditThumbnailSidebar";
import { EditPageCanvas } from "./edit/EditPageCanvas";

export function EditWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  // Text blocks state & history
  const [blocks, setBlocks] = useState<TextBlock[]>([]);
  const [history, setHistory] = useState<TextBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Editor navigation & view state
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isAddTextActive, setIsAddTextActive] = useState<boolean>(false);
  const [isScannedPdf, setIsScannedPdf] = useState<boolean>(false);

  // Loading & export states
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStage, setExportStage] = useState<string>("");
  const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  // Helper to push a new state to the Undo/Redo history
  const pushHistory = useCallback(
    (newBlocks: TextBlock[]) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(newBlocks);
        return next;
      });
      setHistoryIndex((prev) => prev + 1);
      setBlocks(newBlocks);
    },
    [historyIndex]
  );

  // Handle file selection
  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setError(null);
    setResult(null);
    setIsLoadingPdf(true);

    try {
      const buffer = new Uint8Array(await selectedFile.arrayBuffer());
      setFileBytes(buffer);

      // Dynamically load PDF.js client-side
      const pdfjs = await import("pdfjs-dist");
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      }

      const doc = await pdfjs.getDocument({ data: buffer }).promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);

      // Extract text blocks for all pages
      const allBlocks: TextBlock[] = [];
      for (let i = 0; i < doc.numPages; i++) {
        const page = await doc.getPage(i + 1);
        const pageData = await extractPageText(page, i, 1.0);
        allBlocks.push(...pageData.blocks);
      }

      if (allBlocks.length === 0) {
        setIsScannedPdf(true);
      } else {
        setIsScannedPdf(false);
      }

      setBlocks(allBlocks);
      setHistory([allBlocks]);
      setHistoryIndex(0);
      setCurrentPage(0);
      toast.success("PDF Loaded", `Extracted ${allBlocks.length} text blocks across ${doc.numPages} page(s).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load and parse PDF document.";
      setError(msg);
      toast.error("Loading Error", msg);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setBlocks(history[nextIndex]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setBlocks(history[nextIndex]);
    }
  }, [historyIndex, history]);

  const handleDeleteSelectedBlock = useCallback(() => {
    if (!selectedBlockId) return;
    const nextBlocks = blocks.map((b) =>
      b.id === selectedBlockId ? { ...b, isDeleted: true } : b
    );
    pushHistory(nextBlocks);
    setSelectedBlockId(null);
    toast.info("Deleted", "Text block removed from document.");
  }, [selectedBlockId, blocks, pushHistory, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger global shortcuts if typing inside an active textarea/input
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "Escape") {
        setSelectedBlockId(null);
        setIsAddTextActive(false);
      } else if ((e.key === "Delete" || e.key === "Backspace") && !isInput && selectedBlockId) {
        e.preventDefault();
        handleDeleteSelectedBlock();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, selectedBlockId, handleDeleteSelectedBlock]);

  // Selected block updates
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const handleUpdateSelectedBlock = (updates: Partial<TextBlock>) => {
    if (!selectedBlockId) return;
    const nextBlocks = blocks.map((b) =>
      b.id === selectedBlockId
        ? {
            ...b,
            ...updates,
            isEdited: true,
          }
        : b
    );
    pushHistory(nextBlocks);
  };

  const handleUpdateBlock = (blockId: string, updates: Partial<TextBlock>) => {
    const nextBlocks = blocks.map((b) =>
      b.id === blockId
        ? {
            ...b,
            ...updates,
            isEdited: true,
          }
        : b
    );
    // Don't flood history on keystroke, update directly or debounce
    setBlocks(nextBlocks);
  };

  const handleDeleteBlock = (blockId: string) => {
    const nextBlocks = blocks.map((b) =>
      b.id === blockId ? { ...b, isDeleted: true } : b
    );
    pushHistory(nextBlocks);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  // Add text block at specific coordinates
  const handleAddTextAtPoint = ({
    pageIndex,
    pdfX,
    pdfY,
    viewportX,
    viewportY,
  }: {
    pageIndex: number;
    pdfX: number;
    pdfY: number;
    viewportX: number;
    viewportY: number;
  }) => {
    const newId = `new_block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const fontSize = 14;
    const defaultText = "Click to edit text";

    const newBlock: TextBlock = {
      id: newId,
      pageIndex,
      originalText: "",
      currentText: defaultText,
      x: pdfX,
      y: pdfY,
      pdfBounds: {
        x: pdfX,
        y: pdfY - fontSize * 0.25,
        width: fontSize * 0.6 * defaultText.length,
        height: fontSize * 1.25,
      },
      viewportBounds: {
        left: viewportX,
        top: viewportY,
        width: fontSize * 0.6 * defaultText.length * scale,
        height: fontSize * 1.25 * scale,
      },
      fontSize,
      fontFamily: "sans-serif",
      isBold: false,
      isItalic: false,
      color: { r: 0.07, g: 0.1, b: 0.15 },
      bgColor: { r: 1, g: 1, b: 1 },
      isNew: true,
      isEdited: true,
    };

    const nextBlocks = [...blocks, newBlock];
    pushHistory(nextBlocks);
    setSelectedBlockId(newId);
    setIsAddTextActive(false);
    toast.success("Text Box Added", "Type your content or adjust font settings above.");
  };

  // Zoom controls
  const handleZoomIn = () => setScale((s) => Math.min(2.5, Math.round((s + 0.15) * 100) / 100));
  const handleZoomOut = () => setScale((s) => Math.max(0.5, Math.round((s - 0.15) * 100) / 100));
  const handleResetZoom = () => setScale(1.0);
  const handleFitWidth = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth - (isSidebarOpen ? 240 : 60);
      // Standard page width is ~595pt (A4 portrait)
      const idealScale = Math.max(0.5, Math.min(2.0, (containerWidth - 64) / 595));
      setScale(Math.round(idealScale * 100) / 100);
    }
  };

  // Jump to specific page
  const handleScrollToPage = (targetPageIndex: number) => {
    setCurrentPage(targetPageIndex);
    const pageEl = document.getElementById(`page-container-${targetPageIndex + 1}`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Export / Download
  const handleDownload = async () => {
    if (!fileBytes || !file) return;

    setIsExporting(true);
    setExportProgress(10);
    setExportStage("Analyzing text modifications...");

    try {
      const res = await applyPdfEdits({
        fileData: fileBytes,
        blocks,
        outputFilename: `edited-${file.name}`,
        onProgress: (p, s) => {
          setExportProgress(p);
          setExportStage(s);
        },
      });

      if (!res.data) throw new Error("Could not generate edited PDF.");

      const blob = createDownloadBlob(res.data, "application/pdf");
      const url = URL.createObjectURL(blob);

      setResult({
        url,
        size: blob.size,
        name: res.filename,
      });

      // Direct download trigger for immediate user gratification
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success("PDF Downloaded", "Your edited PDF has been saved successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to export edited PDF.";
      setError(msg);
      toast.error("Export Error", msg);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileBytes(null);
    setPdfDoc(null);
    setNumPages(0);
    setBlocks([]);
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedBlockId(null);
    setResult(null);
    setError(null);
    setIsScannedPdf(false);
  };

  // If no file loaded yet, render the clean iLovePDF centered dropzone
  if (!file || !pdfDoc) {
    return (
      <div className="w-full py-8">
        <div className="mx-auto max-w-2xl">
          <Dropzone
            onFilesSelected={handleFiles}
            maxFiles={1}
            isLoading={isLoadingPdf}
            errorMessage={error}
            onClearError={() => setError(null)}
          />

          {isLoadingPdf && (
            <div className="mt-6 flex flex-col items-center justify-center space-y-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="text-xs text-zinc-500">Extracting PDF pages and typography...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full Editor View
  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[600px] w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
      {/* Top Toolbar */}
      <EditToolbar
        selectedBlock={selectedBlock}
        onUpdateSelectedBlock={handleUpdateSelectedBlock}
        onDeleteSelectedBlock={handleDeleteSelectedBlock}
        isAddTextActive={isAddTextActive}
        onToggleAddText={() => {
          setIsAddTextActive(!isAddTextActive);
          if (!isAddTextActive) {
            setSelectedBlockId(null);
            toast.info("Add Text Active", "Click anywhere on the document to place a new text box.");
          }
        }}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        scale={scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitWidth={handleFitWidth}
        currentPage={currentPage}
        totalPages={numPages}
        onDownload={handleDownload}
        isSaving={isExporting}
      />

      {/* Scanned PDF Warning Banner */}
      {isScannedPdf && (
        <div
          role="alert"
          className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              <strong>Scanned Document:</strong> No selectable text was found on this PDF. You can still insert new text boxes using the <em>Add Text</em> tool.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsScannedPdf(false)}
            className="text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Exporting Progress Bar Modal / Overlay */}
      {isExporting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Generating Edited PDF
            </h3>
            <ProgressBar progress={exportProgress} stage={exportStage} />
          </div>
        </div>
      )}

      {/* Main Workspace Area (Left Thumbnail Sidebar + Center Scrollable Pages Canvas) */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Thumbnails Sidebar */}
        <EditThumbnailSidebar
          pdfDoc={pdfDoc}
          numPages={numPages}
          currentPage={currentPage}
          onSelectPage={handleScrollToPage}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Center Scrollable Document Pages */}
        <main
          ref={scrollContainerRef}
          onClick={() => {
            // Clicking canvas background deselects
            if (!isAddTextActive) {
              setSelectedBlockId(null);
            }
          }}
          className="flex-1 overflow-y-auto overflow-x-auto bg-zinc-100 p-4 sm:p-8 dark:bg-zinc-900/50"
        >
          <div className="mx-auto flex flex-col items-center">
            {Array.from({ length: numPages }).map((_, i) => (
              <EditPageCanvas
                key={i}
                pdfDoc={pdfDoc}
                pageIndex={i}
                scale={scale}
                blocks={blocks.filter((b) => b.pageIndex === i)}
                selectedBlockId={selectedBlockId}
                onSelectBlock={(id) => {
                  setSelectedBlockId(id);
                  setIsAddTextActive(false);
                }}
                onUpdateBlock={handleUpdateBlock}
                onDeleteBlock={handleDeleteBlock}
                isAddTextActive={isAddTextActive}
                onAddTextAtPoint={handleAddTextAtPoint}
                onPageVisible={(idx) => setCurrentPage(idx)}
              />
            ))}
          </div>
        </main>
      </div>

      {/* Export Result Footer if generated */}
      {result && (
        <div className="border-t border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
          <ResultCard
            filename={result.name}
            filesize={result.size}
            downloadUrl={result.url}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
}
