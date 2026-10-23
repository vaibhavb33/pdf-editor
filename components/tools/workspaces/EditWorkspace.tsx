"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dropzone } from "@/components/ui/Dropzone";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ResultCard } from "@/components/ui/ResultCard";
import { useToast } from "@/components/ui/Toast";
import { FontChoice, TextBlock, TextRun, PageBorderConfig } from "@/lib/pdf/edit-types";
import { extractPageText } from "@/lib/pdf/text-extractor";
import { applyPdfEdits } from "@/lib/pdf/edit-engine";
import { createDownloadBlob } from "@/lib/pdf/types";
import { EditToolbar, ActiveFormattingState } from "./edit/EditToolbar";
import { EditThumbnailSidebar } from "./edit/EditThumbnailSidebar";
import { EditPageCanvas, getCaretCharacterOffset } from "./edit/EditPageCanvas";
import { PageBorderModal } from "./edit/PageBorderModal";

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
  const [pageSizes, setPageSizes] = useState<{ width: number; height: number }[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [isAddTextActive, setIsAddTextActive] = useState<boolean>(false);
  const [isScannedPdf, setIsScannedPdf] = useState<boolean>(false);

  // Responsive sidebar collapse on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Loading & export states
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStage, setExportStage] = useState<string>("");
  const [result, setResult] = useState<{ url: string; size: number; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Page Border state
  const [pageBorder, setPageBorder] = useState<PageBorderConfig>({
    enabled: false,
    style: "solid",
    width: 1.5,
    color: "#2563eb",
    margin: 36,
    cornerRadius: 0,
    scope: "all",
  });
  const [isPageBorderModalOpen, setIsPageBorderModalOpen] = useState<boolean>(false);

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = await (pdfjs.getDocument as any)({
        data: buffer,
        fontExtraProperties: true,
      }).promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);

      // Extract text blocks and native unscaled page dimensions for all pages
      const allBlocks: TextBlock[] = [];
      const extractedSizes: { width: number; height: number }[] = [];

      for (let i = 0; i < doc.numPages; i++) {
        const page = await doc.getPage(i + 1);
        const vp = page.getViewport({ scale: 1.0 });
        extractedSizes.push({ width: Math.floor(vp.width), height: Math.floor(vp.height) });
        const pageData = await extractPageText(page, i, 1.0);
        allBlocks.push(...pageData.blocks);
      }

      setPageSizes(extractedSizes);

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

  // Selected block
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  // Apply formatting to selected block or active character range
  const handleApplyFormatting = useCallback(
    async (updates: Partial<TextBlock>) => {
      if (!selectedBlockId) return;

      // Preload font if fontFamily is specified to prevent browser layout reflow pops
      if (updates.fontFamily && typeof document !== "undefined" && document.fonts) {
        try {
          const sz = updates.fontSize || selectedBlock?.fontSize || 12;
          await document.fonts.load(`${sz}px "${updates.fontFamily}"`);
        } catch {
          // ignore font load errors
        }
      }

      const targetBlock = blocks.find((b) => b.id === selectedBlockId);
      if (!targetBlock) return;

      let nextRuns: TextRun[] = targetBlock.runs ? [...targetBlock.runs] : [];
      const sel = typeof window !== "undefined" ? window.getSelection() : null;
      const hasSelection = Boolean(sel && !sel.isCollapsed && sel.rangeCount > 0);

      if (hasSelection && targetBlock.runs && targetBlock.runs.length > 0) {
        const activeEl = document.querySelector(
          `[data-text-block="${selectedBlockId}"] [contenteditable="true"]`
        ) as HTMLElement | null;

        if (activeEl) {
          const { start, end } = getCaretCharacterOffset(activeEl);
          if (start < end) {
            const newRuns: TextRun[] = [];
            let curOffset = 0;

            for (const run of targetBlock.runs) {
              const rLen = run.text.length;
              const rStart = curOffset;
              const rEnd = curOffset + rLen;

              if (rEnd <= start || rStart >= end) {
                newRuns.push(run);
              } else {
                const sliceStart = Math.max(0, start - rStart);
                const sliceEnd = Math.min(rLen, end - rStart);

                const partBefore = run.text.slice(0, sliceStart);
                const partSelected = run.text.slice(sliceStart, sliceEnd);
                const partAfter = run.text.slice(sliceEnd);

                if (partBefore) {
                  newRuns.push({ ...run, id: `${run.id}_0`, text: partBefore });
                }
                if (partSelected) {
                  newRuns.push({
                    ...run,
                    id: `${run.id}_sel_${Date.now()}`,
                    text: partSelected,
                    ...(updates.fontFamily && { fontFamily: updates.fontFamily }),
                    ...(updates.fontCategory && { fontCategory: updates.fontCategory }),
                    ...(updates.fontSize && { fontSize: updates.fontSize }),
                    ...(updates.isBold !== undefined && { isBold: updates.isBold }),
                    ...(updates.isItalic !== undefined && { isItalic: updates.isItalic }),
                    ...(updates.isUnderline !== undefined && { isUnderline: updates.isUnderline }),
                    ...(updates.color && { color: updates.color }),
                    userOverride: true,
                    embeddedFontFamily: updates.fontFamily ? undefined : run.embeddedFontFamily,
                  });
                }
                if (partAfter) {
                  newRuns.push({ ...run, id: `${run.id}_2`, text: partAfter });
                }
              }
              curOffset += rLen;
            }
            nextRuns = newRuns;
          }
        }
      } else if (targetBlock.runs && targetBlock.runs.length > 0) {
        nextRuns = targetBlock.runs.map((r) => ({
          ...r,
          ...(updates.fontFamily && { fontFamily: updates.fontFamily }),
          ...(updates.fontCategory && { fontCategory: updates.fontCategory }),
          ...(updates.fontSize && { fontSize: updates.fontSize }),
          ...(updates.isBold !== undefined && { isBold: updates.isBold }),
          ...(updates.isItalic !== undefined && { isItalic: updates.isItalic }),
          ...(updates.isUnderline !== undefined && { isUnderline: updates.isUnderline }),
          ...(updates.color && { color: updates.color }),
          userOverride: true,
          embeddedFontFamily: updates.fontFamily ? undefined : r.embeddedFontFamily,
        }));
      }

      const nextBlocks = blocks.map((b) =>
        b.id === selectedBlockId
          ? {
              ...b,
              ...updates,
              runs: nextRuns.length > 0 ? nextRuns : b.runs,
              userOverride: true,
              embeddedFontFamily: updates.fontFamily ? undefined : b.embeddedFontFamily,
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
    },
    [selectedBlockId, blocks, selectedBlock, pushHistory, activeFormatting]
  );

  // Global Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        setIsDebugModalOpen((prev) => !prev);
        return;
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && selectedBlockId) {
        const k = e.key.toLowerCase();
        if (k === "l") {
          e.preventDefault();
          handleApplyFormatting({ textAlign: "left", userOverride: true });
        } else if (k === "e") {
          e.preventDefault();
          handleApplyFormatting({ textAlign: "center", userOverride: true });
        } else if (k === "r") {
          e.preventDefault();
          handleApplyFormatting({ textAlign: "right", userOverride: true });
        } else if (k === "j") {
          e.preventDefault();
          handleApplyFormatting({ textAlign: "justify", userOverride: true });
        }
      } else if (e.key === "Escape") {
        if (isDebugModalOpen) {
          setIsDebugModalOpen(false);
          return;
        }
        setSelectedBlockId(null);
        setIsAddTextActive(false);
      } else if ((e.key === "Delete" || e.key === "Backspace") && !isInput && selectedBlockId) {
        e.preventDefault();
        handleDeleteSelectedBlock();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    selectedBlockId,
    handleDeleteSelectedBlock,
    isDebugModalOpen,
    handleApplyFormatting,
  ]);

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
    const runId = `run_${newId}_0`;
    const initialRun = {
      id: runId,
      text: defaultText,
      fontFamily,
      fontCategory,
      fontSize,
      isBold: false,
      isItalic: false,
      isUnderline: false,
      color,
    };

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
      runs: [initialRun],
      layout: {
        columnX: pdfX,
        columnWidth: Math.max(120, fontSize * 0.6 * defaultText.length),
        firstLineIndent: 0,
        lineHeight: fontSize * 1.25,
        textAlign: "left",
        isLineMode: false,
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

  const handleSplitBlock = (blockId: string, caretOffset: number) => {
    const blockIndex = blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;
    const block = blocks[blockIndex];
    const fullText = block.currentText;

    const textBefore = fullText.slice(0, caretOffset).trimEnd();
    const textAfter = fullText.slice(caretOffset).trimStart() || " ";

    // Partition runs across split point
    const runsBefore: TextRun[] = [];
    const runsAfter: TextRun[] = [];
    let curOffset = 0;

    for (const r of block.runs || []) {
      const rLen = r.text.length;
      if (curOffset + rLen <= caretOffset) {
        runsBefore.push(r);
      } else if (curOffset >= caretOffset) {
        runsAfter.push(r);
      } else {
        const splitInRun = caretOffset - curOffset;
        const partBefore = r.text.slice(0, splitInRun);
        const partAfter = r.text.slice(splitInRun);
        if (partBefore) {
          runsBefore.push({ ...r, id: `${r.id}_a`, text: partBefore });
        }
        if (partAfter) {
          runsAfter.push({ ...r, id: `${r.id}_b`, text: partAfter });
        }
      }
      curOffset += rLen;
    }

    const fallbackRunAfter: TextRun = {
      id: `run_${Date.now()}_split`,
      text: textAfter,
      fontFamily: block.fontFamily,
      fontCategory: block.fontCategory,
      fontSize: block.fontSize,
      isBold: block.isBold,
      isItalic: block.isItalic,
      isUnderline: block.isUnderline,
      color: block.color,
    };

    const newBlockId = `split_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const lineGap = block.layout?.lineHeight || block.fontSize * 1.25;

    const updatedBlock: TextBlock = {
      ...block,
      currentText: textBefore,
      runs: runsBefore.length > 0 ? runsBefore : [{ ...fallbackRunAfter, text: textBefore }],
      isEdited: true,
    };

    const newBlock: TextBlock = {
      ...block,
      id: newBlockId,
      originalText: "",
      currentText: textAfter,
      runs: runsAfter.length > 0 ? runsAfter : [fallbackRunAfter],
      y: block.y - lineGap,
      pdfBounds: {
        ...block.pdfBounds,
        y: block.pdfBounds.y - lineGap,
      },
      viewportBounds: {
        ...block.viewportBounds,
        top: block.viewportBounds.top + lineGap * scale,
      },
      layout: {
        ...(block.layout || {
          columnX: block.x,
          columnWidth: block.pdfBounds.width,
          firstLineIndent: 0,
          lineHeight: lineGap,
          textAlign: block.textAlign || "left",
          isLineMode: false,
        }),
      },
      isNew: true,
      isEdited: true,
    };

    const nextBlocks = [...blocks];
    nextBlocks[blockIndex] = updatedBlock;
    nextBlocks.splice(blockIndex + 1, 0, newBlock);
    pushHistory(nextBlocks);
    setSelectedBlockId(newBlockId);
  };

  const handleMergeWithPrevBlock = (blockId: string) => {
    const blockIndex = blocks.findIndex((b) => b.id === blockId);
    if (blockIndex <= 0) return;
    const block = blocks[blockIndex];
    const prevBlock = blocks[blockIndex - 1];
    if (prevBlock.pageIndex !== block.pageIndex || prevBlock.isDeleted) return;

    const mergedText = prevBlock.currentText + " " + block.currentText;
    const mergedRuns = [...(prevBlock.runs || []), ...(block.runs || [])];

    const updatedPrevBlock: TextBlock = {
      ...prevBlock,
      currentText: mergedText,
      runs: mergedRuns,
      isEdited: true,
    };
    const updatedCurrentBlock: TextBlock = {
      ...block,
      isDeleted: true,
    };

    const nextBlocks = [...blocks];
    nextBlocks[blockIndex - 1] = updatedPrevBlock;
    nextBlocks[blockIndex] = updatedCurrentBlock;
    pushHistory(nextBlocks);
    setSelectedBlockId(prevBlock.id);
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
        pageBorder,
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

  // If no file loaded yet, render clean dropzone centered in the viewport
  if (!file || !pdfDoc) {
    return (
      <div className="flex h-full w-full min-h-0 flex-col items-center justify-center p-4">
        <div className="mx-auto w-full max-w-2xl">
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

  // Full Fixed App-Shell Editor View
  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-hidden bg-zinc-100 select-none dark:bg-zinc-950">
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
        documentBlocks={blocks}
        onOpenPageBorder={() => setIsPageBorderModalOpen(true)}
      />

      {/* Scanned PDF Warning Banner */}
      {isScannedPdf && (
        <div
          role="alert"
          className="flex shrink-0 items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
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
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
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
          style={{
            overscrollBehavior: "contain",
            scrollPaddingTop: "24px",
            scrollPaddingBottom: "36px",
          }}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-auto bg-zinc-100 px-4 py-8 sm:px-8 sm:py-10 dark:bg-zinc-950"
        >
          <div className="mx-auto flex flex-col items-center gap-6 pb-8">
            {Array.from({ length: numPages }).map((_, i) => (
              <EditPageCanvas
                key={i}
                pdfDoc={pdfDoc}
                pageIndex={i}
                scale={scale}
                initialPageSize={pageSizes[i]}
                blocks={blocks.filter((b) => b.pageIndex === i)}
                selectedBlockId={selectedBlockId}
                onSelectBlock={(id) => {
                  setSelectedBlockId(id);
                  setIsAddTextActive(false);
                }}
                onUpdateBlock={handleUpdateBlock}
                onDeleteBlock={handleDeleteBlock}
                onSplitBlock={handleSplitBlock}
                onMergeWithPrevBlock={handleMergeWithPrevBlock}
                isAddTextActive={isAddTextActive}
                onAddTextAtPoint={handleAddTextAtPoint}
                onPageVisible={(idx) => setCurrentPage(idx)}
                onCaretChange={(fmt) => setActiveFormatting(fmt)}
                pageBorder={pageBorder}
              />
            ))}
          </div>
        </main>
      </div>

      {/* Docked Status Bar (Fixed at bottom outside scrollable area) */}
      <footer
        id="edit-pdf-status-bar"
        aria-label="Document Status Bar"
        className="flex h-9 shrink-0 items-center justify-between border-t border-zinc-200 bg-white px-3 text-xs text-zinc-600 select-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            Page {currentPage + 1} of {numPages}
          </span>
          <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
          <span className="hidden sm:inline text-zinc-500 dark:text-zinc-400">
            {blocks.filter((b) => !b.isDeleted).length} editable text blocks
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          {isExporting ? (
            <span className="flex items-center gap-1.5 font-medium text-blue-600">
              <span className="h-2 w-2 animate-ping rounded-full bg-blue-600" />
              Saving changes...
            </span>
          ) : historyIndex > 0 ? (
            <span className="text-zinc-500 dark:text-zinc-400">
              {history.length - 1} edit{history.length - 1 > 1 ? "s" : ""} recorded
            </span>
          ) : (
            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              ✓ Ready
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            title="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-1 text-xs font-semibold text-zinc-700 hover:text-blue-600 dark:text-zinc-300"
            title="Reset Zoom to 100%"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleFitWidth}
            className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            title="Fit document to screen width"
          >
            Fit
          </button>
        </div>
      </footer>

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

      {/* Hidden Debug Panel (Ctrl+Shift+D) */}
      {isDebugModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  Ctrl+Shift+D
                </span>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Font Detection &amp; Mapping Debugger (Page {currentPage + 1})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDebugModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <th className="p-2 font-semibold">Text Snippet</th>
                    <th className="p-2 font-semibold">Raw PDF.js Name</th>
                    <th className="p-2 font-semibold">Normalized Family</th>
                    <th className="p-2 font-semibold">Mapped Font</th>
                    <th className="p-2 font-semibold">Status</th>
                    <th className="p-2 font-semibold">Confidence</th>
                    <th className="p-2 font-semibold">Flags</th>
                    <th className="p-2 font-semibold">Embedded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {blocks
                    .filter((b) => b.pageIndex === currentPage && !b.isDeleted)
                    .map((b) => (
                      <tr key={b.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                        <td className="max-w-[140px] truncate p-2 font-mono text-[11px]" title={b.currentText}>
                          {b.currentText.slice(0, 30) || "—"}
                        </td>
                        <td className="p-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                          {b.detection?.rawName || b.fontName || "—"}
                        </td>
                        <td className="p-2 font-semibold text-zinc-800 dark:text-zinc-200">
                          {b.detection?.normalizedFamily || b.fontFamily}
                        </td>
                        <td className="p-2 text-zinc-700 dark:text-zinc-300">
                          {b.detection?.mappedFont || b.substitutedFontName || b.fontFamily}
                        </td>
                        <td className="p-2">
                          {b.detection?.isExact ? (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Exact
                            </span>
                          ) : (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Substituted
                            </span>
                          )}
                        </td>
                        <td className="p-2 font-mono">
                          {Math.round((b.detection?.confidence ?? 0.8) * 100)}%
                        </td>
                        <td className="p-2 font-mono text-[10px] text-zinc-500">
                          {[
                            b.detection?.flags?.isSerif ? "Serif" : "Sans",
                            b.detection?.flags?.isMonospace ? "Mono" : null,
                            b.isBold ? "Bold" : null,
                            b.isItalic ? "Italic" : null,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </td>
                        <td className="p-2">
                          {b.embeddedFontFamily ? (
                            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                              FontFace
                            </span>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-zinc-200 px-4 py-2 text-right text-[11px] text-zinc-500 dark:border-zinc-800">
              Press <kbd className="rounded border bg-zinc-100 px-1 dark:bg-zinc-800">Esc</kbd> or click ✕ to close
            </div>
          </div>
        </div>
      )}

      {/* Page Border Settings Modal */}
      <PageBorderModal
        isOpen={isPageBorderModalOpen}
        onClose={() => setIsPageBorderModalOpen(false)}
        config={pageBorder}
        currentPage={currentPage}
        totalPages={numPages}
        onChangeConfig={setPageBorder}
        onRemoveBorder={() => setPageBorder((prev) => ({ ...prev, enabled: false }))}
      />
    </div>
  );
}

