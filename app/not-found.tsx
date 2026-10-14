import Link from "next/link";
import { getToolBySlug } from "@/content";
import { ToolCard } from "@/components/tools/ToolCard";
import { ToolDefinition } from "@/content/types";

export default function NotFound() {
  const popularSlugs = [
    "merge-pdf",
    "split-pdf",
    "compress-pdf",
    "pdf-to-jpg",
    "sign-pdf",
    "protect-pdf",
  ];

  const popularTools = popularSlugs
    .map((slug) => getToolBySlug(slug))
    .filter((t): t is ToolDefinition => Boolean(t));

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-24">
      <div className="w-full max-w-4xl text-center">
        {/* Error Badge */}
        <div className="mx-auto mb-4 inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-400">
          HTTP 404 Error
        </div>

        {/* Exactly One H1 */}
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
          Page Not Found
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
          The page or tool you are looking for doesn&apos;t exist, has been moved, or the link was
          mistyped.
        </p>

        {/* Primary Action Button */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            ← Return to Home
          </Link>
          <Link
            href="/#tools"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Browse All 14 Tools
          </Link>
        </div>

        {/* Popular Tools Grid */}
        <div className="mt-16 border-t border-zinc-200 pt-12 dark:border-zinc-800">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
            Popular Free PDF Tools
          </h2>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
            Pick from our most frequently used utilities:
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
            {popularTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
