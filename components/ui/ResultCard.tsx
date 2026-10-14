"use client";

import React from "react";
import { Button } from "./Button";
import { Badge } from "./Badge";

interface ResultCardProps {
  filename: string;
  filesize?: number;
  originalSize?: number;
  downloadUrl: string;
  onReset?: () => void;
  status?: "success" | "error";
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}

export function ResultCard({
  filename,
  filesize,
  originalSize,
  downloadUrl,
  onReset,
  status = "success",
  errorMessage,
  onRetry,
  className = "",
}: ResultCardProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const savingsPercentage =
    originalSize && filesize && originalSize > filesize
      ? Math.round(((originalSize - filesize) / originalSize) * 100)
      : null;

  if (status === "error") {
    return (
      <div
        role="alert"
        className={`space-y-4 rounded-3xl border border-rose-200 bg-rose-50/60 p-6 text-center sm:p-8 dark:border-rose-900/60 dark:bg-rose-950/40 ${className}`}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div>
          <h3 className="text-lg font-bold text-rose-950 dark:text-rose-100">Processing Error</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-rose-800 dark:text-rose-300">
            {errorMessage || "We encountered an issue processing your document in the browser."}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onRetry && (
            <Button variant="primary" onClick={onRetry}>
              Try Again
            </Button>
          )}
          {onReset && (
            <Button variant="outline" onClick={onReset}>
              Start Over
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Processing complete"
      className={`space-y-5 rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 text-center shadow-sm sm:p-8 dark:border-emerald-900/50 dark:bg-emerald-950/20 ${className}`}
    >
      {/* Success Icon */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-xs dark:bg-emerald-900/40 dark:text-emerald-400">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Title & Metadata */}
      <div>
        <div className="mb-2 inline-flex items-center gap-1.5">
          <Badge variant="success">Document Ready</Badge>
          {savingsPercentage !== null && savingsPercentage > 0 && (
            <Badge variant="accent">-{savingsPercentage}% Smaller</Badge>
          )}
        </div>

        <h3 className="mx-auto max-w-md truncate text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">
          {filename}
        </h3>

        {filesize !== undefined && (
          <p className="mt-1 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
            Processed Size: <span className="font-semibold">{formatBytes(filesize)}</span>
            {originalSize && (
              <span className="ml-1 text-zinc-400 dark:text-zinc-500">
                (was {formatBytes(originalSize)})
              </span>
            )}
          </p>
        )}
      </div>

      {/* Main Download Action */}
      <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
        <a
          href={downloadUrl}
          download={filename}
          id="result-download-btn"
          className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none active:scale-[0.98] sm:w-auto"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download PDF
        </a>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none sm:w-auto dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Convert Another
          </button>
        )}
      </div>

      <p className="pt-1 text-[11px] text-zinc-500 dark:text-zinc-500">
        Generated 100% inside your browser. No files stored on any server.
      </p>
    </div>
  );
}
