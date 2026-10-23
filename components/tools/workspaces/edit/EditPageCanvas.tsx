"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { FontChoice, TextBlock, TextRun } from "@/lib/pdf/edit-types";
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
  onSplitBlock?: (blockId: string, caretOffset: number) => void;
  onMergeWithPrevBlock?: (blockId: string) => void;
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
  initialPageSize?: { width: number; height: number };
  onPageVisible?: (pageIndex: number) => void;
  onCaretChange?: (formatting: ActiveFormattingState) => void;
}

/**
 * Accurately calculates character start and end offsets across nested DOM nodes.
 */
export function getCaretCharacterOffset(element: HTMLElement): { start: number; end: number } {
  let start = 0;
  let end = 0;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { start: 0, end: 0 };

  try {
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    start = preCaretRange.toString().length;

    const preEndRange = range.cloneRange();
    preEndRange.selectNodeContents(element);
    preEndRange.setEnd(range.endContainer, range.endOffset);
    end = preEndRange.toString().length;
  } catch {
    // fallback
  }

  return { start, end };
}

/**
 * Restores the browser selection / caret to exact character start and end offsets.
 */
export function restoreCaretCharacterOffset(element: HTMLElement, start: number, end: number): void {
  const sel = window.getSelection();
  if (!sel) return;

  let currentOffset = 0;
  const found: {
    startNode: Node | null;
    startOffset: number;
    endNode: Node | null;
    endOffset: number;
  } = {
    startNode: null,
    startOffset: 0,
    endNode: null,
    endOffset: 0,
  };

  function traverse(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      const textLen = (node.textContent || "").length;
      if (!found.startNode && currentOffset + textLen >= start) {
        found.startNode = node;
        found.startOffset = Math.max(0, start - currentOffset);
      }
      if (!found.endNode && currentOffset + textLen >= end) {
        found.endNode = node;
        found.endOffset = Math.max(0, end - currentOffset);
        return true;
      }
      currentOffset += textLen;
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (traverse(node.childNodes[i])) return true;
      }
    }
    return false;
  }

  traverse(element);

  if (found.startNode) {
    try {
      const range = document.createRange();
      range.setStart(found.startNode, Math.min(found.startOffset, (found.startNode.textContent || "").length));
      if (found.endNode) {
        range.setEnd(found.endNode, Math.min(found.endOffset, (found.endNode.textContent || "").length));
      } else {
        range.collapse(true);
      }
      sel.removeAllRanges();
      sel.addRange(range);
    } catch {
      // ignore range errors
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Renders an array of TextRuns into clean HTML spans for contentEditable.
 */
function renderRunsToHtml(
  runs: TextRun[] | undefined,
  defaultText: string,
  baseBlock: {
    isBold: boolean;
    isItalic: boolean;
    isUnderline?: boolean;
    color: { r: number; g: number; b: number };
  }
): string {
  if (runs && runs.length > 0) {
    return runs
      .map((run) => {
        const styles = [
          run.isBold ? "font-weight: 700;" : "font-weight: 400;",
          run.isItalic ? "font-style: italic;" : "font-style: normal;",
          run.isUnderline ? "text-decoration: underline;" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return `<span data-run-id="${run.id}" style="${styles}">${escapeHtml(run.text)}</span>`;
      })
      .join("");
  }

  const styles = [
    baseBlock.isBold ? "font-weight: 700;" : "font-weight: 400;",
    baseBlock.isItalic ? "font-style: italic;" : "font-style: normal;",
    baseBlock.isUnderline ? "text-decoration: underline;" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `<span style="${styles}">${escapeHtml(defaultText)}</span>`;
}

/**
 * Walks contentEditable DOM tree to extract current text and preserve per-run bold/italic formatting.
 */
function extractRunsFromDom(
  container: HTMLElement,
  baseBlock: TextBlock
): { text: string; runs: TextRun[] } {
  const runs: TextRun[] = [];
  let fullText = "";

  function walk(
    node: Node,
    currentStyle: { isBold: boolean; isItalic: boolean; isUnderline: boolean }
  ) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text.length > 0) {
        fullText += text;
        const lastRun = runs[runs.length - 1];
        if (
          lastRun &&
          lastRun.isBold === currentStyle.isBold &&
          lastRun.isItalic === currentStyle.isItalic &&
          lastRun.isUnderline === currentStyle.isUnderline
        ) {
          lastRun.text += text;
        } else {
          runs.push({
            id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            text,
            fontFamily: baseBlock.fontFamily,
            fontCategory: baseBlock.fontCategory,
            fontSize: baseBlock.fontSize,
            isBold: currentStyle.isBold,
            isItalic: currentStyle.isItalic,
            isUnderline: currentStyle.isUnderline,
            color: baseBlock.color,
          });
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === "BR") {
        fullText += "\n";
        return;
      }

      const style = window.getComputedStyle(el);
      const isBold =
        style.fontWeight === "bold" ||
        parseInt(style.fontWeight, 10) >= 600 ||
        el.tagName === "B" ||
        el.tagName === "STRONG" ||
        currentStyle.isBold;

      const isItalic =
        style.fontStyle === "italic" ||
        style.fontStyle === "oblique" ||
        el.tagName === "I" ||
        el.tagName === "EM" ||
        currentStyle.isItalic;

      const isUnderline =
        style.textDecorationLine.includes("underline") ||
        el.tagName === "U" ||
        currentStyle.isUnderline;

      const newStyle = { isBold, isItalic, isUnderline };

      for (let i = 0; i < el.childNodes.length; i++) {
        walk(el.childNodes[i], newStyle);
      }
    }
  }

  const initialStyle = {
    isBold: baseBlock.isBold,
    isItalic: baseBlock.isItalic,
    isUnderline: baseBlock.isUnderline || false,
  };

  for (let i = 0; i < container.childNodes.length; i++) {
    walk(container.childNodes[i], initialStyle);
  }

  return { text: fullText || container.innerText || "", runs };
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
  onSplitBlock,
  onMergeWithPrevBlock,
  isAddTextActive,
  onAddTextAtPoint,
  initialPageSize,
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
    const target = e.target as HTMLElement;
    const isInsideBlock = target.closest("[data-text-block]");
    if (isInsideBlock || !viewport) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const [pdfX, pdfY] = viewport.convertToPdfPoint(clickX, clickY);
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
    if (viewport) {
      return { width: Math.floor(viewport.width), height: Math.floor(viewport.height) };
    }
    if (initialPageSize) {
      return {
        width: Math.floor(initialPageSize.width * scale),
        height: Math.floor(initialPageSize.height * scale),
      };
    }
    return { width: Math.floor(595 * scale), height: Math.floor(842 * scale) };
  }, [viewport, initialPageSize, scale]);

  // Overlap Warning Detection: If a paragraph grows into an adjacent paragraph, show a subtle warning outline
  const overlappingBlockIds = useMemo(() => {
    const overlapping = new Set<string>();
    const activeBlocks = blocks.filter((b) => !b.isDeleted);

    for (let i = 0; i < activeBlocks.length; i++) {
      for (let j = i + 1; j < activeBlocks.length; j++) {
        const b1 = activeBlocks[i];
        const b2 = activeBlocks[j];

        const isModified = Boolean(
          b1.isEdited ||
            b1.isNew ||
            b1.currentText !== b1.originalText ||
            b2.isEdited ||
            b2.isNew ||
            b2.currentText !== b2.originalText
        );
        if (!isModified) continue;

        const colX1 = b1.layout?.columnX ?? b1.pdfBounds.x;
        const colW1 = b1.layout?.columnWidth ?? b1.pdfBounds.width;
        const colX2 = b2.layout?.columnX ?? b2.pdfBounds.x;
        const colW2 = b2.layout?.columnWidth ?? b2.pdfBounds.width;

        const horizOverlap =
          Math.max(colX1, colX2) < Math.min(colX1 + colW1, colX2 + colW2) - 10;
        if (!horizOverlap) continue;

        const bottom1 = b1.pdfBounds.y;
        const top1 = b1.pdfBounds.y + b1.pdfBounds.height;
        const bottom2 = b2.pdfBounds.y;
        const top2 = b2.pdfBounds.y + b2.pdfBounds.height;

        const vertOverlap = Math.max(bottom1, bottom2) < Math.min(top1, top2) - 2;
        if (vertOverlap) {
          overlapping.add(b1.id);
          overlapping.add(b2.id);
        }
      }
    }
    return overlapping;
  }, [blocks]);

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
                  hasOverlapWarning={overlappingBlockIds.has(block.id)}
                  onSelect={() => onSelectBlock(block.id)}
                  onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                  onDelete={() => onDeleteBlock(block.id)}
                  onSplit={onSplitBlock ? (offset) => onSplitBlock(block.id, offset) : undefined}
                  onMergeWithPrev={onMergeWithPrevBlock ? () => onMergeWithPrevBlock(block.id) : undefined}
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
  hasOverlapWarning?: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextBlock>) => void;
  onDelete: () => void;
  onSplit?: (caretOffset: number) => void;
  onMergeWithPrev?: () => void;
  onCaretChange?: (formatting: ActiveFormattingState) => void;
}

