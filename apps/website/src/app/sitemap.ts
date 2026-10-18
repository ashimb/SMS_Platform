import type { MetadataRoute } from "next";

import { getEvents, getNotices, getPageSlugs, RESERVED_SLUGS } from "@/lib/cms-client.ts";
import { siteOrigin } from "@/lib/env.ts";

export const revalidate = 3600;

const STATIC_PATHS = ["/", "/about", "/admissions", "/notices", "/events", "/gallery", "/contact"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${origin}${path === "/" ? "" : path}`,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  // If the CMS is unreachable the static routes are still listed; dynamic ones return next cycle.
  try {
    const [notices, events, slugs] = await Promise.all([getNotices(), getEvents(), getPageSlugs()]);
    for (const notice of notices) {
      entries.push({
        url: `${origin}/notices/${notice.slug}`,
        lastModified: notice.publishedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
    for (const event of events) {
      entries.push({
        url: `${origin}/events/${event.slug}`,
        lastModified: event.startsAt,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
    for (const slug of slugs.filter((s) => !RESERVED_SLUGS.includes(s))) {
      entries.push({ url: `${origin}/${slug}`, changeFrequency: "monthly", priority: 0.5 });
    }
  } catch {
    // keep the static entries
  }
  return entries;
}
