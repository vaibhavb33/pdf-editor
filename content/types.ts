export type ToolCategory = "organize" | "convert" | "edit" | "secure";

export interface ToolStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolSeo {
  title: string;
  description: string;
  keywords: string[];
}

export interface ToolBenefit {
  title: string;
  description: string;
}

export interface ToolDefinition {
  id: string;
  slug: string;
  name: string;
  category: ToolCategory;
  badge?: string;
  shortDescription: string;
  tagline: string;
  longDescription: string;
  features: string[];
  benefits: ToolBenefit[];
  steps: ToolStep[];
  faqs: ToolFaq[];
  relatedSlugs: string[];
  seo: ToolSeo;
  acceptedFileTypes: string[];
  maxFiles?: number;
}

export interface SiteConfig {
  name: string;
  domain: string;
  url: string;
  tagline: string;
  description: string;
  privacyPledge: string;
  navLinks: { label: string; href: string }[];
  footerCategories: {
    category: ToolCategory;
    title: string;
    tools: { name: string; slug: string }[];
  }[];
}
