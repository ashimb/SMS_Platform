// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseMediaHosts, securityHeaders } from "./config/security-headers.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(here, "../..");
const isDev = process.env["NODE_ENV"] !== "production";
const mediaHosts = parseMediaHosts(process.env["WEBSITE_MEDIA_HOSTS"]);

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Self-contained server for the runtime image (infra/docker/website.Dockerfile).
  output: "standalone",
  // Standalone output mirrors the monorepo layout, so trace from the repository root.
  outputFileTracingRoot: repoRoot,
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,

  // The UI kit ships TypeScript source under the "source" export condition; compile it here.
  transpilePackages: ["@school-platform/ui"],
  // jsdom (used by isomorphic-dompurify on the server) must stay a runtime require.
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  turbopack: {
    root: repoRoot,
    resolveAlias: {
      "@school-platform/ui": "../../packages/ui/src/index.ts",
      "@school-platform/ui/theme": "../../packages/ui/src/theme/index.ts",
      "@school-platform/ui/dev": "../../packages/ui/src/dev/overflow.ts",
    },
  },

  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75],
    // Only local files under /images and explicitly listed HTTPS media hosts are optimised.
    localPatterns: [{ pathname: "/images/**" }],
    remotePatterns: mediaHosts.map((hostname) => ({ protocol: "https", hostname })),
    dangerouslyAllowSVG: false,
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders({ isDev, mediaHosts }) },
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
