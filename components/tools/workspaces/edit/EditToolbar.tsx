"use client";

import React from "react";
import { FontChoice, TextBlock } from "@/lib/pdf/edit-types";

interface EditToolbarProps {
  selectedBlock: TextBlock | null;
  onUpdateSelectedBlock: (updates: Partial<TextBlock>) => void;
  onDeleteSelectedBlock: () => void;
  isAddTextActive: boolean;
  onToggleAddText: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitWidth: () => void;
  currentPage: number;
  totalPages: number;
  onDownload: () => void;
  isSaving: boolean;
}

const COLOR_SWATCHES = [
  { label: "Black", hex: "#111827", rgb: { r: 0.07, g: 0.1, b: 0.15 } },
  { label: "Dark Gray", hex: "#4B5563", rgb: { r: 0.29, g: 0.33, b: 0.39 } },
  { label: "Blue", hex: "#2563EB", rgb: { r: 0.15, g: 0.39, b: 0.92 } },
  { label: "Red", hex: "#DC2626", rgb: { r: 0.86, g: 0.15, b: 0.15 } },
  { label: "Green", hex: "#16A34A", rgb: { r: 0.09, g: 0.64, b: 0.29 } },
];

export function EditToolbar({
  selectedBlock,
  onUpdateSelectedBlock,
  onDeleteSelectedBlock,
  isAddTextActive,
  onToggleAddText,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitWidth,
  currentPage,
  totalPages,
  onDownload,
  isSaving,
}: EditToolbarProps) {
  return (
    <div
      id="edit-pdf-toolbar"
      role="toolbar"
      aria-label="PDF Editor Toolbar"
      className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
    >
      {/* Left group: Tools & formatting */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Add Text Tool */}
        <button
          type="button"
          onClick={onToggleAddText}
          aria-pressed={isAddTextActive}
          className={`flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 font-semibold transition-colors ${
            isAddTextActive
              ? "bg-blue-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          }`}
          title="Click to place a new text box on any page"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Text</span>
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-l-lg text-zinc-600 hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-400 dark:hover:text-white"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2m-15-7l4-4m-4 4l4 4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-r-lg border-l border-zinc-200 text-zinc-600 hover:text-zinc-900 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" />
            </svg>
          </button>
        </div>

        {/* Selected Block Typography & Color Controls */}
        {selectedBlock && (
          <div className="flex flex-wrap items-center gap-1.5 border-l border-zinc-200 pl-2 dark:border-zinc-800">
            {/* Font Family */}
            <select
              value={selectedBlock.fontFamily}
              onChange={(e) =>
                onUpdateSelectedBlock({ fontFamily: e.target.value as FontChoice })
              }
              aria-label="Font Family"
              className="min-h-[36px] rounded-lg border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="sans-serif">Sans-Serif</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
            </select>

            {/* Font Size */}
            <div className="flex items-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
              <button
                type="button"
                onClick={() =>
                  onUpdateSelectedBlock({
                    fontSize: Math.max(8, (selectedBlock.fontSize || 12) - 1),
                  })
                }
                className="flex h-9 w-7 items-center justify-center font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                title="Decrease font size"
              >
                -
              </button>
              <span className="w-8 text-center text-xs font-semibold">
                {Math.round(selectedBlock.fontSize || 12)}
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateSelectedBlock({
                    fontSize: Math.min(72, (selectedBlock.fontSize || 12) + 1),
                  })
                }
                className="flex h-9 w-7 items-center justify-center font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                title="Increase font size"
              >
                +
              </button>
            </div>

            {/* Bold Toggle */}
            <button
              type="button"
              onClick={() => onUpdateSelectedBlock({ isBold: !selectedBlock.isBold })}
              aria-pressed={selectedBlock.isBold}
              className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg font-bold transition-colors ${
                selectedBlock.isBold
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
              title="Toggle Bold"
            >
              B
            </button>

            {/* Italic Toggle */}
            <button
              type="button"
              onClick={() => onUpdateSelectedBlock({ isItalic: !selectedBlock.isItalic })}
              aria-pressed={selectedBlock.isItalic}
              className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg font-serif italic transition-colors ${
                selectedBlock.isItalic
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
              title="Toggle Italic"
            >
              I
            </button>

            {/* Color Swatches */}
            <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-800">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => onUpdateSelectedBlock({ color: swatch.rgb })}
                  style={{ backgroundColor: swatch.hex }}
                  className="h-5 w-5 rounded-md border border-black/10 transition-transform hover:scale-110"
                  title={swatch.label}
                  aria-label={`Set color ${swatch.label}`}
                />
              ))}
            </div>

            {/* Delete Block */}
            <button
              type="button"
              onClick={onDeleteSelectedBlock}
              className="flex min-h-[36px] items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              title="Delete this text block"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Right group: Zoom, Page indicator & Download */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
          <button
            type="button"
            onClick={onZoomOut}
            className="flex min-h-[36px] min-w-[32px] items-center justify-center font-bold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            -
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            className="min-h-[36px] px-2 text-center text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            title="Reset Zoom (100%)"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            className="flex min-h-[36px] min-w-[32px] items-center justify-center font-bold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            title="Zoom In"
            aria-label="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={onFitWidth}
            className="min-h-[36px] border-l border-zinc-200 px-2 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white"
            title="Fit Width"
          >
            Fit
          </button>
        </div>

        {/* Page status */}
        {totalPages > 0 && (
          <span className="hidden text-xs text-zinc-500 sm:inline-block dark:text-zinc-400">
            Page {currentPage} of {totalPages}
          </span>
        )}

        {/* Download Button */}
        <button
          type="button"
          onClick={onDownload}
          disabled={isSaving}
          className="flex min-h-[38px] cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 font-bold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download edited PDF</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
