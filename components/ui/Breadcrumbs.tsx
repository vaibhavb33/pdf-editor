import React from "react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center overflow-x-auto py-1 text-xs text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      <ol className="flex min-w-0 items-center gap-1.5">
        {/* Home Item */}
        <li className="flex shrink-0 items-center gap-1.5">
          <Link
            href="/"
            className="-m-1 flex items-center gap-1 rounded-md p-1 text-zinc-600 transition-colors hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:text-zinc-400 dark:hover:text-blue-400"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="sr-only sm:not-sr-only">Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex min-w-0 shrink-0 items-center gap-1.5">
              <svg
                className="h-3 w-3 shrink-0 text-zinc-400 dark:text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>

              {isLast || !item.href ? (
                <span
                  aria-current="page"
                  className="max-w-[200px] truncate font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="-m-1 max-w-[150px] truncate rounded-md p-1 text-zinc-600 transition-colors hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:text-zinc-400 dark:hover:text-blue-400"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
