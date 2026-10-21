"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Badge } from "./Badge";

export interface SelectedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSizeMB?: number;
  isLoading?: boolean;
  errorMessage?: string | null;
  onClearError?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Dropzone({
  onFilesSelected,
  acceptedTypes = [".pdf", "application/pdf"],
  maxFiles,
  maxSizeMB = 100,
  isLoading = false,
  errorMessage = null,
  onClearError,
  disabled = false,
  className = "",
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const activeError = errorMessage || localError;

  const validateAndEmit = useCallback(
    (fileList: FileList | File[]) => {
      setLocalError(null);
      onClearError?.();

      const rawFiles = Array.from(fileList);
      if (rawFiles.length === 0) return;

      if (maxFiles && rawFiles.length > maxFiles) {
        setLocalError(`Please select a maximum of ${maxFiles} file(s).`);
        return;
      }

      const validFiles: File[] = [];
      const maxBytes = maxSizeMB * 1024 * 1024;

      for (const file of rawFiles) {
        if (file.size > maxBytes) {
          setLocalError(`"${file.name}" exceeds the maximum supported size of ${maxSizeMB}MB.`);
          return;
        }

        // Basic type verification
        const matchesType = acceptedTypes.some((type) => {
          if (type.startsWith(".")) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          if (type.endsWith("/*")) {
            const prefix = type.replace("/*", "");
            return file.type.startsWith(prefix);
          }
          return file.type === type;
        });

        if (!matchesType && acceptedTypes.length > 0 && !acceptedTypes.includes("*")) {
          setLocalError(
            `"${file.name}" is not a supported file type. Accepted: ${acceptedTypes.join(", ")}`
          );
          return;
        }

        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [acceptedTypes, maxFiles, maxSizeMB, onClearError, onFilesSelected]
  );

  // Global & local clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled || isLoading) return;
      if (!e.clipboardData || !e.clipboardData.files) return;

      const pastedFiles = Array.from(e.clipboardData.files);
      if (pastedFiles.length > 0) {
        e.preventDefault();
        validateAndEmit(pastedFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [disabled, isLoading, validateAndEmit]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled || isLoading) return;

    if (e.dataTransfer && e.dataTransfer.files) {
      validateAndEmit(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    if (!disabled && !isLoading) {
      inputRef.current?.click();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* Error Alert if any */}
      {activeError && (
        <div
          role="alert"
          className="animate-in fade-in flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 sm:text-sm dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-100"
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{activeError}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setLocalError(null);
              onClearError?.();
            }}
            aria-label="Dismiss error"
            className="-m-2 flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200"
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
        </div>
      )}

      {/* Dropzone Container */}
      <div
        ref={dropzoneRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Choose files, drag & drop, or paste from clipboard"
        aria-disabled={disabled || isLoading}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center transition-all duration-200 select-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none sm:min-h-[260px] sm:p-10 dark:focus-visible:ring-offset-zinc-950 ${
          isDragOver
            ? "scale-[1.01] border-blue-600 bg-blue-50/60 dark:bg-blue-950/30"
            : "border-zinc-300 bg-zinc-50/50 hover:border-blue-500/80 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/70"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          id="dropzone-file-input"
          aria-hidden="true"
          multiple={maxFiles !== 1}
          accept={acceptedTypes.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              validateAndEmit(e.target.files);
              e.target.value = "";
            }
          }}
        />

        {isLoading ? (
          /* Loading State */
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Reading file contents...
            </p>
          </div>
        ) : (
          /* Empty / Default State */
          <>
            <div
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-xs transition-transform duration-200 group-hover:scale-110 sm:h-16 sm:w-16 ${
                isDragOver
                  ? "bg-blue-600 text-white"
                  : "border border-blue-200/60 bg-blue-50 text-blue-600 dark:border-blue-800/60 dark:bg-blue-950/60 dark:text-blue-400"
              }`}
            >
              <svg
                className="h-7 w-7 sm:h-8 sm:w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <span className="block text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-100">
              {isDragOver ? "Drop files to load" : "Choose files, drag & drop, or paste"}
            </span>

            <p className="mt-1.5 max-w-sm text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
              Press{" "}
              <kbd className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[10px] dark:bg-zinc-800">
                Ctrl+V
              </kbd>{" "}
              /{" "}
              <kbd className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[10px] dark:bg-zinc-800">
                ⌘V
              </kbd>{" "}
              to paste clipboard items directly
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-blue-600 px-8 text-base font-bold text-white shadow-xs transition-colors hover:bg-blue-700 active:scale-98">
                Select PDF file
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
              <span>Supports {acceptedTypes.join(", ")}</span>
              <span>•</span>
              <Badge variant="success" className="py-0.5 text-[10px]">
                100% Client-Side
              </Badge>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
