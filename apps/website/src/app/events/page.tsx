import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/PageHeader.tsx";
import { Container } from "@/components/layout/Section.tsx";
import { EventsStrip } from "@/components/sections/EventsStrip.tsx";
import { getEvents, getSite } from "@/lib/cms-client.ts";
import { pageMetadata } from "@/lib/seo.ts";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return pageMetadata({
    site,
    title: "Events",
    description: `Upcoming celebrations, competitions and open days at ${site.name}.`,
    path: "/events",
  });
}

export default async function EventsPage() {
  const [site, events] = await Promise.all([getSite(), getEvents()]);
  return (
    <>
      <PageHeader
        title="Events"
        description="Celebrations, competitions and open days. Everyone is welcome."
      />
      {events.length === 0 ? (
        <Container className="py-16">
          <p className="rounded-xl border border-dashed border-border-strong p-10 text-center text-fg-muted">
            No events are scheduled right now. Please check back soon.
          </p>
        </Container>
      ) : (
        <EventsStrip events={events} timeZone={site.timezone} />
      )}
    </>
  );
}
