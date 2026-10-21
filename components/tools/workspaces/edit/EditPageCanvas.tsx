"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { TextBlock } from "@/lib/pdf/edit-types";
import { sampleBackgroundColor } from "@/lib/pdf/text-extractor";

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
  }) => void;
  onPageVisible?: (pageIndex: number) => void;
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

  // Setup intersection observer to track active page
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onPageVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            onPageVisible(pageIndex);
          }
        }
      },
      { threshold: [0.1, 0.4, 0.7] }
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

        // Internal resolution matches DPR for crisp text on Retina screens
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);

        // CSS style dimensions match PDF.js viewport
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        ctx.scale(dpr, dpr);

        // Fill clean white background first
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        activeRenderTask = page.render({
          canvasContext: ctx,
          viewport: vp,
        });

        await activeRenderTask.promise;

        if (!isCancelled) {
          setIsRendered(true);

          // Once rendered, sample background color for any block lacking one
          for (const block of blocksRef.current) {
            if (!block.bgColor && block.viewportBounds) {
              const bg = sampleBackgroundColor(ctx, block.viewportBounds, dpr);
              onUpdateBlockRef.current(block.id, { bgColor: bg });
            }
          }
        }
      } catch (err: unknown) {
        // PDF.js cancellation exception is expected on fast zoom
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

  // Handle click on canvas for Add Text
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddTextActive || !viewport) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert CSS click position to PDF point coordinates
    const [pdfX, pdfY] = viewport.convertToPdfPoint(clickX, clickY);

    onAddTextAtPoint({
      pageIndex,
      pdfX: Math.round(pdfX * 10) / 10,
      pdfY: Math.round(pdfY * 10) / 10,
      viewportX: clickX,
      viewportY: clickY,
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
      {/* Page Header Indicator */}
      <div className="mb-1.5 flex items-center justify-between w-full max-w-[850px] px-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
        <span>Page {pageIndex + 1}</span>
        <span>{Math.round(scale * 100)}%</span>
      </div>

      {/* Page Surface (Canvas + Interactive Overlay) */}
      <div
        onClick={handlePageClick}
        style={{
          width: `${pageDimensions.width}px`,
          height: `${pageDimensions.height}px`,
        }}
        className={`relative bg-white shadow-md rounded-sm transition-shadow dark:bg-zinc-900 ${
          isAddTextActive
            ? "cursor-crosshair ring-2 ring-blue-500/50"
            : "hover:shadow-lg"
        }`}
      >
        {/* PDF.js Rendered Page */}
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

        {/* Interactive Text Blocks Layer */}
        {viewport && isRendered && (
          <div className="absolute inset-0 pointer-events-none">
            {blocks.map((block) => {
              if (block.isDeleted) return null;

              return (
                <OverlayTextBlockItem
                  key={block.id}
                  block={block}
                  viewport={viewport}
                  scale={scale}
                  isSelected={selectedBlockId === block.id}
                  onSelect={() => onSelectBlock(block.id)}
                  onUpdate={(updates) => onUpdateBlock(block.id, updates)}
                  onDelete={() => onDeleteBlock(block.id)}
                  disabled={isAddTextActive}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface OverlayTextBlockItemProps {
  block: TextBlock;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  viewport: any;
  scale: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextBlock>) => void;
  onDelete: () => void;
  disabled: boolean;
}

function OverlayTextBlockItem({
  block,
  viewport,
  scale,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  disabled,
}: OverlayTextBlockItemProps) {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Compute bounding box in CSS pixels from PDF coordinates at current viewport/scale
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
    const width = Math.max(24, Math.abs(right - left));
    const height = Math.max(14, Math.abs(bottom - top));

    return { x, y, width, height };
  }, [viewport, block.pdfBounds]);

  const isModified = block.isNew || block.currentText !== block.originalText;

  // Auto-focus and select when selected
  useEffect(() => {
    if (isSelected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected]);

  const cssFontSize = Math.max(8, Math.round(block.fontSize * scale));

  const fontFamilyStyle =
    block.fontFamily === "serif"
      ? "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
      : block.fontFamily === "monospace"
      ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      : "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  const textColorRgb = block.color
    ? `rgb(${Math.round(block.color.r * 255)}, ${Math.round(block.color.g * 255)}, ${Math.round(
        block.color.b * 255
      )})`
    : "#111827";

  const bgColorRgb = block.bgColor
    ? `rgb(${Math.round(block.bgColor.r * 255)}, ${Math.round(block.bgColor.g * 255)}, ${Math.round(
        block.bgColor.b * 255
      )})`
    : "#ffffff";

  // When not active and not modified, overlay is a transparent clickable hover target.
  // When modified, overlay covers original with sampled background and renders replacement text.
  return (
    <div
      style={{
        left: `${bounds.x}px`,
        top: `${bounds.y}px`,
        minWidth: `${bounds.width}px`,
        minHeight: `${bounds.height}px`,
      }}
      className={`absolute pointer-events-auto transition-all ${
        isSelected
          ? "z-30 ring-2 ring-blue-600 shadow-md"
          : isModified
          ? "z-10 shadow-2xs hover:ring-1 hover:ring-blue-400"
          : "z-1 hover:outline-dashed hover:outline-1 hover:outline-blue-500 hover:bg-blue-500/10 cursor-pointer"
      } rounded-xs`}
    >
      {isSelected ? (
        // Active editing mode
        <div
          className="relative flex flex-col p-0.5 rounded-xs"
          style={{ backgroundColor: bgColorRgb }}
          onClick={(e) => e.stopPropagation()}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={block.currentText}
            onChange={(e) => onUpdate({ currentText: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.currentTarget.blur();
              }
            }}
            style={{
              fontSize: `${cssFontSize}px`,
              fontFamily: fontFamilyStyle,
              fontWeight: block.isBold ? 700 : 400,
              fontStyle: block.isItalic ? "italic" : "normal",
              color: textColorRgb,
              lineHeight: 1.15,
            }}
            className="w-full min-w-[60px] resize-none bg-transparent p-0 m-0 outline-hidden border-none text-left"
          />

          {/* Quick Floating Action: Delete Block */}
          <div className="absolute -top-7 right-0 flex items-center gap-1 rounded bg-zinc-900/90 px-1.5 py-0.5 text-[10px] text-white shadow-xs">
            <span className="text-zinc-300">
              {block.fontSize}pt {block.fontFamily}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="ml-1 text-red-300 hover:text-red-100"
              title="Delete text box (Backspace)"
            >
              ×
            </button>
          </div>
        </div>
      ) : isModified ? (
        // Modified or newly added text: cover background and display new text
        <div
          onClick={(e) => {
            if (disabled) return;
            e.stopPropagation();
            onSelect();
          }}
          style={{
            backgroundColor: bgColorRgb,
            fontSize: `${cssFontSize}px`,
            fontFamily: fontFamilyStyle,
            fontWeight: block.isBold ? 700 : 400,
            fontStyle: block.isItalic ? "italic" : "normal",
            color: textColorRgb,
            lineHeight: 1.15,
            padding: "0.5px 1px",
          }}
          className="cursor-pointer select-none whitespace-pre-wrap break-words rounded-xs"
          title="Click to edit modified text"
        >
          {block.currentText || "\u00A0"}
        </div>
      ) : (
        // Unmodified text: invisible click target directly over PDF.js canvas text
        <div
          onClick={(e) => {
            if (disabled) return;
            e.stopPropagation();
            onSelect();
          }}
          className="h-full w-full"
          title="Click to edit text in-place"
        />
      )}
    </div>
  );
}
