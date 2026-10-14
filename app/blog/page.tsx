import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { getArticleSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
  title: "PDF Tips & Privacy Guides - PDFivo",
  description:
    "Explore practical PDF productivity guides, privacy insights, and step-by-step tutorials for managing documents. Read our latest articles today.",
  path: "/blog",
  keywords: [
    "pdf tips",
    "pdf privacy guide",
    "client side pdf processing",
    "pdf tutorials",
    "secure pdf editing",
  ],
});

export default function BlogPage() {
  const articles = [
    {
      slug: "why-uploading-pdfs-is-a-security-risk",
      title: "Why Uploading PDFs to Free Cloud Converters Is a Security Risk",
      category: "Security",
      readTime: "5 min read",
      date: "October 2026",
      summary:
        "When you upload tax forms or employment agreements to typical online converters, your confidential data is exposed to server logs, storage vulnerabilities, and third-party AI scrapers. Learn why client-side processing is the safer alternative.",
    },
    {
      slug: "how-webassembly-enables-private-pdf-tools",
      title: "How In-Browser WebAssembly Makes Document Tools 100% Private",
      category: "Technology",
      readTime: "6 min read",
      date: "October 2026",
      summary:
        "Modern browsers have transformed into high-performance execution environments. Explore how WebAssembly, multithreaded Web Workers, and pdf-lib execute desktop-grade PDF manipulation right inside your device RAM.",
    },
    {
      slug: "how-to-compress-pdfs-for-email-without-blur",
      title: "How to Compress Large PDFs for Email Without Sacrificing Sharpness",
      category: "Productivity",
      readTime: "4 min read",
      date: "October 2026",
      summary:
        "Frustrated by 25MB email attachment limits? Learn how object stream optimization and selective image quantization can reduce PDF file sizes by up to 80% while keeping vector typography razor sharp.",
    },
    {
      slug: "electronic-signatures-and-in-browser-privacy",
      title: "Electronic Signatures Explained: Legal Recognition and Local Security",
      category: "Legal & Privacy",
      readTime: "7 min read",
      date: "October 2026",
      summary:
        "Demystifying the ESIGN Act and eIDAS frameworks. Discover how you can sign NDAs, invoices, and contracts securely in your browser without paying expensive monthly subscriptions to legacy providers.",
    },
  ];

  return (
    <div className="flex flex-1 flex-col pb-20">
      {articles.map((art) => (
        <JsonLd key={art.slug} data={getArticleSchema(art)} />
      ))}

      {/* Header & Breadcrumb */}
      <section className="border-b border-zinc-200 bg-zinc-50/70 pt-8 pb-12 transition-colors dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Breadcrumbs items={[{ label: "Blog & Guides" }]} className="mb-6" />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="primary">Insights & Tutorials</Badge>
              <Badge variant="success">Zero-Knowledge Tech</Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
              PDF Tips, Privacy Insights & Guides
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
              Discover best practices for handling confidential documents, optimizing file sizes,
              and maximizing your PDF productivity with zero privacy trade-offs.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-12">
          {/* Section: Featured Guides */}
          <section className="space-y-8">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              Featured Document Guides
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {articles.map((art) => (
                <article
                  key={art.slug}
                  id={art.slug}
                  className="flex scroll-mt-24 flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs transition-all hover:border-blue-400/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {art.category}
                      </span>
                      <span>{art.readTime}</span>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 transition-colors dark:text-zinc-100">
                      {art.title}
                    </h3>

                    <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                      {art.summary}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-zinc-100 pt-4 text-xs font-semibold text-zinc-400 dark:border-zinc-800/80">
                    <span>{art.date}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Section: Practical Tutorials */}
          <section className="space-y-6 border-t border-zinc-200 pt-10 dark:border-zinc-800">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              Popular Practical Tutorials
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  How to Combine Invoices and Receipts Into a Single Clean PDF
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                  Step-by-step instructions for arranging loose billing slips, ordering monthly
                  expense sheets, and exporting one unified report with the{" "}
                  <Link
                    href="/merge-pdf"
                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Merge PDF Tool
                  </Link>
                  .
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  How to Permanently Redact and Delete Sensitive Pages from a PDF
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                  Learn how to safely strip unnecessary or confidential appendix pages before
                  distributing documents to external stakeholders using the{" "}
                  <Link
                    href="/delete-pages"
                    className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Delete Pages Tool
                  </Link>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* Section: Call to action */}
          <section className="rounded-3xl border border-blue-200 bg-blue-50/50 p-8 text-center dark:border-blue-900/50 dark:bg-blue-950/20">
            <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl dark:text-white">
              Experience the Future of Private Document Utilities
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
              No registration, no tracking, and zero cloud uploads. Try our complete PDF tool suite.
            </p>
            <div className="mt-6">
              <Link
                href="/#tools"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
              >
                Browse All 14 Tools
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
