import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = constructMetadata({
  title: "Terms of Service & Usage - PDFivo",
  description:
    "Read the simple, transparent terms of service for using PDFivo's free client-side PDF utilities. Review our fair usage terms today.",
  path: "/terms",
  keywords: ["terms of service", "usage terms", "pdfivo terms", "free pdf service terms"],
});

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col pb-20">
      {/* Header & Breadcrumb */}
      <section className="border-b border-zinc-200 bg-zinc-50/70 pt-8 pb-12 transition-colors dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Breadcrumbs items={[{ label: "Terms of Service" }]} className="mb-6" />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="primary">Fair Usage</Badge>
              <Badge variant="outline">Effective 2026</Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
              Terms of Service & Fair Usage Policy
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
              Clear, transparent rules governing the use of PDFivo&apos;s client-side software.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <article className="space-y-12">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              1. Acceptance of Terms
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              By accessing and using PDFivo (pdfivo.co), you agree to be bound by these Terms of
              Service. If you do not agree with any part of these terms, please discontinue use of
              the service.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              2. Description of the Service
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              PDFivo provides browser-based, client-side PDF utilities including merging, splitting,
              compression, signing, watermarking, and converting documents. All computational logic
              executes locally on the user&apos;s machine without transmitting file contents to our
              infrastructure.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-6 border-t border-zinc-200 pt-10 dark:border-zinc-800">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              3. User Responsibilities & Content Ownership
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Intellectual Property & Rights
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  You retain 100% ownership and copyright of all documents processed through PDFivo.
                  Because we never store or receive your files, we claim zero rights or licenses
                  over your materials.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Lawful Document Usage
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  You agree to use PDFivo only for lawful purposes. You must have appropriate rights
                  or authorization to manipulate, decrypt, or sign any documents you process with
                  our tools.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              4. Disclaimer of Warranties
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              PDFivo is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis
              without warranties of any kind, whether express or implied. While we strive for
              absolute accuracy and high document fidelity, we do not warrant that file processing
              will be completely error-free across every non-standard PDF variation.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              5. Limitation of Liability
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              In no event shall PDFivo or its creators be liable for any indirect, incidental, or
              consequential damages arising from the use or inability to use the service. Always
              maintain backup copies of critical documents prior to modification.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              6. Contact & Inquiries
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              For legal inquiries or questions regarding these terms, please visit our{" "}
              <Link
                href="/contact"
                className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Contact Page
              </Link>
              .
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
