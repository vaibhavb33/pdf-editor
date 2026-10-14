import { ImageResponse } from "next/og";
import { siteConfig } from "@/content/site";

export const dynamic = "force-static";
export const alt = "PDFivo - Free, Private Online PDF Tools";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
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
        <div
          style={{
            display: "flex",
            marginLeft: "16px",
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

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: "64px",
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.1,
            letterSpacing: "-1.5px",
            maxWidth: "960px",
          }}
        >
          <span>Free Online PDF Tools.</span>
          <span style={{ color: "#60a5fa" }}>Files never leave your device.</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "24px",
            color: "#a1a1aa",
            maxWidth: "840px",
            lineHeight: 1.4,
          }}
        >
          Merge, split, compress, convert, sign, and edit PDFs directly inside your browser. No
          signups, no limits, zero server uploads.
        </div>
      </div>

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
          <span>• Zero Server Uploads</span>
          <span>• No Registration Required</span>
          <span>• Unlimited Free Usage</span>
        </div>
        <div style={{ display: "flex", color: "#3b82f6", fontWeight: 700 }}>{siteConfig.url}</div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
