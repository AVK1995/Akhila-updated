import type { NextConfig } from "next";
import path from "node:path";

/**
 * STATIC_EXPORT mode is enabled only by the GitHub Pages workflow
 * (.github/workflows/deploy-pages.yml). It rebuilds the site as fully static
 * HTML under /Akhila/ for the client-preview deploy.
 *
 * Local dev (`npm run dev`) and Vercel/Netlify production deploys leave
 * STATIC_EXPORT unset, so the conditional below is a no-op and the app runs
 * as a full Next.js SSR/API app with image optimization and security headers
 * active. Nothing about this flag persists into the production build.
 */
const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // ── Static-export-only config (GitHub Pages demo). Dormant otherwise. ──
  ...(isStaticExport && {
    output: "export",
    basePath: "/Akhila",
    assetPrefix: "/Akhila/",
    trailingSlash: true,
  }),

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    // GitHub Pages can't run the Next.js image optimizer; serve raw files.
    // Vercel ignores this flag and keeps optimization on.
    unoptimized: isStaticExport,
  },
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    optimizePackageImports: [
      "motion",
      "clsx",
      "tailwind-merge",
      "zod",
    ],
  },

  // Security headers — only when running on a real server (static export
  // would warn and ignore them, so we just don't emit the config in that mode).
  ...(!isStaticExport && {
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "SAMEORIGIN" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ],
        },
        {
          source: "/api/(.*)",
          headers: [
            { key: "Cache-Control", value: "no-store, max-age=0" },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;
