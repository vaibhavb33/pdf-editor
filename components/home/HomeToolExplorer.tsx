"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { ToolDefinition, ToolCategory } from "@/content/types";
import { ToolCard } from "@/components/tools/ToolCard";

interface HomeToolExplorerProps {
  initialTools: ToolDefinition[];
}

export function HomeToolExplorer({ initialTools }: HomeToolExplorerProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | ToolCategory>("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener to focus search with '/' or 'Cmd+K' / 'Ctrl+K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" &&
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA") ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle URL hash category navigation (e.g. /#organize, /#convert, /#edit, /#secure)
  useEffect(() => {
    const applyHashCategory = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (["organize", "convert", "edit", "secure"].includes(hash)) {
        setActiveCategory(hash as ToolCategory);
      }
    };
    applyHashCategory();
    window.addEventListener("hashchange", applyHashCategory);
    return () => window.removeEventListener("hashchange", applyHashCategory);
  }, []);

  const categories: { id: "all" | ToolCategory; label: string }[] = [
    { id: "all", label: "All Tools" },
    { id: "organize", label: "Organize" },
    { id: "convert", label: "Convert" },
    { id: "edit", label: "Edit" },
    { id: "secure", label: "Secure" },
  ];

  const filteredTools = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    return initialTools.filter((tool) => {
      // Category check
      if (activeCategory !== "all" && tool.category !== activeCategory) {
        return false;
      }

      // Query check
      if (!cleanQuery) return true;

      const matchName = tool.name.toLowerCase().includes(cleanQuery);
      const matchDesc = tool.shortDescription.toLowerCase().includes(cleanQuery);
      const matchKeywords = tool.seo.keywords.some((k) => k.toLowerCase().includes(cleanQuery));
      const matchCategory = tool.category.toLowerCase().includes(cleanQuery);

      return matchName || matchDesc || matchKeywords || matchCategory;
    });
  }, [initialTools, query, activeCategory]);

  return (
    <div className="w-full scroll-mt-24 space-y-8">
      {/* Search & Category Filter Controls */}
      <div className="mx-auto max-w-3xl space-y-4">
        {/* Instant Search Bar */}
        <div className="relative">
          <label htmlFor="tool-search-input" className="sr-only">
            Search PDF tools
          </label>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <input
            ref={searchInputRef}
            id="tool-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools (e.g. merge, split, compress, protect)..."
            className="min-h-[52px] w-full rounded-2xl border border-zinc-200 bg-white py-3 pr-24 pl-11 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm transition-all focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none sm:text-base dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-100"
          />

          <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3">
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search query"
                className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:hover:text-zinc-200"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : (
              <kbd className="hidden items-center gap-0.5 rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 font-mono text-[11px] text-zinc-400 sm:inline-flex dark:border-zinc-700 dark:bg-zinc-800">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Filter Chips / Categories */}
        <div
          role="tablist"
          aria-label="Filter tools by category"
          className="flex items-center justify-center gap-1.5 overflow-x-auto pb-1 sm:gap-2"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={cat.id !== "all" ? cat.id : undefined}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`min-h-[44px] cursor-pointer scroll-mt-24 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none sm:text-sm ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header / Status */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
        <p>
          Showing{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {filteredTools.length}
          </span>{" "}
          {filteredTools.length === 1 ? "tool" : "tools"}
          {query && (
            <span>
              {" "}
              matching{" "}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                &ldquo;{query}&rdquo;
              </span>
            </span>
          )}
        </p>

        {(query || activeCategory !== "all") && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveCategory("all");
            }}
            className="min-h-[44px] cursor-pointer rounded-md px-2 text-xs font-semibold text-blue-600 hover:underline focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:text-blue-400"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Tools Grid or Empty State */}
      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50/50 px-4 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">No tools found</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
            We couldn&apos;t find any PDF tools matching &ldquo;{query}&rdquo;.
          </p>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategory("all");
              }}
              className="min-h-[44px] cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              Show all tools
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
