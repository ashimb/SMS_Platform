import type { Metadata } from "next";

import { AdmissionsCTA } from "@/components/sections/AdmissionsCTA.tsx";
import { EventsStrip } from "@/components/sections/EventsStrip.tsx";
import { GalleryPreview } from "@/components/sections/GalleryPreview.tsx";
import { Hero } from "@/components/sections/Hero.tsx";
import { NoticeBoard } from "@/components/sections/NoticeBoard.tsx";
import { Stats } from "@/components/sections/Stats.tsx";
import { Testimonials } from "@/components/sections/Testimonials.tsx";
import {
  getEvents,
  getGallery,
  getHome,
  getNotices,
  getSite,
  upcomingEvents,
} from "@/lib/cms-client.ts";
import { pageMetadata } from "@/lib/seo.ts";

/** ISR: regenerated at most every 5 minutes, or immediately via the signed revalidation webhook. */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    ...pageMetadata({ site, title: site.name, description: site.description, path: "/" }),
    title: { absolute: `${site.name} | ${site.tagline}` },
  };
}

export default async function HomePage() {
  const [site, home, notices, events, gallery] = await Promise.all([
    getSite(),
    getHome(),
    getNotices(),
    getEvents(),
    getGallery(),
  ]);
  const upcoming = upcomingEvents(events, new Date(), 4);
  // Never show an empty strip: fall back to the most recent events when none are upcoming.
  const strip = upcoming.length > 0 ? upcoming : events.slice(-4);

  return (
    <>
      <Hero hero={home.hero} site={site} />
      <Stats stats={home.stats} />
      <NoticeBoard notices={notices} timeZone={site.timezone} />
      <EventsStrip events={strip} timeZone={site.timezone} />
      <Testimonials testimonials={home.testimonials} />
      <GalleryPreview items={gallery} />
      <AdmissionsCTA site={site} />
    </>
  );
}
