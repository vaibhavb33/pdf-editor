"use client";

import React, { useSyncExternalStore } from "react";
import { useTheme } from "./ThemeProvider";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <button
      type="button"
      onClick={toggleTheme}
      id="theme-toggle-btn"
      aria-label={
        mounted ? `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode` : "Toggle theme"
      }
      className="relative flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl border border-zinc-200 bg-white/80 text-zinc-700 shadow-xs transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus-visible:ring-blue-500"
    >
      {mounted ? (
        resolvedTheme === "dark" ? (
          // Sun icon when in dark mode (clicking will switch to light)
          <svg
            className="h-5 w-5 text-amber-400 transition-transform duration-200 hover:rotate-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          // Moon icon when in light mode (clicking will switch to dark)
          <svg
            className="h-5 w-5 text-blue-600 transition-transform duration-200 hover:-rotate-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )
      ) : (
        <span className="h-5 w-5 opacity-0" aria-hidden="true" />
      )}
    </button>
  );
}
