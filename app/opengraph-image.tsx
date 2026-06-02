import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo";

export const alt = `${siteConfig.name} — Rekapitulasi Keuangan`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            RU
          </div>
          <span style={{ fontSize: 48, fontWeight: 700 }}>{siteConfig.name}</span>
        </div>
        <p style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.3, maxWidth: 900 }}>
          {siteConfig.tagline}
        </p>
        <p
          style={{
            fontSize: 22,
            marginTop: 24,
            opacity: 0.9,
            maxWidth: 820,
            lineHeight: 1.5,
          }}
        >
          {siteConfig.description}
        </p>
      </div>
    ),
    { ...size }
  );
}
