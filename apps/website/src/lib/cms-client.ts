/**
 * Reads public content for the website.
 *
 * WEBSITE_DATA_SOURCE=api  GET {API_INTERNAL_URL}/api/public/v1/... (the API's cms module),
 *                          cached by the Next.js data cache and revalidated by tag.
 * WEBSITE_DATA_SOURCE=mock typed fixtures (default until the API module is implemented).
 *
 * Both paths return the same validated types. An API response that fails validation throws: a
 * broken payload must never be rendered. A 404 returns null so pages can call notFound().
 */
import { cache } from "react";
import type { z } from "zod";

import {
  eventFixtures,
  galleryFixtures,
  homeFixture,
  noticeFixtures,
  pageFixtures,
  siteFixture,
} from "@/lib/cms-fixtures.ts";
import {
  type CmsEvent,
  type CmsPage,
  eventListSchema,
  eventSchema,
  type GalleryItem,
  galleryListSchema,
  type HomeContent,
  homeSchema,
  type Notice,
  noticeListSchema,
  noticeSchema,
  pageSchema,
  pageSlugListSchema,
  type SiteProfile,
  siteSchema,
} from "@/lib/cms-types.ts";
import { getEnv } from "@/lib/env.ts";

/** Seconds before a cached API response is considered stale (ISR background refresh). */
export const REVALIDATE_SECONDS = 300;
const REQUEST_TIMEOUT_MS = 5000;

/** Slugs owned by dedicated routes; CMS pages with these slugs render at their own path. */
export const RESERVED_SLUGS: readonly string[] = [
  "about",
  "admissions",
  "notices",
  "events",
  "gallery",
  "contact",
  "api",
];

export const cmsTags = {
  all: "cms",
  site: "cms:site",
  home: "cms:home",
  notices: "cms:notices",
  notice: (slug: string) => `cms:notice:${slug}`,
  events: "cms:events",
  event: (slug: string) => `cms:event:${slug}`,
  gallery: "cms:gallery",
  pages: "cms:pages",
  page: (slug: string) => `cms:page:${slug}`,
} as const;

export class CmsError extends Error {
  override name = "CmsError";
}

async function fetchApi<S extends z.ZodType>(
  path: string,
  schema: S,
  tags: string[],
): Promise<z.output<S> | null> {
  const env = getEnv();
  const url = new URL(path, env.API_INTERNAL_URL);
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      // Lets the API resolve the tenant by host once multi-tenant resolution is enabled.
      "X-Forwarded-Host": new URL(env.SITE_URL).host,
    },
    next: { revalidate: REVALIDATE_SECONDS, tags: [cmsTags.all, ...tags] },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new CmsError(`CMS request failed (${response.status}): ${url.pathname}`);
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw new CmsError(`CMS response failed validation: ${url.pathname}`);
  return parsed.data;
}

const useApi = (): boolean => getEnv().WEBSITE_DATA_SOURCE === "api";
const API = "/api/public/v1";

async function required<T>(value: Promise<T | null>, what: string): Promise<T> {
  const result = await value;
  if (result === null) throw new CmsError(`CMS has no ${what}`);
  return result;
}

export const getSite = cache(async (): Promise<SiteProfile> => {
  if (!useApi()) return siteFixture;
  return required(fetchApi(`${API}/site`, siteSchema, [cmsTags.site]), "site profile");
});

export const getHome = cache(async (): Promise<HomeContent> => {
  if (!useApi()) return homeFixture;
  return required(fetchApi(`${API}/home`, homeSchema, [cmsTags.home]), "home content");
});

const byPublishedDesc = (a: Notice, b: Notice) => b.publishedAt.localeCompare(a.publishedAt);
const byStartAsc = (a: CmsEvent, b: CmsEvent) => a.startsAt.localeCompare(b.startsAt);

export const getNotices = cache(async (): Promise<Notice[]> => {
  const list = useApi()
    ? ((await fetchApi(`${API}/notices`, noticeListSchema, [cmsTags.notices])) ?? [])
    : noticeFixtures;
  return [...list].sort(byPublishedDesc);
});

export const getNotice = cache(async (slug: string): Promise<Notice | null> => {
  if (!useApi()) return noticeFixtures.find((n) => n.slug === slug) ?? null;
  return fetchApi(`${API}/notices/${encodeURIComponent(slug)}`, noticeSchema, [
    cmsTags.notices,
    cmsTags.notice(slug),
  ]);
});

export const getEvents = cache(async (): Promise<CmsEvent[]> => {
  const list = useApi()
    ? ((await fetchApi(`${API}/events`, eventListSchema, [cmsTags.events])) ?? [])
    : eventFixtures;
  return [...list].sort(byStartAsc);
});

export const getEvent = cache(async (slug: string): Promise<CmsEvent | null> => {
  if (!useApi()) return eventFixtures.find((e) => e.slug === slug) ?? null;
  return fetchApi(`${API}/events/${encodeURIComponent(slug)}`, eventSchema, [
    cmsTags.events,
    cmsTags.event(slug),
  ]);
});

export const getGallery = cache(async (): Promise<GalleryItem[]> => {
  if (!useApi()) return galleryFixtures;
  return (await fetchApi(`${API}/gallery`, galleryListSchema, [cmsTags.gallery])) ?? [];
});

export const getPage = cache(async (slug: string): Promise<CmsPage | null> => {
  if (!useApi()) return pageFixtures.find((p) => p.slug === slug) ?? null;
  return fetchApi(`${API}/pages/${encodeURIComponent(slug)}`, pageSchema, [
    cmsTags.pages,
    cmsTags.page(slug),
  ]);
});

export const getPageSlugs = cache(async (): Promise<string[]> => {
  if (!useApi()) return pageFixtures.map((p) => p.slug);
  return (await fetchApi(`${API}/pages`, pageSlugListSchema, [cmsTags.pages])) ?? [];
});

/** Upcoming first, then the most recent past events; used by the home strip. */
export function upcomingEvents(events: readonly CmsEvent[], now: Date, limit: number): CmsEvent[] {
  const future = events.filter((e) => new Date(e.endsAt ?? e.startsAt) >= now);
  return future.slice(0, limit);
}
