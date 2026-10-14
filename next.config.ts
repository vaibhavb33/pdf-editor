import type { NextConfig } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://pdfivo.co").replace(/\/+$/, "");
let siteHost = "pdfivo.co";
try {
  siteHost = new URL(siteUrl).hostname;
} catch {}

const nextConfig: NextConfig = {
  trailingSlash: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Ensure pdfjs-dist and related node modules do not cause SSG bundling issues
  serverExternalPackages: ["pdfjs-dist"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: `www.${siteHost}`,
          },
        ],
        destination: `${siteUrl}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
