"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { FontChoice, TextBlock } from "@/lib/pdf/edit-types";

export interface FontOption {
  family: string;
  category: FontChoice;
  displayName: string;
  previewFamily: string; // CSS font-family
  group: "Document" | "Modern" | "Serif Display" | "Monospace" | "Indian Languages" | "Handwriting & Signatures";
}

export const AVAILABLE_FONTS: FontOption[] = [
  // Document fonts
  { family: "Arial", category: "sans-serif", displayName: "Arial / Helvetica", previewFamily: "'Liberation Sans', Arial, sans-serif", group: "Document" },
  { family: "Calibri", category: "calibri", displayName: "Calibri (Carlito)", previewFamily: "Carlito, Calibri, sans-serif", group: "Document" },
  { family: "Times New Roman", category: "serif", displayName: "Times New Roman", previewFamily: "'Liberation Serif', 'Times New Roman', serif", group: "Document" },
  { family: "Cambria", category: "cambria", displayName: "Cambria (Caladea)", previewFamily: "Caladea, Cambria, serif", group: "Document" },
  { family: "Georgia", category: "serif", displayName: "Georgia (Gelasio)", previewFamily: "Gelasio, Georgia, serif", group: "Document" },
  { family: "Courier New", category: "monospace", displayName: "Courier New", previewFamily: "'Liberation Mono', 'Courier New', monospace", group: "Document" },
  { family: "Verdana", category: "sans-serif", displayName: "Verdana", previewFamily: "Verdana, 'DejaVu Sans', sans-serif", group: "Document" },
  { family: "EB Garamond", category: "serif", displayName: "EB Garamond", previewFamily: "'EB Garamond', Garamond, serif", group: "Document" },
  { family: "Merriweather", category: "serif", displayName: "Merriweather", previewFamily: "Merriweather, serif", group: "Document" },

  // Modern sans
  { family: "Inter", category: "sans-serif", displayName: "Inter", previewFamily: "Inter, sans-serif", group: "Modern" },
  { family: "Roboto", category: "roboto", displayName: "Roboto", previewFamily: "Roboto, sans-serif", group: "Modern" },
  { family: "Open Sans", category: "sans-serif", displayName: "Open Sans", previewFamily: "'Open Sans', sans-serif", group: "Modern" },
  { family: "Lato", category: "sans-serif", displayName: "Lato", previewFamily: "Lato, sans-serif", group: "Modern" },
  { family: "Montserrat", category: "sans-serif", displayName: "Montserrat", previewFamily: "Montserrat, sans-serif", group: "Modern" },
  { family: "Poppins", category: "sans-serif", displayName: "Poppins", previewFamily: "Poppins, sans-serif", group: "Modern" },
  { family: "Nunito", category: "sans-serif", displayName: "Nunito", previewFamily: "Nunito, sans-serif", group: "Modern" },

  // Serif Display
  { family: "Playfair Display", category: "serif", displayName: "Playfair Display", previewFamily: "'Playfair Display', serif", group: "Serif Display" },

  // Monospace
  { family: "Roboto Mono", category: "monospace", displayName: "Roboto Mono", previewFamily: "'Roboto Mono', monospace", group: "Monospace" },

  // Indian Languages
  { family: "Noto Sans Devanagari", category: "devanagari", displayName: "Devanagari / Hindi", previewFamily: "'Noto Sans Devanagari', sans-serif", group: "Indian Languages" },
  { family: "Noto Sans Gujarati", category: "gujarati", displayName: "Gujarati", previewFamily: "'Noto Sans Gujarati', sans-serif", group: "Indian Languages" },
  { family: "Noto Sans Tamil", category: "sans-serif", displayName: "Tamil", previewFamily: "'Noto Sans Tamil', sans-serif", group: "Indian Languages" },
  { family: "Noto Sans Bengali", category: "sans-serif", displayName: "Bengali", previewFamily: "'Noto Sans Bengali', sans-serif", group: "Indian Languages" },

  // Handwriting & Signatures
  { family: "Dancing Script", category: "sans-serif", displayName: "Dancing Script", previewFamily: "'Dancing Script', cursive", group: "Handwriting & Signatures" },
  { family: "Caveat", category: "sans-serif", displayName: "Caveat", previewFamily: "Caveat, cursive", group: "Handwriting & Signatures" },
  { family: "Great Vibes", category: "sans-serif", displayName: "Great Vibes", previewFamily: "'Great Vibes', cursive", group: "Handwriting & Signatures" },
];

interface FontFamilyPickerProps {
  currentFamily: string;
  currentCategory?: FontChoice;
  fontSize?: number;
  disabled?: boolean;
  documentBlocks?: TextBlock[];
  onSelectFont: (font: { family: string; category: FontChoice }) => Promise<void> | void;
}

