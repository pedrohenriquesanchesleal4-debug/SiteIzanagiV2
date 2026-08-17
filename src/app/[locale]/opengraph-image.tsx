import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import agentsData from "@/content/agents.generated.json";
import skillsData from "@/content/skills.generated.json";

export const alt = "Izanagi AI — The runtime that orchestrates engineering agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(circle at 82% 18%, rgba(217,138,43,0.18), transparent 45%)",
          color: "#e4e4e7",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              backgroundColor: "#d98a2b",
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 2 }}>
            IZANAGI AI
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 980 }}>
          <div style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.12 }}>
            {t("title").split("—")[0].trim()}
          </div>
          <div style={{ fontSize: 28, color: "#a1a1aa", lineHeight: 1.4 }}>
            {t("description")}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#71717a",
            letterSpacing: 1,
          }}
        >
          {agentsData.length} agents · {skillsData.length} skills · self-healing runtime · izanagi-ai
        </div>
      </div>
    ),
    { ...size },
  );
}
