import type { Metadata } from "next";
import { getAllTools } from "@/content";
import { constructMetadata } from "@/lib/seo/metadata";
import { HomeToolExplorer } from "@/components/home/HomeToolExplorer";
import dynamic from "next/dynamic";
import { FaqAccordion } from "@/components/ui/FaqAccordion";

const InteractiveWorkspacePreview = dynamic(
  () =>
    import("@/components/home/InteractiveWorkspacePreview").then(
      (m) => m.InteractiveWorkspacePreview
    ),
  {
    loading: () => (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[420px] w-full animate-pulse flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="mb-4 h-12 w-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="mb-2 h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-64 rounded bg-zinc-100 dark:bg-zinc-800/60" />
        <span className="sr-only">Loading interactive workspace demo...</span>
      </div>
    ),
  }
);
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getOrganizationSchema, getWebSiteSchema } from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
  title: "Free Private Online PDF Tools - PDFivo",
  description:
    "Edit, merge, split, compress, and convert PDF documents in your browser. No uploads, no signups, and zero tracking. Try PDFivo free today.",
  path: "/",
});

export default function HomePage() {
  const allTools = getAllTools();

  const generalFaqs = [
    {
      question: "How can PDFivo process my PDFs without uploading them to a server?",
      answer:
        "PDFivo uses WebAssembly and multi-threaded Web Workers directly in your browser. Libraries like pdf-lib and PDF.js parse, modify, and save PDF files inside your browser tab's local memory. The data never leaves your computer.",
    },
    {
      question: "Are there any file size limits or daily usage limits?",
      answer:
        "No. There are zero artificial limits, no subscriptions, and no paywalls. You can process as many files as your device memory can handle.",
    },
    {
      question: "Do I need to create an account or provide my email address?",
      answer:
        "No. PDFivo requires no signup, no login, and no email. All tools are immediately accessible to anyone with a modern web browser.",
    },
    {
      question: "How does clipboard paste work in PDFivo?",
      answer:
        "You can simply copy a PDF file or an image (e.g., using Print Screen or Snipping Tool) and press Ctrl+V (or ⌘V on Mac) anywhere in the tool workspace to load it instantly.",
    },
    {
      question: "Will my documents be preserved after I close the tab?",
      answer:
        "No. To ensure absolute privacy, all processed file buffers exist only in temporary browser RAM and are completely erased the moment you close or refresh the tab.",
    },
  ];

  const orgSchema = getOrganizationSchema();
  const webSiteSchema = getWebSiteSchema();

  return (
    <div className="flex flex-1 flex-col pb-16 sm:pb-24">
      <JsonLd data={orgSchema} />
      <JsonLd data={webSiteSchema} />

      {/* 1. Hero Section */}
      <section
        id="hero"
        className="relative overflow-hidden border-b border-zinc-200 bg-zinc-50/60 pt-12 pb-16 sm:pt-20 sm:pb-24 dark:border-zinc-800/80 dark:bg-zinc-950/60"
      >
        {/* Subtle Ambient Radial Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[100px] dark:bg-blue-600/15"
        />

        <div className="relative z-10 mx-auto max-w-5xl space-y-6 px-4 text-center sm:px-6">
          {/* Trust messaging badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Badge variant="success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              100% Client-Side Engine
            </Badge>
            <Badge variant="primary">No Signup Required</Badge>
            <Badge variant="outline">Zero Server Uploads</Badge>
          </div>

          {/* Main Trust Headline */}
          <h1 className="text-3xl leading-[1.15] font-extrabold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl dark:text-white">
            Free Online PDF Tools.{" "}
            <span className="mt-1 block text-blue-600 dark:text-blue-400">
              Files never leave your device.
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
            Merge, split, compress, convert, and protect PDF files directly inside your web browser.
            No upload queues, no subscriptions, and total privacy.
          </p>

          {/* Trust Guarantees Row */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-medium text-zinc-600 sm:text-sm dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Zero Server Uploads
            </span>
            <span className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              No Registration or Login
            </span>
            <span className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              No Paywall or Limits
            </span>
          </div>
        </div>
      </section>

      {/* 2. Interactive Tool Search & Category Filter Section */}
      <section
        id="tools"
        aria-label="PDF Tools Catalog"
        className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        <div className="mb-8 text-center">
          <Badge variant="outline" className="mb-2">
            Tool Directory
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            Explore All 14 Client-Side PDF Tools
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
            Instant execution in local browser memory. Click any tool to start processing files
            immediately.
          </p>
        </div>
        <HomeToolExplorer initialTools={allTools} />
      </section>

      {/* 3. Reusable Component Suite Live Demo */}
      <section id="preview" className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <Badge variant="primary" className="mb-2">
            Reusable Architecture
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            Try the Shared Component Workspace
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
            Test the drag-and-drop & clipboard paste Dropzone, reorderable FileList, animated
            ProgressBar, and ResultCard with Download controls.
          </p>
        </div>

        <InteractiveWorkspacePreview />
      </section>

      {/* 4. Privacy & Trust Architecture */}
      <section
        id="privacy"
        className="mx-auto w-full max-w-7xl border-t border-zinc-200 px-4 py-16 sm:px-6 lg:px-8 dark:border-zinc-800/80"
      >
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <Badge variant="success" className="mb-2">
            Privacy First
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            How Client-Side PDF Processing Protects You
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
            Standard web tools send your bank statements, tax documents, and confidential records to
            third-party cloud servers. PDFivo processes everything on your device.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card hoverEffect>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Zero Server Uploads
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Files are processed in local memory. Inspect your browser network tab: zero file bytes
              are transmitted over the internet.
            </p>
          </Card>

          <Card hoverEffect>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Web Worker Multithreading
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Heavy document operations execute on background worker threads. Your browser interface
              stays snappy and responsive.
            </p>
          </Card>

          <Card hoverEffect>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-900/60 dark:bg-purple-950/60 dark:text-purple-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Unlimited & No Paywalls
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              No daily limits, no watermark penalties, and no premium traps. PDFivo remains free and
              open for everyone.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. Static FAQ Accordion Section (SSG rendered) */}
      <section className="mx-auto w-full max-w-4xl border-t border-zinc-200 px-4 py-16 sm:px-6 dark:border-zinc-800/80">
        <div className="mb-10 text-center">
          <Badge variant="outline" className="mb-2">
            Frequently Asked Questions
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            Everything you need to know about PDFivo
          </h2>
        </div>

        <FaqAccordion faqs={generalFaqs} />
      </section>
    </div>
  );
}