export function FontFamilyPicker({
  currentFamily,
  currentCategory,
  fontSize = 12,
  disabled = false,
  documentBlocks = [],
  onSelectFont,
}: FontFamilyPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>(["Calibri", "Arial", "Roboto"]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Extract unique fonts present in the document
  const documentFonts = useMemo(() => {
    const families = new Set<string>();
    for (const b of documentBlocks) {
      if (b.fontFamily) families.add(b.fontFamily);
      if (b.detection?.normalizedFamily) families.add(b.detection.normalizedFamily);
      if (b.runs) {
        for (const r of b.runs) {
          if (r.fontFamily) families.add(r.fontFamily);
        }
      }
    }
    return Array.from(families);
  }, [documentBlocks]);

  // Active font label
  const activeFont = useMemo(() => {
    return (
      AVAILABLE_FONTS.find(
        (f) =>
          f.family.toLowerCase() === currentFamily.toLowerCase() ||
          (currentCategory && f.category === currentCategory)
      ) || {
        family: currentFamily || "Arial",
        displayName: currentFamily || "Arial",
        category: currentCategory || "sans-serif",
        previewFamily: currentFamily || "sans-serif",
        group: "Document" as const,
      }
    );
  }, [currentFamily, currentCategory]);

  // Filtered fonts based on search
  const filteredFonts = useMemo(() => {
    if (!search.trim()) return AVAILABLE_FONTS;
    const q = search.toLowerCase();
    return AVAILABLE_FONTS.filter(
      (f) => f.displayName.toLowerCase().includes(q) || f.family.toLowerCase().includes(q)
    );
  }, [search]);

  // Grouped fonts
  const groups = useMemo(() => {
    const map = new Map<string, FontOption[]>();
    for (const font of filteredFonts) {
      const g = font.group;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(font);
    }
    return Array.from(map.entries());
  }, [filteredFonts]);

  // Handle font selection with preloading and selection preservation
  const handleSelect = async (font: FontOption) => {
    setIsOpen(false);

    // Update recently used list
    setRecentlyUsed((prev) => {
      const next = [font.family, ...prev.filter((f) => f !== font.family)];
      return next.slice(0, 5);
    });

    // Preload font before updating state to eliminate layout jitter
    if (typeof document !== "undefined" && document.fonts) {
      try {
        await document.fonts.load(`${fontSize}px "${font.family}"`);
        if (font.previewFamily) {
          await document.fonts.load(`${fontSize}px ${font.previewFamily}`);
        }
      } catch {
        // ignore load errors
      }
    }

    await onSelectFont({ family: font.family, category: font.category });
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button - MUST prevent default on mousedown to preserve DOM text selection! */}
      <button
        type="button"
        disabled={disabled}
        onMouseDown={(e) => {
          // Prevent focus stealing from contentEditable!
          e.preventDefault();
        }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex min-h-[34px] items-center justify-between gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 shadow-2xs hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700/60"
        title="Choose Font Family"
      >
        <span className="max-w-[120px] truncate" style={{ fontFamily: activeFont.previewFamily }}>
          {activeFont.displayName}
        </span>
        <svg className="h-3 w-3 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          onMouseDown={(e) => {
            // Prevent clearing the active text selection when clicking anywhere inside dropdown
            e.preventDefault();
          }}
          className="absolute left-0 top-full z-50 mt-1 max-h-[380px] w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl flex flex-col dark:border-zinc-700 dark:bg-zinc-900"
        >
          {/* Search Header */}
          <div className="border-b border-zinc-200 p-2 dark:border-zinc-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search font..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-hidden focus:border-blue-500 focus:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              autoFocus
            />
          </div>

          {/* Scrollable Font Groups */}
          <div className="flex-1 overflow-y-auto p-1 text-xs">
            {/* Fonts in this document */}
            {!search && documentFonts.length > 0 && (
              <div className="mb-2 border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
                <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                  Fonts in this document
                </div>
                {documentFonts.slice(0, 4).map((fName) => {
                  const match = AVAILABLE_FONTS.find(
                    (f) => f.family.toLowerCase() === fName.toLowerCase()
                  ) || {
                    family: fName,
                    displayName: fName,
                    category: "sans-serif" as FontChoice,
                    previewFamily: fName,
                    group: "Document" as const,
                  };
                  return (
                    <button
                      key={`doc_${fName}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(match)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-blue-50 dark:hover:bg-blue-950/50"
                    >
                      <span className="text-xs" style={{ fontFamily: match.previewFamily }}>
                        {match.displayName}
                      </span>
                      {activeFont.family.toLowerCase() === match.family.toLowerCase() && (
                        <span className="text-blue-600 dark:text-blue-400">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Recently used */}
            {!search && recentlyUsed.length > 0 && (
              <div className="mb-2 border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
                <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                  Recently Used
                </div>
                {recentlyUsed.map((rName) => {
                  const match = AVAILABLE_FONTS.find(
                    (f) => f.family.toLowerCase() === rName.toLowerCase()
                  );
                  if (!match) return null;
                  return (
                    <button
                      key={`recent_${rName}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelect(match)}
                      className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <span className="text-xs" style={{ fontFamily: match.previewFamily }}>
                        {match.displayName}
                      </span>
                      {activeFont.family.toLowerCase() === match.family.toLowerCase() && (
                        <span className="text-blue-600 dark:text-blue-400">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Standard Groups */}
            {groups.map(([groupName, fonts]) => (
              <div key={groupName} className="mb-2">
                <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                  {groupName}
                </div>
                {fonts.map((font) => (
                  <button
                    key={font.family}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(font)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <span className="text-xs" style={{ fontFamily: font.previewFamily }}>
                      {font.displayName}
                    </span>
                    {activeFont.family.toLowerCase() === font.family.toLowerCase() && (
                      <span className="text-blue-600 dark:text-blue-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
