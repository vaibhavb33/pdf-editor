import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = constructMetadata({
  title: "About Our Private PDF Mission - PDFivo",
  description:
    "Learn why PDFivo processes PDF documents 100% client-side in your browser with WebAssembly and Web Workers. Read our privacy pledge today.",
  path: "/about",
  keywords: [
    "about pdfivo",
    "client side pdf mission",
    "private pdf tools",
    "in browser pdf processing",
  ],
});

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col pb-20">
      {/* Header & Breadcrumb */}
      <section className="border-b border-zinc-200 bg-zinc-50/70 pt-8 pb-12 transition-colors dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Breadcrumbs items={[{ label: "About Us" }]} className="mb-6" />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="success">Privacy by Architecture</Badge>
              <Badge variant="outline">Client-Side Only</Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
              About PDFivo: Private In-Browser Document Tools
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
              PDFivo was created with a clear purpose: to provide powerful, free document utilities
              without demanding your personal data, files, or trust.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <article className="space-y-12">
          {/* Section: Mission */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              Our Core Mission
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              When people merge tax returns, sign job agreements, or compress bank statements, they
              routinely upload sensitive records to unknown cloud servers operated by commercial PDF
              portals. These servers often log IP addresses, store temporary copies, and reserve the
              right to analyze document contents.
            </p>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              PDFivo fundamentally changes this paradigm. By moving 100% of the PDF manipulation
              pipeline directly into the browser, we eliminate the need for server uploads entirely.
              Your files never leave your device, meaning privacy is not just a promise—it is an
              architectural certainty.
            </p>
          </section>

          {/* Section: Technology */}
          <section className="space-y-6 border-t border-zinc-200 pt-10 dark:border-zinc-800">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              How PDFivo Works Under the Hood
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Modern web browsers are capable computation environments. PDFivo harnesses
              cutting-edge web standards to deliver desktop-grade document manipulation without
              external binaries.
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  WebAssembly & Web Workers
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Heavy computational tasks like binary stream parsing, image re-encoding, and
                  vector rendering run on dedicated background threads. Your interface stays smooth,
                  and your device processor does the work directly.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Zero Data Transmission
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  You can inspect your browser&apos;s network inspection tab while using any tool on
                  PDFivo. Not a single byte of your document is sent across the internet. Everything
                  resides in temporary browser memory.
                </p>
              </div>
            </div>
          </section>

          {/* Section: Commitments */}
          <section className="space-y-6 border-t border-zinc-200 pt-10 dark:border-zinc-800">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              Our Commitments to You
            </h2>

            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  1. No Accounts, Passwords, or Emails
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  You never have to register, log in, or verify an email address to use PDFivo. Open
                  the website and start working immediately.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  2. No Paywalls or Artificial Limits
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  We don&apos;t limit you to 2 documents per hour or hold your files hostage behind
                  trial watermarks. All 14 tools are fully unlocked.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  3. Built on Trust and Open Standards
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  We leverage trusted open-source PDF foundations like pdf-lib, PDF.js, and JSZip to
                  guarantee predictable, standardized file outputs that work in all PDF viewers.
                </p>
              </div>
            </div>
          </section>

          {/* Call to action */}
          <section className="rounded-3xl border border-blue-200 bg-blue-50/50 p-8 text-center dark:border-blue-900/50 dark:bg-blue-950/20">
            <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">
              Ready to process your documents privately?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
              Browse our suite of 14 client-side PDF tools and get started in seconds.
            </p>
            <div className="mt-6">
              <Link
                href="/#tools"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
              >
                Explore All Tools
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
