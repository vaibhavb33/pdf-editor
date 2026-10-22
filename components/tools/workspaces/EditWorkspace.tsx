"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { useToast } from "@/components/ui/Toast";
import { FontChoice, TextBlock } from "@/lib/pdf/edit-types";
import { extractPageText } from "@/lib/pdf/text-extractor";
import { applyPdfEdits } from "@/lib/pdf/edit-engine";
import { createDownloadBlob } from "@/lib/pdf/types";
import { EditToolbar, ActiveFormattingState } from "./edit/EditToolbar";
import { EditThumbnailSidebar } from "./edit/EditThumbnailSidebar";
import { EditPageCanvas } from "./edit/EditPageCanvas";

export function EditWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  // Text blocks state & history stack
  const [blocks, setBlocks] = useState<TextBlock[]>([]);
  const [history, setHistory] = useState<TextBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeFormatting, setActiveFormatting] = useState<ActiveFormattingState | null>(null);

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

  // Helper to push a new state to Undo/Redo history
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
      toast.success(
        "PDF Loaded",
        `Extracted ${allBlocks.length} editable text blocks across ${doc.numPages} page(s).`
      );
    } catch (err: unknown) {
      let msg = "Failed to load and parse PDF document.";
      if (err instanceof Error) {
        if (err.name === "PasswordException") {
          msg = "This PDF is password-protected. Please unlock it with the Unlock PDF tool first.";
        } else {
          msg = err.message;
        }
      }
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

  // Global Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Selected block
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  // Apply formatting to selected block
  const handleApplyFormatting = (updates: Partial<TextBlock>) => {
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

    // Update active formatting state for toolbar
    if (activeFormatting) {
      setActiveFormatting({
        ...activeFormatting,
        ...(updates.fontFamily && { fontFamily: updates.fontFamily }),
        ...(updates.fontCategory && { fontCategory: updates.fontCategory }),
        ...(updates.fontSize && { fontSize: updates.fontSize }),
        ...(updates.isBold !== undefined && { isBold: updates.isBold }),
        ...(updates.isItalic !== undefined && { isItalic: updates.isItalic }),
        ...(updates.isUnderline !== undefined && { isUnderline: updates.isUnderline }),
        ...(updates.textAlign && { textAlign: updates.textAlign }),
        ...(updates.color && { color: updates.color }),
      });
    }
  };

  // Clear formatting
  const handleClearFormatting = () => {
    if (!selectedBlockId) return;
    handleApplyFormatting({
      fontFamily: "Arial",
      fontCategory: "sans-serif",
      fontSize: 12,
      isBold: false,
      isItalic: false,
      isUnderline: false,
      textAlign: "left",
      color: { r: 0.07, g: 0.1, b: 0.15 },
      isSubstitutedFont: false,
      substitutedFontName: undefined,
    });
    toast.info("Cleared", "Formatting reset to default Arial 12pt.");
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

  // Add text block at specific coordinates (either by toolbar tool or clicking empty space)
  const handleAddTextAtPoint = ({
    pageIndex,
    pdfX,
    pdfY,
    viewportX,
    viewportY,
    inheritedStyle,
  }: {
    pageIndex: number;
    pdfX: number;
    pdfY: number;
    viewportX: number;
    viewportY: number;
    inheritedStyle?: {
      fontFamily: string;
      fontCategory: FontChoice;
      fontSize: number;
      color: { r: number; g: number; b: number };
    };
  }) => {
    const newId = `new_block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const fontSize = inheritedStyle?.fontSize || 12;
    const fontFamily = inheritedStyle?.fontFamily || "Arial";
    const fontCategory = inheritedStyle?.fontCategory || "sans-serif";
    const color = inheritedStyle?.color || { r: 0.07, g: 0.1, b: 0.15 };
    const defaultText = "Type text here";

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
        width: Math.max(120, fontSize * 0.6 * defaultText.length),
        height: fontSize * 1.3,
      },
      viewportBounds: {
        left: viewportX,
        top: viewportY,
        width: Math.max(120, fontSize * 0.6 * defaultText.length) * scale,
        height: fontSize * 1.3 * scale,
      },
      fontSize,
      fontFamily,
      fontCategory,
      isBold: false,
      isItalic: false,
      isUnderline: false,
      textAlign: "left",
      color,
      bgColor: { r: 1, g: 1, b: 1 },
      isNew: true,
      isEdited: true,
      isSingleLine: false,
      lineHeight: 1.25,
    };

    const nextBlocks = [...blocks, newBlock];
    pushHistory(nextBlocks);
    setSelectedBlockId(newId);
    setIsAddTextActive(false);
  };

  // Zoom controls
  const handleZoomIn = () => setScale((s) => Math.min(2.5, Math.round((s + 0.15) * 100) / 100));
  const handleZoomOut = () => setScale((s) => Math.max(0.5, Math.round((s - 0.15) * 100) / 100));
  const handleResetZoom = () => setScale(1.0);
  const handleFitWidth = () => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth - (isSidebarOpen ? 240 : 60);
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
    setExportStage("Analyzing text modifications and wrapping...");

    try {
      const baseName = file.name.replace(/\.pdf$/i, "");
      const outputFilename = `${baseName}-edited.pdf`;

      const res = await applyPdfEdits({
        fileData: fileBytes,
        blocks,
        outputFilename,
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

      // Direct download trigger
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
    setActiveFormatting(null);
    setResult(null);
    setError(null);
    setIsScannedPdf(false);
  };

  // If no file loaded yet, render clean dropzone
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
              <p className="text-xs text-zinc-500">Extracting PDF pages, typography and layout...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full Editor View
  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[600px] w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
      {/* Top Word-Style Ribbon Toolbar */}
      <EditToolbar
        selectedBlock={selectedBlock}
        activeFormatting={activeFormatting}
        onApplyFormatting={handleApplyFormatting}
        onClearFormatting={handleClearFormatting}
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
              <strong>Scanned Document:</strong> No editable text found, this PDF is a scanned image. You can still add new text anywhere.
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
            if (!isAddTextActive) {
              setSelectedBlockId(null);
              setActiveFormatting(null);
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
                onCaretChange={(fmt) => setActiveFormatting(fmt)}
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

