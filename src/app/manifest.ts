import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Izanagi AI",
    short_name: "Izanagi AI",
    description:
      "Agent and skill framework for autonomous software engineering: 21 specialized agents, adaptive routing, evaluation, self-healing and persistent memory.",
    start_url: "/en",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "32x32 16x16",
        type: "image/x-icon",
      },
    ],
  };
}
