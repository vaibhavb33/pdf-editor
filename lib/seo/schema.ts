import { siteConfig } from "@/content/site";
import { ToolDefinition, ToolFaq } from "@/content/types";

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.png`,
    description: siteConfig.description,
    sameAs: ["https://github.com/pdfivo", "https://twitter.com/pdfivo"],
  };
}

export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function getSoftwareApplicationSchema(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.name} - ${siteConfig.name}`,
    url: `${siteConfig.url}/${tool.slug}`,
    description: tool.shortDescription,
    applicationCategory: "UtilityApplication",
    operatingSystem: "All (Modern Web Browsers)",
    browserRequirements: "Requires WebAssembly and Web Worker support",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: tool.features.join(", "),
  };
}

export function getFaqSchema(faqs: ToolFaq[]) {
  if (!faqs || faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function getHowToSchema(tool: ToolDefinition) {
  if (!tool.steps || tool.steps.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to ${tool.name} in 3 Simple Steps`,
    description: tool.tagline,
    step: tool.steps.map((step) => ({
      "@type": "HowToStep",
      position: step.stepNumber,
      name: step.title,
      text: step.description,
    })),
  };
}

export interface BlogArticleMetadata {
  slug: string;
  title: string;
  summary: string;
  date: string;
}

export function getArticleSchema(article: BlogArticleMetadata) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    url: `${siteConfig.url}/blog#${article.slug}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/blog`,
    },
    datePublished: "2026-10-01T00:00:00Z",
    dateModified: "2026-10-06T00:00:00Z",
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: `${siteConfig.url}/icon.png`,
      },
    },
  };
}
