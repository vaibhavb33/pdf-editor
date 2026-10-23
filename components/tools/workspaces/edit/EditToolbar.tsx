"use client";

import React, { useState } from "react";
import { FontChoice, TextAlign, TextBlock, FontDetectionMetadata } from "@/lib/pdf/edit-types";
import { FontFamilyPicker } from "./FontFamilyPicker";

export interface ActiveFormattingState {
  fontFamily: string;
  fontCategory: FontChoice;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  textAlign: TextAlign;
  color: { r: number; g: number; b: number };
  isSubstituted?: boolean;
  substitutedFontName?: string;
  detection?: FontDetectionMetadata;
}

interface EditToolbarProps {
  selectedBlock: TextBlock | null;
  activeFormatting: ActiveFormattingState | null;
  onApplyFormatting: (updates: Partial<TextBlock>) => void;
  onClearFormatting: () => void;
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
  documentBlocks?: TextBlock[];
  onOpenPageBorder?: () => void;
}

const COLOR_SWATCHES = [
  { label: "Black", hex: "#111827", rgb: { r: 0.07, g: 0.1, b: 0.15 } },
  { label: "Dark Gray", hex: "#4B5563", rgb: { r: 0.29, g: 0.33, b: 0.39 } },
  { label: "Blue", hex: "#2563EB", rgb: { r: 0.15, g: 0.39, b: 0.92 } },
  { label: "Red", hex: "#DC2626", rgb: { r: 0.86, g: 0.15, b: 0.15 } },
  { label: "Green", hex: "#16A34A", rgb: { r: 0.09, g: 0.64, b: 0.29 } },
  { label: "Amber", hex: "#D97706", rgb: { r: 0.85, g: 0.47, b: 0.02 } },
];

const FONT_SIZE_PRESETS = [6, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72, 96];
const LINE_SPACING_PRESETS = [1.0, 1.15, 1.5, 2.0];

