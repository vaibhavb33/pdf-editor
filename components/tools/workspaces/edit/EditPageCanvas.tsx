"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { FontChoice, TextBlock } from "@/lib/pdf/edit-types";
import { sampleBackgroundColor, sampleTextColor, findNearestBlockStyle } from "@/lib/pdf/text-extractor";
import { ActiveFormattingState } from "./EditToolbar";

interface EditPageCanvasProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfDoc: any;
  pageIndex: number;
  scale: number;
  blocks: TextBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  onUpdateBlock: (blockId: string, updates: Partial<TextBlock>) => void;
  onDeleteBlock: (blockId: string) => void;
  isAddTextActive: boolean;
  onAddTextAtPoint: (coords: {
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
  }) => void;
  onPageVisible?: (pageIndex: number) => void;
  onCaretChange?: (formatting: ActiveFormattingState) => void;
}

export function EditPageCanvas({
  pdfDoc,
  pageIndex,
  scale,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  isAddTextActive,
  onAddTextAtPoint,
  onPageVisible,
  onCaretChange,
}: EditPageCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewport, setViewport] = useState<any | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  const blocksRef = useRef(blocks);
  const onUpdateBlockRef = useRef(onUpdateBlock);

  useEffect(() => {
    blocksRef.current = blocks;
    onUpdateBlockRef.current = onUpdateBlock;
  });

  // Track active page via intersection observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onPageVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            onPageVisible(pageIndex);
          }
        }
      },
      { threshold: [0.1, 0.35, 0.7] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageIndex, onPageVisible]);

  // Render PDF page to canvas with high-DPI scaling
  useEffect(() => {
    let isCancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let activeRenderTask: any = null;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageIndex + 1);
        if (isCancelled) return;

        const vp = page.getViewport({ scale });
        setViewport(vp);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        const width = Math.floor(vp.width);
        const height = Math.floor(vp.height);

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        activeRenderTask = page.render({
          canvasContext: ctx,
          viewport: vp,
        });

        await activeRenderTask.promise;

        if (!isCancelled) {
          setIsRendered(true);

          // Once rendered, sample background and text colors
          for (const block of blocksRef.current) {
            if (block.viewportBounds) {
              const bg = sampleBackgroundColor(ctx, block.viewportBounds, dpr);
              const textCol = sampleTextColor(ctx, block.viewportBounds, bg, dpr);
              onUpdateBlockRef.current(block.id, {
                bgColor: bg,
                color: textCol,
              });
            }
          }
        }
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "name" in err &&
          (err as { name: string }).name === "RenderingCancelledException"
        ) {
          return;
        }
        console.warn(`Error rendering page ${pageIndex + 1}:`, err);
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (activeRenderTask) {
        try {
          activeRenderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, pageIndex, scale]);

  // Handle click on canvas or empty space
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger if clicking on the page background or canvas itself (not inside a text block)
    const target = e.target as HTMLElement;
    const isInsideBlock = target.closest("[data-text-block]");
    if (isInsideBlock || !viewport) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const [pdfX, pdfY] = viewport.convertToPdfPoint(clickX, clickY);

    // Auto-detect nearest style to inherit
    const inheritedStyle = findNearestBlockStyle(blocks, pdfX, pdfY);

    onAddTextAtPoint({
      pageIndex,
      pdfX: Math.round(pdfX * 10) / 10,
      pdfY: Math.round(pdfY * 10) / 10,
      viewportX: clickX,
      viewportY: clickY,
      inheritedStyle,
    });
  };

  const pageDimensions = useMemo(() => {
    if (!viewport) return { width: 595 * scale, height: 842 * scale };
    return { width: Math.floor(viewport.width), height: Math.floor(viewport.height) };
  }, [viewport, scale]);

  return (
    <div
      ref={containerRef}
      id={`page-container-${pageIndex + 1}`}
      className="relative mb-6 flex flex-col items-center select-none"
    >
      {/* Page Header */}
      <div className="mb-1.5 flex items-center justify-between w-full max-w-[850px] px-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
        <span>Page {pageIndex + 1}</span>
        <span>{Math.round(scale * 100)}%</span>
      </div>

      {/* Page Surface (Canvas + Interactive Word Overlay) */}
      <div
        onClick={handlePageClick}
        style={{
          width: `${pageDimensions.width}px`,
          height: `${pageDimensions.height}px`,
        }}
        className={`relative bg-white shadow-md rounded-xs transition-shadow cursor-text dark:bg-zinc-900 ${
          isAddTextActive ? "ring-2 ring-blue-500/50" : "hover:shadow-lg"
        }`}
      >
        {/* Rendered PDF Page Canvas */}
        <canvas
          ref={canvasRef}
          className={`block transition-opacity duration-150 ${
            isRendered ? "opacity-100" : "opacity-0"
          }`}
        />

        {!isRendered && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <svg className="h-4 w-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Rendering page {pageIndex + 1}...</span>
            </div>
          </div>
        )}

        {/* Word-Like Interactive Text Overlay Layer */}
        {viewport && isRendered && (
          <div className="absolute inset-0 pointer-events-none">
            {blocks.map((block) => {
              if (block.isDeleted) return null;

              return (
                <WordLikeTextBlockItem
                  key={block.id}
                  block={block}
                  viewport={viewport}
                  scale={scale}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => onSelectBlock(block.id)}
                  onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                  onDelete={() => onDeleteBlock(block.id)}
                  onCaretChange={onCaretChange}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface WordLikeTextBlockItemProps {
  block: TextBlock;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewport: any;
  scale: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextBlock>) => void;
  onDelete: () => void;
  onCaretChange?: (formatting: ActiveFormattingState) => void;
}

function WordLikeTextBlockItem({
  block,
  viewport,
  scale,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onCaretChange,
}: WordLikeTextBlockItemProps) {
  const editableRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Dragging / Moving state
  const dragStartRef = useRef<{ startX: number; startY: number; initPdfX: number; initPdfY: number }>({
    startX: 0,
    startY: 0,
    initPdfX: 0,
    initPdfY: 0,
  });

  // Resizing state
  const resizeStartRef = useRef<{ startX: number; initWidth: number }>({
    startX: 0,
    initWidth: 0,
  });

  // Calculate CSS viewport bounding box
  const bounds = useMemo(() => {
    const [left, bottom] = viewport.convertToViewportPoint(
      block.pdfBounds.x,
      block.pdfBounds.y
    );
    const [right, top] = viewport.convertToViewportPoint(
      block.pdfBounds.x + block.pdfBounds.width,
      block.pdfBounds.y + block.pdfBounds.height
    );

    const x = Math.min(left, right);
    const y = Math.min(top, bottom);
    const width = Math.max(30, Math.abs(right - left));
    const height = Math.max(16, Math.abs(bottom - top));

    return { x, y, width, height };
  }, [viewport, block.pdfBounds]);

  const isModified = block.isNew || block.isEdited || block.currentText !== block.originalText;

  // Sync contentEditable innerText when currentText changes from outside
  useEffect(() => {
    if (editableRef.current && editableRef.current.innerText !== block.currentText) {
      // Only set if not currently focused by user
      if (document.activeElement !== editableRef.current) {
        editableRef.current.innerText = block.currentText;
      }
    }
  }, [block.currentText]);

  // Sync toolbar when selection changes or block is selected
  const syncToolbarFormatting = useCallback(() => {
    if (!onCaretChange) return;
    onCaretChange({
      fontFamily: block.fontFamily,
      fontCategory: block.fontCategory,
      fontSize: block.fontSize,
      isBold: block.isBold,
      isItalic: block.isItalic,
      isUnderline: block.isUnderline || false,
      textAlign: block.textAlign || "left",
      color: block.color,
      isSubstituted: block.isSubstitutedFont,
      substitutedFontName: block.substitutedFontName,
    });
  }, [block, onCaretChange]);

  // Focus management
  useEffect(() => {
    if (isSelected && editableRef.current) {
      if (document.activeElement !== editableRef.current) {
        editableRef.current.focus();
      }
      syncToolbarFormatting();
    }
  }, [isSelected, syncToolbarFormatting]);

  // Handle Input typing in contentEditable
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.innerText;
    onUpdate({
      currentText: newText,
      isEdited: true,
    });
    syncToolbarFormatting();
  };

  // Plain-text paste
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    if (editableRef.current) {
      onUpdate({
        currentText: editableRef.current.innerText,
        isEdited: true,
      });
    }
  };

  // Keyboard formatting shortcuts (Ctrl+B, Ctrl+I, Ctrl+U)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        onUpdate({ isBold: !block.isBold, isEdited: true });
      } else if (key === "i") {
        e.preventDefault();
        onUpdate({ isItalic: !block.isItalic, isEdited: true });
      } else if (key === "u") {
        e.preventDefault();
        onUpdate({ isUnderline: !block.isUnderline, isEdited: true });
      }
    } else if (e.key === "Escape") {
      editableRef.current?.blur();
    }
  };

  // Move Drag Handler
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initPdfX: block.pdfBounds.x,
      initPdfY: block.pdfBounds.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaScreenX = (moveEvent.clientX - dragStartRef.current.startX) / scale;
      const deltaScreenY = (moveEvent.clientY - dragStartRef.current.startY) / scale;

      // In PDF coordinate space, Y is inverted (0 at bottom)
      const newPdfX = Math.round((dragStartRef.current.initPdfX + deltaScreenX) * 10) / 10;
      const newPdfY = Math.round((dragStartRef.current.initPdfY - deltaScreenY) * 10) / 10;

      onUpdate({
        x: newPdfX,
        y: newPdfY + block.pdfBounds.height - block.fontSize,
        pdfBounds: {
          ...block.pdfBounds,
          x: newPdfX,
          y: newPdfY,
        },
        isEdited: true,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Resize Width Handler
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      initWidth: block.pdfBounds.width,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - resizeStartRef.current.startX) / scale;
      const newWidth = Math.max(40, Math.round((resizeStartRef.current.initWidth + deltaX) * 10) / 10);

      onUpdate({
        pdfBounds: {
          ...block.pdfBounds,
          width: newWidth,
        },
        isEdited: true,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const cssFontSize = Math.max(7, Math.round(block.fontSize * scale));

  const fontFamilyStyle =
    block.fontCategory === "calibri"
      ? "Carlito, Calibri, sans-serif"
      : block.fontCategory === "cambria"
      ? "Caladea, Cambria, serif"
      : block.fontCategory === "serif"
      ? "'Liberation Serif', 'Times New Roman', Times, serif"
      : block.fontCategory === "monospace"
      ? "'Liberation Mono', 'Courier New', Courier, monospace"
      : block.fontCategory === "devanagari"
      ? "'Noto Sans Devanagari', sans-serif"
      : block.fontCategory === "gujarati"
      ? "'Noto Sans Gujarati', sans-serif"
      : block.fontCategory === "roboto"
      ? "Roboto, sans-serif"
      : "'Liberation Sans', Arial, Helvetica, sans-serif";

  const textColorRgb = block.color
    ? `rgb(${Math.round(block.color.r * 255)}, ${Math.round(block.color.g * 255)}, ${Math.round(block.color.b * 255)})`
    : "#111827";

  const bgColorRgb = block.bgColor
    ? `rgb(${Math.round(block.bgColor.r * 255)}, ${Math.round(block.bgColor.g * 255)}, ${Math.round(block.bgColor.b * 255)})`
    : "#ffffff";

  // Hide original text by turning on solid background as soon as modified, focused, or active
  const shouldMaskOriginal = isSelected || isModified;

  return (
    <div
      data-text-block={block.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        left: `${bounds.x}px`,
        top: `${bounds.y}px`,
        width: `${bounds.width}px`,
        minHeight: `${bounds.height}px`,
      }}
      className={`absolute pointer-events-auto transition-shadow ${
        isDragging
          ? "z-40 ring-2 ring-blue-500 opacity-80 cursor-grabbing shadow-lg"
          : isResizing
          ? "z-40 ring-2 ring-blue-500 shadow-md"
          : isSelected
          ? "z-30 ring-2 ring-blue-600 shadow-md"
          : isHovered
          ? "z-20 outline-dashed outline-1 outline-blue-500 shadow-2xs"
          : isModified
          ? "z-10 shadow-3xs"
          : "z-1"
      } rounded-xs`}
    >
      {/* Background Mask to hide original PDF glyphs without ghost text */}
      {shouldMaskOriginal && (
        <div
          className="absolute inset-0 rounded-xs pointer-events-none"
          style={{ backgroundColor: bgColorRgb }}
        />
      )}

      {/* Move Drag Handle (Visible when selected) */}
      {isSelected && (
        <div
          onMouseDown={handleDragStart}
          className="absolute -top-6 left-0 flex items-center gap-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs cursor-move select-none"
          title="Drag to reposition text box"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
          <span>Move</span>
        </div>
      )}

      {/* Floating Action Badge & Delete Button (Visible when selected) */}
      {isSelected && (
        <div className="absolute -top-6 right-0 flex items-center gap-1 rounded bg-zinc-900/90 px-1.5 py-0.5 text-[10px] text-white shadow-xs select-none">
          <span className="text-zinc-300">
            {Math.round(block.fontSize)}pt {block.fontFamily}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="ml-1 text-red-300 hover:text-red-100"
            title="Delete text box (Delete key)"
          >
            ×
          </button>
        </div>
      )}

      {/* Word-Like contentEditable Rich Editable Text Container */}
      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onSelect={syncToolbarFormatting}
        onKeyUp={syncToolbarFormatting}
        onMouseUp={syncToolbarFormatting}
        style={{
          fontSize: `${cssFontSize}px`,
          fontFamily: fontFamilyStyle,
          fontWeight: block.isBold ? 700 : 400,
          fontStyle: block.isItalic ? "italic" : "normal",
          textDecoration: block.isUnderline ? "underline" : "none",
          textAlign: block.textAlign || "left",
          color: textColorRgb,
          lineHeight: block.lineHeight || 1.25,
          opacity: shouldMaskOriginal ? 1 : 0.001, // If not modified/selected, let crisp PDF canvas text show through
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
        className="relative w-full h-full min-h-[16px] outline-hidden cursor-text p-0 m-0"
        title="Click to edit text directly"
      >
        {block.currentText}
      </div>

      {/* Right Edge Resize Handle (Visible when selected) */}
      {isSelected && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500/30 rounded-r-xs flex items-center justify-center"
          title="Drag to resize text wrapping width"
        >
          <div className="h-4 w-1 rounded-full bg-blue-600 shadow-xs" />
        </div>
      )}
    </div>
  );
}

