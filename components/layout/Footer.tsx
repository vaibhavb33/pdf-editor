"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig, companyLinks } from "@/content/site";

export function Footer() {
  const pathname = usePathname();

  // The site footer must NOT render inside the editor route to avoid overlap and pushing
  if (pathname === "/edit-pdf" || pathname?.startsWith("/edit-pdf")) {
    return null;
  }

  return (
    <footer
      id="site-footer"
      className="mt-auto border-t border-zinc-200 bg-zinc-50 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 md:grid-cols-6">
          {/* Brand info & Trust Architecture */}
          <div className="space-y-4 sm:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-zinc-900 dark:text-white"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight">
                pdfivo<span className="text-blue-600 dark:text-blue-400">.co</span>
              </span>
            </Link>

            <p className="max-w-sm text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
              Free, private online PDF tools running 100% locally in your browser. No uploads, no
              signups, no paywalls.
            </p>

            <div className="space-y-1 rounded-2xl border border-zinc-200 bg-white p-3.5 text-xs text-zinc-600 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Zero-Knowledge Privacy
              </div>
              <p className="text-[11px] leading-relaxed">
                Documents are processed in local browser memory via Web Workers. Files never leave
                your device.
              </p>
            </div>
          </div>

          {/* Categorized Tool Columns (Organize, Convert, Edit, Secure) */}
          {siteConfig.footerCategories.map((group) => (
            <div key={group.category} className="space-y-3">
              <h3 className="text-xs font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.tools.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/${t.slug}`}
                      className="inline-flex min-h-[44px] items-center text-xs text-zinc-600 transition-colors hover:text-blue-600 sm:min-h-0 sm:py-1 dark:text-zinc-400 dark:hover:text-blue-400"
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Company / Legal Column */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold tracking-wider text-zinc-900 uppercase dark:text-zinc-100">
              Company & Legal
            </h3>
            <ul className="space-y-1">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-[44px] items-center text-xs text-zinc-600 transition-colors hover:text-blue-600 sm:min-h-0 sm:py-1 dark:text-zinc-400 dark:hover:text-blue-400"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-8 text-xs text-zinc-500 sm:flex-row dark:border-zinc-800 dark:text-zinc-400">
          <p>© {new Date().getFullYear()} PDFivo.co — Free & Private PDF Utilities.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Client-Side Web Workers
            </span>
            <span>No Server Uploads</span>
            <span>No Signup Required</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
