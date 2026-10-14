import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 104,
        background: "#2563eb",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        borderRadius: "40px",
        fontWeight: 900,
      }}
    >
      P
    </div>,
    {
      ...size,
    }
  );
}
