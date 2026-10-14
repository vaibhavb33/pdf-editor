import { Metadata } from "next";
import { siteConfig } from "@/content/site";

interface MetadataOptions {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  image?: string;
}

export function constructMetadata({
  title,
  description,
  path = "",
  keywords = [],
  image,
}: MetadataOptions = {}): Metadata {
  let metaTitle = `${siteConfig.name} - ${siteConfig.tagline}`;
  if (title) {
    if (title.includes(siteConfig.name)) {
      metaTitle = title;
    } else {
      metaTitle = `${title} - ${siteConfig.name}`;
    }
  }

  // Ensure title never exceeds 60 characters
  if (metaTitle.length > 60) {
    metaTitle = metaTitle.slice(0, 57) + "...";
  }

  const metaDescription = description || siteConfig.description;

  // Format clean canonical URL without trailing slash
  const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`).replace(/\/+$/, "") : "";
  const canonicalUrl = `${siteConfig.url}${cleanPath}`;

  const defaultKeywords = [
    "free pdf tools",
    "pdf editor online",
    "client-side pdf",
    "private pdf editor",
    "no upload pdf tools",
    "pdf tools without signup",
    "browser web worker pdf",
    "merge pdf",
    "split pdf",
    "compress pdf",
  ];

  const ogImageUrl = image || `${siteConfig.url}/opengraph-image`;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: [...new Set([...keywords, ...defaultKeywords])],
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonicalUrl,
      title: metaTitle,
      description: metaDescription,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      creator: "@pdfivo",
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}
