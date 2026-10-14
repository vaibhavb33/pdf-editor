"use client";

import React from "react";
import { SelectedFile } from "./Dropzone";

interface FileListProps {
  files: SelectedFile[];
  onReorder: (newFiles: SelectedFile[]) => void;
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  onAddMore?: () => void;
  className?: string;
}

export function FileList({
  files,
  onReorder,
  onRemove,
  onClearAll,
  onAddMore,
  className = "",
}: FileListProps) {
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;

    const updated = [...files];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    onReorder(updated);
  };

  if (files.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 ${className}`}
      >
        <p className="text-sm">No files uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* List Header */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {files.length} {files.length === 1 ? "Document" : "Documents"} Selected
        </span>

        <div className="flex items-center gap-2">
          {onAddMore && (
            <button
              type="button"
              onClick={onAddMore}
              className="min-h-[44px] cursor-pointer rounded-lg px-3 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:text-blue-400 dark:hover:text-blue-300"
            >
              + Add more
            </button>
          )}
          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="min-h-[44px] cursor-pointer rounded-lg px-3 text-xs font-medium text-rose-600 transition-colors hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none dark:text-rose-400 dark:hover:text-rose-300"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Files Container */}
      <ol className="space-y-2.5">
        {files.map((fileItem, index) => {
          const isFirst = index === 0;
          const isLast = index === files.length - 1;

          return (
            <li
              key={fileItem.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-xs transition-all duration-150 hover:border-zinc-300 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
            >
              {/* Left Details */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* Index badge */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {index + 1}
                </span>

                {/* PDF/File icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/60 dark:text-blue-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>

                {/* Title & Size */}
                <div className="min-w-0 flex-1">
                  <h4
                    className="truncate text-xs font-semibold text-zinc-900 sm:text-sm dark:text-zinc-100"
                    title={fileItem.name}
                  >
                    {fileItem.name}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    {formatSize(fileItem.size)}
                  </p>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex shrink-0 items-center gap-1">
                {/* Move Up */}
                <button
                  type="button"
                  onClick={() => moveItem(index, "up")}
                  disabled={isFirst}
                  aria-label={`Move ${fileItem.name} up`}
                  className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>

                {/* Move Down */}
                <button
                  type="button"
                  onClick={() => moveItem(index, "down")}
                  disabled={isLast}
                  aria-label={`Move ${fileItem.name} down`}
                  className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => onRemove(fileItem.id)}
                  aria-label={`Remove ${fileItem.name}`}
                  className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
