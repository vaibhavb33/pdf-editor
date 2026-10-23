"use client";

import React from "react";
import { PageBorderConfig, PageBorderStyle, PageBorderScope } from "@/lib/pdf/edit-types";

interface PageBorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PageBorderConfig;
  currentPage: number;
  totalPages: number;
  onChangeConfig: (newConfig: PageBorderConfig) => void;
  onRemoveBorder: () => void;
}

const PRESETS: Array<{
  name: string;
  config: Partial<PageBorderConfig>;
}> = [
  {
    name: "Simple (Blue)",
    config: {
      enabled: true,
      style: "solid",
      width: 1.5,
      color: "#2563eb",
      margin: 36,
      cornerRadius: 0,
    },
  },
  {
    name: "Double Line",
    config: {
      enabled: true,
      style: "double",
      width: 3,
      color: "#1e40af",
      margin: 36,
      cornerRadius: 0,
    },
  },
  {
    name: "Thick Frame",
    config: {
      enabled: true,
      style: "solid",
      width: 4,
      color: "#111827",
      margin: 24,
      cornerRadius: 4,
    },
  },
  {
    name: "Academic Report",
    config: {
      enabled: true,
      style: "solid",
      width: 1,
      color: "#374151",
      margin: 48,
      cornerRadius: 0,
    },
  },
];

const COLOR_SWATCHES = [
  "#2563eb", // Primary Blue
  "#1e40af", // Dark Blue
  "#111827", // Black
  "#4b5563", // Gray
  "#dc2626", // Red
  "#16a34a", // Green
  "#d97706", // Amber
  "#7c3aed", // Purple
];

export function PageBorderModal({
  isOpen,
  onClose,
  config,
  currentPage,
  totalPages,
  onChangeConfig,
  onRemoveBorder,
}: PageBorderModalProps) {
  if (!isOpen) return null;

  const update = (updates: Partial<PageBorderConfig>) => {
    onChangeConfig({
      ...config,
      ...updates,
      enabled: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
            </svg>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Page Border Settings
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs">
          {/* Quick Presets */}
          <div>
            <label className="mb-1.5 block font-semibold text-zinc-700 dark:text-zinc-300">
              Border Presets
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => update(p.config)}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-center font-medium text-zinc-700 hover:border-blue-500 hover:bg-blue-50/50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Border Style & Width */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-zinc-700 dark:text-zinc-300">
                Style
              </label>
              <select
                value={config.style}
                onChange={(e) => update({ style: e.target.value as PageBorderStyle })}
                className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <option value="solid">Solid Line</option>
                <option value="double">Double Line</option>
                <option value="dashed">Dashed Line</option>
                <option value="dotted">Dotted Line</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block font-semibold text-zinc-700 dark:text-zinc-300">
                Width ({config.width} pt)
              </label>
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.5"
                value={config.width}
                onChange={(e) => update({ width: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="mb-1 block font-semibold text-zinc-700 dark:text-zinc-300">
              Border Color
            </label>
            <div className="flex items-center gap-2">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => update({ color: swatch })}
                  style={{ backgroundColor: swatch }}
                  className={`h-6 w-6 rounded-full border-2 transition-transform ${
                    config.color.toLowerCase() === swatch.toLowerCase()
                      ? "scale-110 border-white shadow-md ring-2 ring-blue-500"
                      : "border-transparent"
                  }`}
                />
              ))}
              <input
                type="color"
                value={config.color}
                onChange={(e) => update({ color: e.target.value })}
                className="h-6 w-8 cursor-pointer rounded border border-zinc-300 p-0 dark:border-zinc-700"
              />
            </div>
          </div>

          {/* Margin & Rounded Corners */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-zinc-700 dark:text-zinc-300">
                Margin from Edge ({config.margin} pt)
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="2"
                value={config.margin}
                onChange={(e) => update({ margin: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-zinc-700 dark:text-zinc-300">
                Corner Radius ({config.cornerRadius || 0} pt)
              </label>
              <input
                type="range"
                min="0"
                max="30"
                step="2"
                value={config.cornerRadius || 0}
                onChange={(e) => update({ cornerRadius: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="mb-1 block font-semibold text-zinc-700 dark:text-zinc-300">
              Apply Scope
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { label: "All Pages", value: "all" },
                { label: `Current Page (${currentPage + 1})`, value: "current" },
                { label: "First Page Only", value: "first-only" },
                { label: "Exclude First Page", value: "exclude-first" },
                { label: "Custom Range", value: "custom" },
              ].map((scopeOpt) => (
                <button
                  key={scopeOpt.value}
                  type="button"
                  onClick={() => update({ scope: scopeOpt.value as PageBorderScope })}
                  className={`rounded-lg border px-2.5 py-1.5 text-center font-medium transition-colors ${
                    config.scope === scopeOpt.value
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {scopeOpt.label}
                </button>
              ))}
            </div>

            {config.scope === "custom" && (
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="e.g. 1, 3-5"
                  value={config.customRange || ""}
                  onChange={(e) => update({ customRange: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 bg-white p-2 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                />
                <span className="text-[10px] text-zinc-400">
                  Total {totalPages} page(s) in document.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => {
              onRemoveBorder();
              onClose();
            }}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-400"
          >
            Remove Border
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
