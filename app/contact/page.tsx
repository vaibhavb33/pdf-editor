import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo/metadata";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = constructMetadata({
  title: "Contact Support & Feedback - PDFivo",
  description:
    "Have a suggestion or need help with PDFivo? Get in touch with our team for prompt support and feature feedback. Contact us today.",
  path: "/contact",
  keywords: ["contact pdfivo", "pdfivo support", "feedback", "feature request", "pdf tools help"],
});

export default function ContactPage() {
  return (
    <div className="flex flex-1 flex-col pb-20">
      {/* Header & Breadcrumb */}
      <section className="border-b border-zinc-200 bg-zinc-50/70 pt-8 pb-12 transition-colors dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Breadcrumbs items={[{ label: "Contact Us" }]} className="mb-6" />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="primary">Community & Support</Badge>
              <Badge variant="outline">Feedback Welcome</Badge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
              Contact the PDFivo Team
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
              Have questions, encounter a problem, or want to suggest a new client-side PDF utility?
              We would love to hear from you.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          {/* Form Column */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Send Us a Message
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Fill out the form below and we will get back to you as soon as possible.
            </p>

            <ContactForm />
          </section>

          {/* FAQ Column */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Frequently Asked Inquiries
            </h2>

            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Feature Requests & Suggestions
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                  We are continually expanding our client-side tools. If you have an idea for a tool
                  that can run safely in the browser, please share your thoughts.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Bug Reports & Malformed Files
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                  Found an unusual PDF that failed to parse? Let us know the PDF creation software
                  and error message so we can improve parser resiliency.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Self-Hosting & Enterprise Questions
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                  Interested in deploying PDFivo in an air-gapped corporate intranet? Reach out for
                  static bundling and configuration guidance.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/60">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Direct Communication Channels
              </h2>
              <div className="mt-3 space-y-2 text-xs text-zinc-600 sm:text-sm dark:text-zinc-400">
                <p>
                  <strong>Email:</strong> support@pdfivo.co
                </p>
                <p>
                  <strong>GitHub:</strong> github.com/pdfivo
                </p>
                <p>
                  <strong>Hours:</strong> Mon - Fri, 9am - 6pm UTC
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
