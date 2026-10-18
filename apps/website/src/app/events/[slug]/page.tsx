import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Event as EventLd, WithContext } from "schema-dts";

import { PageHeader } from "@/components/layout/PageHeader.tsx";
import { Container } from "@/components/layout/Section.tsx";
import { JsonLd } from "@/components/security/JsonLd.tsx";
import { SafeHtml } from "@/components/security/SafeHtml.tsx";
import { getEvent, getEvents, getSite } from "@/lib/cms-client.ts";
import { formatDate, formatTime } from "@/lib/format.ts";
import { pageMetadata } from "@/lib/seo.ts";

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  try {
    return (await getEvents()).map((event) => ({ slug: event.slug }));
  } catch {
    return []; // CMS unreachable at build time: pages render on first request (ISR)
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const [site, event] = await Promise.all([getSite(), getEvent(slug)]);
  if (!event) return {};
  return pageMetadata({
    site,
    title: event.title,
    description: event.summary,
    path: `/events/${event.slug}`,
  });
}

export default async function EventPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [site, event] = await Promise.all([getSite(), getEvent(slug)]);
  if (!event) notFound();

  const tz = site.timezone;
  const jsonLd: WithContext<EventLd> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary,
    startDate: event.startsAt,
    ...(event.endsAt ? { endDate: event.endsAt } : {}),
    location: { "@type": "Place", name: event.location },
    organizer: { "@type": "EducationalOrganization", name: site.name },
  };

  return (
    <>
      <PageHeader
        title={event.title}
        description={event.summary}
        trail={[{ label: "Events", href: "/events" }]}
      />
      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_20rem]">
        <article>
          {event.image ? (
            <Image
              src={event.image.src}
              alt={event.image.alt}
              width={event.image.width}
              height={event.image.height}
              quality={75}
              sizes="(min-width: 1024px) 720px, 100vw"
              className="mb-8 h-auto w-full rounded-2xl shadow-2"
            />
          ) : null}
          <SafeHtml html={event.bodyHtml} />
          <Link
            href="/events"
            className="mt-12 inline-flex min-h-11 items-center gap-2 font-medium text-primary-subtle-fg underline-offset-4 hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> All events
          </Link>
        </article>
        <aside
          aria-label="Event details"
          className="h-fit rounded-2xl border border-border bg-surface-sunken p-6"
        >
          <dl className="space-y-5">
            <div className="flex gap-3">
              <CalendarDays aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <dt className="text-sm font-semibold">Date</dt>
                <dd className="text-fg-muted">{formatDate(event.startsAt, tz)}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <dt className="text-sm font-semibold">Time</dt>
                <dd className="text-fg-muted">
                  {formatTime(event.startsAt, tz)}
                  {event.endsAt ? ` – ${formatTime(event.endsAt, tz)}` : ""}
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <dt className="text-sm font-semibold">Location</dt>
                <dd className="text-fg-muted">{event.location}</dd>
              </div>
            </div>
          </dl>
        </aside>
      </Container>
      <JsonLd data={jsonLd} />
    </>
  );
}
