import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

// Required by `output: "export"` (GitHub Pages demo). No-op for server builds —
// this route is already inherently static (no fetch, no dynamic params).
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const base = publicEnv.siteUrl.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/checkout", "/book-a-call", "/thank-you"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
