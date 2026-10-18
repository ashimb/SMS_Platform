import type { MetadataRoute } from "next";

import { siteOrigin } from "@/lib/env.ts";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