function WordLikeTextBlockItem({
  block,
  viewport,
  scale,
  isSelected,
  hasOverlapWarning = false,
  onSelect,
  onUpdate,
  onDelete,
  onSplit,
  onMergeWithPrev,
  onCaretChange,
}: WordLikeTextBlockItemProps) {
  const editableRef = useRef<HTMLDivElement | null>(null);
  const lastRenderedTextRef = useRef<string>(block.currentText);
  const isComposingRef = useRef(false);

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

  // Layout properties
  const columnX = block.layout?.columnX ?? block.pdfBounds.x;
  const columnWidth = block.layout?.columnWidth ?? block.pdfBounds.width;
  const firstLineIndent = block.layout?.firstLineIndent ?? 0;
  const textAlign = block.layout?.textAlign ?? block.textAlign ?? "left";
  const lineHeightPt = block.layout?.lineHeight ?? block.fontSize * 1.25;
  const isLineMode = block.layout?.isLineMode ?? block.isSingleLine ?? false;

  // Calculate CSS viewport bounding box
  const bounds = useMemo(() => {
    const [left, bottom] = viewport.convertToViewportPoint(
      columnX,
      block.pdfBounds.y
    );
    const [right, top] = viewport.convertToViewportPoint(
      columnX + columnWidth,
      block.pdfBounds.y + block.pdfBounds.height
    );

    const x = Math.min(left, right);
    const y = Math.min(top, bottom);
    const width = Math.max(20, Math.round(columnWidth * scale));
    const height = Math.max(14, Math.abs(bottom - top));

    return { x, y, width, height };
  }, [viewport, columnX, columnWidth, block.pdfBounds.y, block.pdfBounds.height, scale]);

  // Zero-layout-shift rule: only mask when actual typing / deletion / modification has occurred!
  const isModified = Boolean(block.isNew || block.isEdited || block.currentText !== block.originalText);
  const shouldMaskOriginal = isModified;

  // Populate contentEditable on mount and when block ID changes
  useEffect(() => {
    if (editableRef.current) {
      editableRef.current.innerHTML = renderRunsToHtml(block.runs, block.currentText, block);
      lastRenderedTextRef.current = block.currentText;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  // Synchronize external updates (Undo/Redo or Toolbar formatting) while maintaining caret position
  useEffect(() => {
    if (!editableRef.current) return;
    const isFocused = document.activeElement === editableRef.current;

    // If focused and text is identical to internal DOM, don't overwrite DOM
    if (isFocused && editableRef.current.innerText === block.currentText) {
      return;
    }

    if (lastRenderedTextRef.current !== block.currentText) {
      const savedOffsets = isFocused ? getCaretCharacterOffset(editableRef.current) : null;
      editableRef.current.innerHTML = renderRunsToHtml(block.runs, block.currentText, block);
      lastRenderedTextRef.current = block.currentText;

      if (isFocused && savedOffsets) {
        restoreCaretCharacterOffset(editableRef.current, savedOffsets.start, savedOffsets.end);
      }
    }
  }, [block.currentText, block.runs, block]);

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
      textAlign,
      color: block.color,
      isSubstituted: block.isSubstitutedFont,
      substitutedFontName: block.substitutedFontName,
    });
  }, [block, textAlign, onCaretChange]);

  // Focus management
  useEffect(() => {
    if (isSelected && editableRef.current) {
      if (document.activeElement !== editableRef.current) {
        editableRef.current.focus();
      }
      syncToolbarFormatting();
    }
  }, [isSelected, syncToolbarFormatting]);

  // Internal input processor (preserves runs and handles debounced parent notification)
  const handleInputInternal = useCallback(() => {
    if (!editableRef.current) return;
    const { text, runs: extractedRuns } = extractRunsFromDom(editableRef.current, block);
    lastRenderedTextRef.current = text;

    onUpdate({
      currentText: text,
      runs: extractedRuns,
      isEdited: true,
    });
    syncToolbarFormatting();
  }, [block, onUpdate, syncToolbarFormatting]);

  // Handle Input typing in contentEditable
  const handleInput = () => {
    if (isComposingRef.current) return;
    handleInputInternal();
  };

  // Plain-text paste inheriting current run formatting at caret
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.setEndAfter(node);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    handleInputInternal();
  };

  // Keystroke handling: Enter, Backspace boundaries, and Shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        e.preventDefault();
        document.execCommand("insertLineBreak");
        handleInputInternal();
      } else {
        e.preventDefault();
        const offsets = editableRef.current ? getCaretCharacterOffset(editableRef.current) : { start: 0, end: 0 };
        if (onSplit) {
          onSplit(offsets.start);
        } else {
          document.execCommand("insertLineBreak");
          handleInputInternal();
        }
      }
      return;
    }

    if (e.key === "Backspace") {
      const offsets = editableRef.current ? getCaretCharacterOffset(editableRef.current) : { start: 1, end: 1 };
      if (offsets.start === 0 && offsets.end === 0 && onMergeWithPrev) {
        e.preventDefault();
        onMergeWithPrev();
        return;
      }
    }

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
        layout: {
          ...(block.layout || {
            columnX: newPdfX,
            columnWidth: block.pdfBounds.width,
            firstLineIndent: 0,
            lineHeight: lineHeightPt,
            textAlign,
            isLineMode,
          }),
          columnX: newPdfX,
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
      initWidth: columnWidth,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - resizeStartRef.current.startX) / scale;
      const newWidth = Math.max(40, Math.round((resizeStartRef.current.initWidth + deltaX) * 10) / 10);

      onUpdate({
        pdfBounds: {
          ...block.pdfBounds,
          width: newWidth,
        },
        layout: {
          ...(block.layout || {
            columnX,
            columnWidth: newWidth,
            firstLineIndent,
            lineHeight: lineHeightPt,
            textAlign,
            isLineMode,
          }),
          columnWidth: newWidth,
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
  const cssLineHeight = Math.max(cssFontSize, Math.round(lineHeightPt * scale));

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
        boxSizing: "border-box",
        padding: 0,
        margin: 0,
        outline: isSelected
          ? hasOverlapWarning
            ? "2px solid #F59E0B"
            : "2px solid #2563EB"
          : hasOverlapWarning
          ? "1.5px dashed #F59E0B"
          : isHovered
          ? "1px dashed #3B82F6"
          : "none",
        outlineOffset: "2px",
      }}
      className={`absolute pointer-events-auto select-none rounded-xs ${
        isDragging
          ? "z-40 opacity-80 cursor-grabbing shadow-lg"
          : isResizing
          ? "z-40 shadow-md"
          : isSelected
          ? "z-30 shadow-md"
          : isHovered
          ? "z-20"
          : isModified
          ? "z-10"
          : "z-1"
      }`}
    >
      {/* Background Mask to hide original PDF glyphs - ONLY rendered after first actual edit */}
      {shouldMaskOriginal && (
        <div
          className="absolute inset-0 rounded-xs pointer-events-none"
          style={{ backgroundColor: bgColorRgb }}
        />
      )}

      {/* Subtle Overlap Warning Badge (when a paragraph grows into an adjacent paragraph) */}
      {hasOverlapWarning && (isSelected || isHovered) && (
        <div className="absolute -bottom-6 left-0 z-50 flex items-center gap-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs pointer-events-none select-none">
          <span>⚠️ Overlaps adjacent paragraph (Ctrl+Z to undo)</span>
        </div>
      )}

      {/* Subtle Tooltip: Only shown above block on hover and hidden as soon as selected */}
      {isHovered && !isSelected && !hasOverlapWarning && (
        <div className="absolute -top-6 left-0 z-50 flex items-center rounded bg-zinc-800/95 px-1.5 py-0.5 text-[10px] font-medium text-white shadow-xs pointer-events-none select-none">
          Click to edit text
        </div>
      )}

      {/* Move Drag Handle (Visible when selected) */}
      {isSelected && (
        <div
          onMouseDown={handleDragStart}
          className="absolute -top-6 left-0 z-50 flex items-center gap-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-xs cursor-move select-none"
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
        <div className="absolute -top-6 right-0 z-50 flex items-center gap-1 rounded bg-zinc-900/90 px-1.5 py-0.5 text-[10px] text-white shadow-xs select-none">
          <span className="text-zinc-300">
            {Math.round(block.fontSize)}pt {block.fontFamily}
          </span>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
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

      {/* Word-Like contentEditable Rich Editable Text Container (EFFECTIVELY UNCONTROLLED) */}
      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onInput={handleInput}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={() => {
          isComposingRef.current = false;
          handleInputInternal();
        }}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onSelect={syncToolbarFormatting}
        onKeyUp={syncToolbarFormatting}
        onMouseUp={syncToolbarFormatting}
        style={{
          boxSizing: "border-box",
          padding: 0,
          margin: 0,
          border: "none",
          outline: "none",
          fontSize: `${cssFontSize}px`,
          fontFamily: fontFamilyStyle,
          fontWeight: block.isBold ? 700 : 400,
          fontStyle: block.isItalic ? "italic" : "normal",
          textDecoration: block.isUnderline ? "underline" : "none",
          textAlign,
          textIndent: `${Math.round(firstLineIndent * scale)}px`,
          lineHeight: `${cssLineHeight}px`,
          fontKerning: "normal",
          textRendering: "geometricPrecision",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          // While not modified, text is transparent and caret is visible. Crisp canvas text shows through with 0 shift!
          color: shouldMaskOriginal ? textColorRgb : "transparent",
          caretColor: textColorRgb,
          whiteSpace: isLineMode ? "pre" : "pre-wrap",
          wordBreak: "break-word",
          overflowWrap: "break-word",
          userSelect: "text",
        }}
        className="relative w-full h-full min-h-[16px] cursor-text select-text"
      />

      {/* Right Edge Resize Handle (Visible when selected) */}
      {isSelected && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute -right-1 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500/30 rounded-r-xs flex items-center justify-center z-40"
          title="Drag to resize text wrapping width"
        >
          <div className="h-4 w-1 rounded-full bg-blue-600 shadow-xs" />
        </div>
      )}
    </div>
  );
}
