import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllTools, getToolBySlug } from "@/content";
import { constructMetadata } from "@/lib/seo/metadata";
import {
  getSoftwareApplicationSchema,
  getHowToSchema,
  getFaqSchema,
  getBreadcrumbSchema,
} from "@/lib/seo/schema";
import { JsonLd } from "@/components/seo/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { siteConfig } from "@/content/site";
import { ToolWorkspaceController } from "@/components/tools/ToolWorkspaceController";
import { ToolCard } from "@/components/tools/ToolCard";
import { ToolDefinition } from "@/content/types";

interface ToolPageProps {
  params: Promise<{
    tool: string;
  }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((tool) => ({
    tool: tool.slug,
  }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { tool: slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return constructMetadata({
      title: "Tool Not Found - PDFivo",
      description:
        "The requested PDF tool was not found. Browse all free client-side PDF tools now.",
      path: `/${slug}`,
    });
  }

  return constructMetadata({
    title: tool.seo.title,
    description: tool.seo.description,
    path: `/${tool.slug}`,
    keywords: tool.seo.keywords,
  });
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { tool: slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const appSchema = getSoftwareApplicationSchema(tool);
  const howToSchema = getHowToSchema(tool);
  const faqSchema = getFaqSchema(tool.faqs);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: siteConfig.url },
    { name: tool.category.toUpperCase(), url: `${siteConfig.url}/#${tool.category}` },
    { name: tool.name, url: `${siteConfig.url}/${tool.slug}` },
  ]);

  const relatedTools = (tool.relatedSlugs || [])
    .map((s) => getToolBySlug(s))
    .filter((t): t is ToolDefinition => Boolean(t))
    .slice(0, 4);

  // Dedicated Fixed App-Shell Layout for Edit PDF:
  // Fills remaining viewport (100dvh - 4rem header) with zero page-level scroll,
  // omitting marketing sections and footer to prevent layout overlap/pushing.
  if (tool.slug === "edit-pdf") {
    return (
      <div className="flex h-[calc(100dvh-4rem)] w-full flex-col min-h-0 overflow-hidden">
        <JsonLd data={appSchema} />
        {howToSchema && <JsonLd data={howToSchema} />}
        {faqSchema && <JsonLd data={faqSchema} />}
        <JsonLd data={breadcrumbSchema} />
        <ToolWorkspaceController slug="edit-pdf" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col pb-20">
      <JsonLd data={appSchema} />
      {howToSchema && <JsonLd data={howToSchema} />}
      {faqSchema && <JsonLd data={faqSchema} />}
      <JsonLd data={breadcrumbSchema} />

      {/* Tool Header & Breadcrumbs */}
      <section className="border-b border-zinc-200 bg-zinc-50/70 pt-8 pb-12 transition-colors dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Breadcrumbs
            items={[
              {
                label: tool.category.charAt(0).toUpperCase() + tool.category.slice(1),
                href: `/#${tool.category}`,
              },
              { label: tool.name },
            ]}
            className="mb-6"
          />

          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="success">100% Private (No Upload)</Badge>
              {tool.badge && <Badge variant="accent">{tool.badge}</Badge>}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-white">
              {tool.name}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
              {tool.tagline}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-500 sm:text-base dark:text-zinc-400">
              {tool.longDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Client-Side Dedicated Interactive Tool Workspace */}
      <section
        aria-label={`${tool.name} Interactive Workspace`}
        className={`mx-auto min-h-[380px] w-full ${
          tool.slug === "edit-pdf" ? "max-w-[1600px] px-2 sm:px-4" : "max-w-6xl px-4 sm:px-6"
        } py-8`}
      >
        <ToolWorkspaceController slug={tool.slug} />
      </section>

      {/* How to use in 3 steps */}
      <section className="border-t border-zinc-200 bg-zinc-50/50 py-12 transition-colors dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              How to {tool.name} in 3 Simple Steps
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Fast, intuitive, and executed directly in your browser with zero learning curve.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {tool.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/80"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-xs">
                  {step.stepNumber}
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
            Why Choose PDFivo for {tool.name}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Engineered from the ground up for strict privacy, speed, and uncompromising fidelity.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {tool.benefits.map((benefit, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs transition-colors dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {benefit.title}
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-zinc-600 sm:text-sm dark:text-zinc-400">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5-Question FAQ Section */}
      <section className="border-t border-zinc-200 bg-zinc-50/50 py-14 transition-colors dark:border-zinc-800 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Everything you need to know about processing your files with {tool.name}.
            </p>
          </div>
          <div className="mt-8">
            <FaqAccordion faqs={tool.faqs} />
          </div>
        </div>
      </section>

      {/* Related Tools Section */}
      {relatedTools.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="mb-8 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Related PDF Tools
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Explore more private, browser-based utilities to optimize your workflow.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedTools.map((relTool) => (
              <ToolCard key={relTool.id} tool={relTool} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
