import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = constructMetadata({
  title: "Privacy Policy & Zero-Log Pledge - PDFivo",
  description:
    "Our zero-log, zero-upload architecture guarantees your documents never leave your browser. Learn how we safeguard your data today.",
  path: "/privacy",
  keywords: ["privacy policy", "zero upload pledge", "private pdf tools", "client side privacy"],
});

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col pb-20">
      {/* Header & Breadcrumb */}
      <section className="border-b border-zinc-200 bg-zinc-50/70 pt-8 pb-12 transition-colors dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Breadcrumbs items={[{ label: "Privacy Policy" }]} className="mb-6" />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="success">Zero-Knowledge Architecture</Badge>
              <Badge variant="outline">Updated 2026</Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
              Privacy Policy & Zero-Upload Pledge
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
              At PDFivo, your privacy isn&apos;t an afterthought or a legal disclaimer. It is the
              foundational premise upon which our software is engineered.
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
              1. The Zero-Upload Guarantee
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              When you use PDFivo to merge, split, compress, sign, or edit a document, your files
              are never uploaded to any remote server or cloud infrastructure.
            </p>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Every operation runs entirely within your device&apos;s local web browser via
              client-side Web Workers and WebAssembly. You can disconnect your internet connection
              after loading the website, and all 14 tools will continue to operate normally.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-6 border-t border-zinc-200 pt-10 dark:border-zinc-800">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              2. Data We Do NOT Collect
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              Because PDFivo operates without server-side processing, we cannot view, store, or sell
              your document information. Specifically, we never collect:
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Document Contents & Metadata
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  We never receive, view, or parse your file contents, text strings, images, or
                  author metadata on any server.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Personal Identifiers & Passwords
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  We do not require signups, names, email addresses, or payment information.
                  Passwords entered in Protect or Unlock tools stay in browser memory.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-6 border-t border-zinc-200 pt-10 dark:border-zinc-800">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              3. Information Stored Locally in Your Browser
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              To provide a smooth user experience, limited non-identifiable settings may be held
              locally on your device:
            </p>

            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Theme Preference (Light / Dark Mode)
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Your color theme preference is stored in local storage to prevent visual flash on
                  page reload. It is never transmitted.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Volatile Browser Memory
                </h3>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Selected files are held in temporary browser memory while being manipulated.
                  Closing or refreshing the browser tab purges all document data immediately.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              4. Verification & Auditing
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              We encourage users, security researchers, and enterprise IT teams to empirically
              verify our claims. You can open your browser Developer Tools (F12), switch to the
              Network tab, and execute any operation on PDFivo. You will observe that zero document
              payloads are sent over the network.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-4 border-t border-zinc-200 pt-10 dark:border-zinc-800">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              5. Questions Regarding Privacy
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              If you have any questions or feedback regarding our privacy practices, please contact
              us directly through our{" "}
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
