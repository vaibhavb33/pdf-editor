import React from "react";

interface ProgressBarProps {
  progress?: number; // 0 to 100
  stage?: string;
  indeterminate?: boolean;
  status?: "normal" | "success" | "error";
  className?: string;
}

export function ProgressBar({
  progress = 0,
  stage = "Processing document...",
  indeterminate = false,
  status = "normal",
  className = "",
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  const getBarColor = () => {
    switch (status) {
      case "success":
        return "bg-emerald-500";
      case "error":
        return "bg-rose-500";
      case "normal":
      default:
        return "bg-blue-600 dark:bg-blue-500";
    }
  };

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs font-medium text-zinc-700 sm:text-sm dark:text-zinc-300">
        <span className="flex items-center gap-2 truncate">
          {!indeterminate && status === "normal" && (
            <svg
              className="h-4 w-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
            >
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
          )}
          {status === "success" && (
            <svg
              className="h-4 w-4 shrink-0 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === "error" && (
            <svg
              className="h-4 w-4 shrink-0 text-rose-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="truncate">{stage}</span>
        </span>

        {!indeterminate && (
          <span className="shrink-0 font-semibold text-zinc-900 tabular-nums dark:text-zinc-100">
            {clampedProgress}%
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={stage}
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 shadow-inner dark:bg-zinc-800"
      >
        {indeterminate ? (
          <div className="origin-left-right h-full w-full animate-[indeterminate_1.5s_infinite_ease-in-out] rounded-full bg-blue-600 dark:bg-blue-500" />
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${getBarColor()}`}
            style={{ width: `${clampedProgress}%` }}
          />
        )}
      </div>
    </div>
  );
}
