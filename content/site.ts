import { SiteConfig } from "./types";
import { tools } from "./tools";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://pdfivo.co").replace(/\/+$/, "");
const siteDomain = (() => {
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return "pdfivo.co";
  }
})();

export const siteConfig: SiteConfig = {
  name: "PDFivo",
  domain: siteDomain,
  url: siteUrl,
  tagline: "Free, Fast & 100% Client-Side PDF Tools",
  description:
    "Edit, merge, split, compress, and convert PDF documents directly inside your browser. No server uploads, no signups, no paywalls, zero limits.",
  privacyPledge:
    "All PDF operations run locally on your device via browser Web Workers and WebAssembly. Your files are never uploaded to any remote server or stored in the cloud.",
  navLinks: [
    { label: "Merge", href: "/merge-pdf" },
    { label: "Split", href: "/split-pdf" },
    { label: "Compress", href: "/compress-pdf" },
    { label: "Convert", href: "/pdf-to-jpg" },
  ],
  footerCategories: [
    {
      category: "organize",
      title: "Organize",
      tools: tools
        .filter((t) => t.category === "organize")
        .map((t) => ({ name: t.name, slug: t.slug })),
    },
    {
      category: "convert",
      title: "Convert",
      tools: tools
        .filter((t) => t.category === "convert")
        .map((t) => ({ name: t.name, slug: t.slug })),
    },
    {
      category: "edit",
      title: "Edit",
      tools: tools
        .filter((t) => t.category === "edit")
        .map((t) => ({ name: t.name, slug: t.slug })),
    },
    {
      category: "secure",
      title: "Secure",
      tools: tools
        .filter((t) => t.category === "secure")
        .map((t) => ({ name: t.name, slug: t.slug })),
    },
  ],
};

export const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact", href: "/contact" },
  { label: "Blog & Guides", href: "/blog" },
];
