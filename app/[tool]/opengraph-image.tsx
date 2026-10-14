import { ImageResponse } from "next/og";
import { getAllTools, getToolBySlug } from "@/content";
import { siteConfig } from "@/content/site";

export const dynamic = "force-static";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
export const dynamicParams = false;

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((t) => ({ tool: t.slug }));
}

export default async function Image({ params }: { params: Promise<{ tool: string }> }) {
  const { tool: slug } = await params;
  const tool = getToolBySlug(slug);

  const title = tool?.name || "PDF Tool";
  const tagline = tool?.tagline || "Free, private, client-side PDF utility.";
  const category = (tool?.category || "Organize").toUpperCase();

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "space-between",
        backgroundColor: "#09090b",
        padding: "60px 80px",
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              backgroundColor: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "30px",
              fontWeight: 800,
            }}
          >
            P
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "32px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.5px",
            }}
          >
            <span>pdfivo</span>
            <span style={{ color: "#3b82f6" }}>.co</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              padding: "6px 16px",
              borderRadius: "999px",
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              color: "#a1a1aa",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "1px",
            }}
          >
            {category}
          </div>
          <div
            style={{
              display: "flex",
              padding: "6px 16px",
              borderRadius: "999px",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#34d399",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            100% Client-Side
          </div>
        </div>
      </div>

      {/* Center Tool Info */}
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div
          style={{
            display: "flex",
            fontSize: "68px",
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.05,
            letterSpacing: "-1.5px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "26px",
            color: "#93c5fd",
            maxWidth: "920px",
            lineHeight: 1.35,
            fontWeight: 500,
          }}
        >
          {tagline}
        </div>
      </div>

      {/* Footer Guarantees */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          borderTop: "1px solid #27272a",
          paddingTop: "24px",
          color: "#71717a",
          fontSize: "16px",
          fontWeight: 500,
        }}
      >
        <div style={{ display: "flex", gap: "32px" }}>
          <span>• Files never leave your device</span>
          <span>• In-browser Web Workers</span>
          <span>• No signup or paywall</span>
        </div>
        <div style={{ display: "flex", color: "#3b82f6", fontWeight: 700 }}>
          {siteConfig.url}/{slug}
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
