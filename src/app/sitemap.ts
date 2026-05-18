import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

// Required by `output: "export"` (GitHub Pages demo). No-op for server builds —
// this route is already inherently static (no fetch, no dynamic params).
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicEnv.siteUrl.replace(/\/$/, "");
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/refund`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
