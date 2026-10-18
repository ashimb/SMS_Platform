import { ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Section, SectionHeading } from "@/components/layout/Section.tsx";
import { Button } from "@/components/ui.tsx";
import type { CmsEvent } from "@/lib/cms-types.ts";
import { dateTile, formatDateRange } from "@/lib/format.ts";

interface EventsStripProps {
  events: readonly CmsEvent[];
  timeZone: string;
}

/** Up to four events as cards: stacked on phones, a four-column strip on large screens. */
export function EventsStrip({ events, timeZone }: EventsStripProps) {
  if (events.length === 0) return null;
  return (
    <Section labelledBy="events-title" id="events" tone="sunken">
      <SectionHeading
        id="events-title"
        eyebrow="Calendar"
        title="Upcoming events"
        description="Celebrations, competitions and open days. Everyone is welcome."
        action={
          <Button asChild variant="secondary">
            <Link href="/events">
              All events <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      {/* Swipeable snap carousel on phones; a grid from sm. */}
      <ul
        aria-label="Upcoming events"
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-3 focus-visible:outline-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4"
      >
        {events.map((event) => {
          const tile = dateTile(event.startsAt, timeZone);
          return (
            <li key={event.slug} className="w-[80%] shrink-0 snap-start sm:w-auto">
              <Link
                href={`/events/${event.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-1 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-3 motion-reduce:hover:translate-y-0"
              >
                <div className="relative aspect-[16/10] bg-primary-100">
                  {event.image ? (
                    <Image
                      src={event.image.src}
                      alt=""
                      fill
                      quality={60}
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-br from-primary-200 to-primary-400"
                    />
                  )}
                  <div className="absolute top-3 left-3 flex w-14 flex-col items-center rounded-lg bg-surface py-1.5 text-center shadow-2">
                    <span className="text-xs font-semibold tracking-wide text-primary-subtle-fg uppercase">
                      {tile.month}
                    </span>
                    <span className="font-display text-xl leading-6 font-semibold">{tile.day}</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h3 className="text-lg font-semibold group-hover:text-primary-subtle-fg">
                    {event.title}
                  </h3>
                  <p className="text-sm text-fg-muted">
                    {formatDateRange(event.startsAt, event.endsAt, timeZone)}
                  </p>
                  <p className="mt-auto flex items-center gap-1.5 pt-2 text-sm text-fg-muted">
                    <MapPin aria-hidden="true" className="size-4 shrink-0" />
                    {event.location}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
