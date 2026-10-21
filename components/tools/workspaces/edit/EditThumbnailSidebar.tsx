"use client";

import React, { useEffect, useRef, useState } from "react";

interface EditThumbnailSidebarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfDoc: any; // PDFDocumentProxy from pdfjs-dist
  numPages: number;
  currentPage: number;
  onSelectPage: (pageIndex: number) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function EditThumbnailSidebar({
  pdfDoc,
  numPages,
  currentPage,
  onSelectPage,
  isOpen,
  onToggleOpen,
}: EditThumbnailSidebarProps) {
  return (
    <aside
      aria-label="Document Pages Sidebar"
      className={`relative flex flex-col border-r border-zinc-200 bg-zinc-50 transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900 ${
        isOpen ? "w-48 sm:w-56" : "w-10 sm:w-12"
      } shrink-0 select-none`}
    >
      {/* Header with collapse/expand toggle */}
      <div className="flex h-11 items-center justify-between border-b border-zinc-200 px-2.5 dark:border-zinc-800">
        {isOpen && (
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Pages ({numPages})
          </span>
        )}
        <button
          type="button"
          onClick={onToggleOpen}
          aria-label={isOpen ? "Collapse page sidebar" : "Expand page sidebar"}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
          title={isOpen ? "Collapse pages (Ctrl+[)" : "Expand pages"}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Pages list */}
      {isOpen ? (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
          {Array.from({ length: numPages }).map((_, i) => (
            <PageThumbnailItem
              key={i}
              pageIndex={i}
              pdfDoc={pdfDoc}
              isActive={currentPage === i}
              onClick={() => onSelectPage(i)}
            />
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto py-2 space-y-2">
          {Array.from({ length: numPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectPage(i)}
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-colors ${
                currentPage === i
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
              title={`Page ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

function PageThumbnailItem({
  pageIndex,
  pdfDoc,
  isActive,
  onClick,
}: {
  pageIndex: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfDoc: any;
  isActive: boolean;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function renderThumb() {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageIndex + 1);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale: 1 });
        // Target width ~160px for thumbnail
        const thumbScale = 160 / Math.max(viewport.width, 1);
        const thumbViewport = page.getViewport({ scale: thumbScale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        canvas.width = thumbViewport.width;
        canvas.height = thumbViewport.height;

        const renderTask = page.render({
          canvasContext: ctx,
          viewport: thumbViewport,
        });

        await renderTask.promise;
        if (!isCancelled) {
          setIsRendered(true);
        }
      } catch {
        // Thumbnail render error fallback
      }
    }

    renderThumb();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, pageIndex]);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative flex flex-col items-center rounded-lg border p-1.5 cursor-pointer transition-all ${
        isActive
          ? "border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/30 dark:border-blue-500 dark:bg-blue-950/20"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-800/60 dark:hover:border-zinc-700"
      }`}
    >
      <div className="relative flex aspect-[1/1.3] w-full items-center justify-center overflow-hidden rounded bg-zinc-100 shadow-2xs dark:bg-zinc-900">
        <canvas
          ref={canvasRef}
          className={`h-full w-full object-contain transition-opacity duration-150 ${
            isRendered ? "opacity-100" : "opacity-0"
          }`}
        />
        {!isRendered && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-400">
            <span>Loading...</span>
          </div>
        )}
      </div>
      <div className="mt-1 flex w-full items-center justify-between px-0.5 text-[11px]">
        <span
          className={`font-medium ${
            isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Page {pageIndex + 1}
        </span>
      </div>
    </div>
  );
}