export function EditToolbar({
  selectedBlock,
  activeFormatting,
  onApplyFormatting,
  onClearFormatting,
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
  documentBlocks = [],
  onOpenPageBorder,
}: EditToolbarProps) {
  const [isLineSpacingOpen, setIsLineSpacingOpen] = useState(false);

  // Use caret formatting if available, otherwise block or default
  const fmt = activeFormatting || (selectedBlock ? {
    fontFamily: selectedBlock.fontFamily,
    fontCategory: selectedBlock.fontCategory,
    fontSize: selectedBlock.fontSize,
    isBold: selectedBlock.isBold,
    isItalic: selectedBlock.isItalic,
    isUnderline: selectedBlock.isUnderline || false,
    textAlign: selectedBlock.textAlign || "left",
    color: selectedBlock.color,
    isSubstituted: selectedBlock.isSubstitutedFont,
    substitutedFontName: selectedBlock.substitutedFontName,
    detection: selectedBlock.detection,
  } : null);

  const hexColor = fmt
    ? `#${Math.round(fmt.color.r * 255).toString(16).padStart(2, "0")}${Math.round(fmt.color.g * 255).toString(16).padStart(2, "0")}${Math.round(fmt.color.b * 255).toString(16).padStart(2, "0")}`
    : "#111827";

  return (
    <div
      id="edit-pdf-toolbar"
      role="toolbar"
      aria-label="PDF Word-Style Ribbon Toolbar"
      className="relative z-20 flex h-12 w-full shrink-0 flex-nowrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-3 text-xs text-zinc-700 shadow-xs overflow-x-auto scrollbar-none select-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
    >
      {/* Left group: Word-like Ribbon Tools */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Add Text Tool */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleAddText}
          aria-pressed={isAddTextActive}
          className={`flex min-h-[34px] items-center gap-1.5 rounded-lg px-2.5 font-semibold transition-colors ${
            isAddTextActive
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          }`}
          title="Add text anywhere on document (or simply click on empty space)"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Text</span>
        </button>

        {/* Page Border Tool */}
        {onOpenPageBorder && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onOpenPageBorder}
            className="flex min-h-[34px] items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 font-medium text-zinc-700 hover:bg-zinc-100 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            title="Configure Page Border (Style, width, color, scope)"
          >
            <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} strokeDasharray="3 3" />
            </svg>
            <span>Border</span>
          </button>
        )}

        {/* Undo / Redo */}
        <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onUndo}
            disabled={!canUndo}
            className="flex min-h-[34px] min-w-[34px] items-center justify-center rounded-l-lg text-zinc-600 hover:text-zinc-900 disabled:opacity-35 dark:text-zinc-400 dark:hover:text-white"
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2m-15-7l4-4m-4 4l4 4" />
            </svg>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onRedo}
            disabled={!canRedo}
            className="flex min-h-[34px] min-w-[34px] items-center justify-center rounded-r-lg border-l border-zinc-200 text-zinc-600 hover:text-zinc-900 disabled:opacity-35 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white"
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" />
            </svg>
          </button>
        </div>

        {/* Typography & Formatting Controls (always responsive to active selection / caret) */}
        <div className="flex flex-wrap items-center gap-1.5 border-l border-zinc-200 pl-2 dark:border-zinc-800">
          {/* Custom Grouped Font Family Dropdown with Live Previews & Search */}
          <FontFamilyPicker
            currentFamily={fmt?.fontFamily || "Arial"}
            currentCategory={fmt?.fontCategory}
            fontSize={fmt?.fontSize}
            disabled={!selectedBlock}
            documentBlocks={documentBlocks}
            onSelectFont={async ({ family, category }) => {
              onApplyFormatting({
                fontFamily: family,
                fontCategory: category,
                isSubstitutedFont: category === "calibri" || category === "cambria" || category === "serif" || category === "monospace",
                substitutedFontName: category === "calibri" ? "Carlito" : category === "cambria" ? "Caladea" : category === "serif" ? "Liberation Serif" : undefined,
                userOverride: true,
              });
            }}
          />

          {/* Detected / Substituted Font Badge */}
          {fmt && (
            fmt.detection?.isExact ? (
              <span
                className="hidden xl:inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                title={`Exact font match: ${fmt.detection.normalizedFamily || fmt.fontFamily}`}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Detected: {fmt.detection.normalizedFamily || fmt.fontFamily}</span>
              </span>
            ) : fmt.isSubstituted || fmt.detection ? (
              <span
                className="hidden xl:inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                title={`Metric-compatible substituted font: ${fmt.detection?.mappedFont || fmt.substitutedFontName || "Substituted"}`}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Substituted: {fmt.detection?.mappedFont || fmt.substitutedFontName || "Substitute"}</span>
              </span>
            ) : null
          )}

          {/* Font Size Free Input + Steppers + Preset Dropdown */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
            <button
              type="button"
              disabled={!selectedBlock}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (!fmt) return;
                onApplyFormatting({ fontSize: Math.max(6, Math.round(fmt.fontSize - 1)), userOverride: true });
              }}
              className="flex h-8 w-5 items-center justify-center font-bold text-zinc-500 hover:text-zinc-800 disabled:opacity-40 dark:hover:text-zinc-200"
              title="Decrease font size"
            >
              -
            </button>
            <input
              type="number"
              disabled={!selectedBlock}
              value={fmt ? Math.round(fmt.fontSize) : 12}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val >= 4 && val <= 144) {
                  onApplyFormatting({ fontSize: val, userOverride: true });
                }
              }}
              className="h-8 w-9 text-center text-xs font-semibold outline-hidden [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              title="Font size (pt)"
            />
            <button
              type="button"
              disabled={!selectedBlock}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (!fmt) return;
                onApplyFormatting({ fontSize: Math.min(96, Math.round(fmt.fontSize + 1)), userOverride: true });
              }}
              className="flex h-8 w-5 items-center justify-center font-bold text-zinc-500 hover:text-zinc-800 disabled:opacity-40 dark:hover:text-zinc-200"
              title="Increase font size"
            >
              +
            </button>
            {/* Quick Preset Size Dropdown */}
            <select
              value={fmt ? Math.round(fmt.fontSize) : 12}
              disabled={!selectedBlock}
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  onApplyFormatting({ fontSize: val, userOverride: true });
                }
              }}
              className="h-8 border-l border-zinc-200 bg-transparent px-1 text-[11px] font-medium text-zinc-600 outline-hidden dark:border-zinc-700 dark:text-zinc-400"
              title="Select font size preset"
            >
              {FONT_SIZE_PRESETS.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>

          {/* Bold, Italic, Underline buttons */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
            {/* Bold */}
            <button
              type="button"
              disabled={!selectedBlock}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onApplyFormatting({ isBold: !fmt?.isBold, userOverride: true })}
              aria-pressed={fmt?.isBold}
              className={`flex h-8 w-8 items-center justify-center rounded-l-lg font-bold transition-colors ${
                fmt?.isBold
                  ? "bg-blue-600 text-white"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
              } disabled:opacity-40`}
              title="Bold (Ctrl+B)"
            >
              B
            </button>

            {/* Italic */}
            <button
              type="button"
              disabled={!selectedBlock}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onApplyFormatting({ isItalic: !fmt?.isItalic, userOverride: true })}
              aria-pressed={fmt?.isItalic}
              className={`flex h-8 w-8 items-center justify-center border-l border-zinc-200 font-serif italic transition-colors dark:border-zinc-700 ${
                fmt?.isItalic
                  ? "bg-blue-600 text-white"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
              } disabled:opacity-40`}
              title="Italic (Ctrl+I)"
            >
              I
            </button>

            {/* Underline */}
            <button
              type="button"
              disabled={!selectedBlock}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onApplyFormatting({ isUnderline: !fmt?.isUnderline, userOverride: true })}
              aria-pressed={fmt?.isUnderline}
              className={`flex h-8 w-8 items-center justify-center border-l border-zinc-200 underline transition-colors dark:border-zinc-700 ${
                fmt?.isUnderline
                  ? "bg-blue-600 text-white"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
              } disabled:opacity-40`}
              title="Underline (Ctrl+U)"
            >
              U
            </button>
          </div>

          {/* Alignment: Left / Center / Right / Justify */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
            <button
              type="button"
              disabled={!selectedBlock}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onApplyFormatting({ textAlign: "left", userOverride: true })}
              className={`flex h-8 w-7 items-center justify-center rounded-l-lg ${
                fmt?.textAlign === "left" || !fmt?.textAlign
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
              } disabled:opacity-40`}
              title="Align Left (Ctrl+L)"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
              </svg>
            </button>
            <button
              type="button"
              disabled={!selectedBlock}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onApplyFormatting({ textAlign: "center", userOverride: true })}
              className={`flex h-8 w-7 items-center justify-center border-l border-zinc-200 dark:border-zinc-700 ${
                fmt?.textAlign === "center"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
              } disabled:opacity-40`}
              title="Align Center (Ctrl+E)"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
              </svg>
            </button>
            <button
              type="button"
              disabled={!selectedBlock}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onApplyFormatting({ textAlign: "right", userOverride: true })}
              className={`flex h-8 w-7 items-center justify-center border-l border-zinc-200 dark:border-zinc-700 ${
                fmt?.textAlign === "right"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
              } disabled:opacity-40`}
              title="Align Right (Ctrl+R)"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
              </svg>
            </button>
            <button
              type="button"
              disabled={!selectedBlock}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onApplyFormatting({ textAlign: "justify", userOverride: true })}
              className={`flex h-8 w-7 items-center justify-center border-l border-zinc-200 rounded-r-lg dark:border-zinc-700 ${
                fmt?.textAlign === "justify"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
              } disabled:opacity-40`}
              title="Justify (Ctrl+J)"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Line Spacing Dropdown */}
          <div className="relative">
            <button
              type="button"
              disabled={!selectedBlock}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsLineSpacingOpen((prev) => !prev)}
              className="flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              title="Line Spacing (1.0, 1.15, 1.5, 2.0)"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M4 6v12m0 0l-2-2m2 2l2-2M4 6L2 8m2-2l2 2" />
              </svg>
              <span className="text-[11px] font-medium">
                {selectedBlock?.lineHeight || 1.25}x
              </span>
            </button>
            {isLineSpacingOpen && (
              <div
                onMouseDown={(e) => e.preventDefault()}
                className="absolute left-0 top-full z-50 mt-1 w-28 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
              >
                {LINE_SPACING_PRESETS.map((spacing) => (
                  <button
                    key={spacing}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onApplyFormatting({ lineHeight: spacing, userOverride: true });
                      setIsLineSpacingOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    <span>{spacing}x</span>
                    {selectedBlock?.lineHeight === spacing && <span className="text-blue-600">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Indent Controls (Decrease / Increase Indent) */}
          <div className="flex items-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
            <button
              type="button"
              disabled={!selectedBlock}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (!selectedBlock) return;
                const curIndent = selectedBlock.layout?.firstLineIndent || 0;
                const newIndent = Math.max(0, curIndent - 12);
                onApplyFormatting({
                  layout: {
                    ...(selectedBlock.layout || {
                      columnX: selectedBlock.x,
                      columnWidth: selectedBlock.pdfBounds.width,
                      lineHeight: selectedBlock.fontSize * 1.25,
                      textAlign: selectedBlock.textAlign || "left",
                      isLineMode: false,
                    }),
                    firstLineIndent: newIndent,
                  },
                  userOverride: true,
                });
              }}
              className="flex h-8 w-7 items-center justify-center rounded-l-lg text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-700"
              title="Decrease First-Line Indent"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              disabled={!selectedBlock}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (!selectedBlock) return;
                const curIndent = selectedBlock.layout?.firstLineIndent || 0;
                const newIndent = Math.min(100, curIndent + 12);
                onApplyFormatting({
                  layout: {
                    ...(selectedBlock.layout || {
                      columnX: selectedBlock.x,
                      columnWidth: selectedBlock.pdfBounds.width,
                      lineHeight: selectedBlock.fontSize * 1.25,
                      textAlign: selectedBlock.textAlign || "left",
                      isLineMode: false,
                    }),
                    firstLineIndent: newIndent,
                  },
                  userOverride: true,
                });
              }}
              className="flex h-8 w-7 items-center justify-center border-l border-zinc-200 rounded-r-lg text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700"
              title="Increase First-Line Indent"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Color Swatches and Color Picker */}
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-800">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                disabled={!selectedBlock}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onApplyFormatting({ color: swatch.rgb, userOverride: true })}
                style={{ backgroundColor: swatch.hex }}
                className="h-5 w-5 rounded-md border border-black/10 transition-transform hover:scale-110 disabled:opacity-40"
                title={swatch.label}
                aria-label={`Set color ${swatch.label}`}
              />
            ))}
            {/* Native HTML Color Picker */}
            <label
              className="relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-600"
              title="Pick custom text color"
            >
              <input
                type="color"
                disabled={!selectedBlock}
                value={hexColor}
                onChange={(e) => {
                  const hex = e.target.value;
                  const r = parseInt(hex.slice(1, 3), 16) / 255;
                  const g = parseInt(hex.slice(3, 5), 16) / 255;
                  const b = parseInt(hex.slice(5, 7), 16) / 255;
                  onApplyFormatting({ color: { r, g, b }, userOverride: true });
                }}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="text-[10px] font-bold text-zinc-500">🎨</span>
            </label>
          </div>

          {/* Clear Formatting Button */}
          <button
            type="button"
            disabled={!selectedBlock}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClearFormatting}
            className="flex min-h-[34px] items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            title="Clear formatting (reset to default Arial 12pt)"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* Delete Block */}
          {selectedBlock && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onDeleteSelectedBlock}
              className="flex min-h-[34px] items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
              title="Delete text block (Delete key)"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Right group: Zoom, Page counter, and Primary Solid Blue Download Button */}
      <div className="flex items-center gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
          <button
            type="button"
            onClick={onZoomOut}
            className="flex min-h-[34px] min-w-[30px] items-center justify-center font-bold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            -
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            className="min-h-[34px] px-2 text-center text-xs font-semibold text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            title="Reset Zoom (100%)"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            onClick={onZoomIn}
            className="flex min-h-[34px] min-w-[30px] items-center justify-center font-bold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            title="Zoom In"
            aria-label="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={onFitWidth}
            className="min-h-[34px] border-l border-zinc-200 px-2 text-[11px] font-medium text-zinc-600 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-white"
            title="Fit Width"
          >
            Fit
          </button>
        </div>

        {/* Page status */}
        {totalPages > 0 && (
          <span className="hidden text-xs text-zinc-500 md:inline-block dark:text-zinc-400">
            Page {currentPage + 1} of {totalPages}
          </span>
        )}

        {/* Solid Blue Download Button */}
        <button
          type="button"
          onClick={onDownload}
          disabled={isSaving}
          className="flex min-h-[36px] cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 font-bold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-50"
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

