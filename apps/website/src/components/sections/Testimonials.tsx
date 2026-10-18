import { Quote } from "lucide-react";

import { Section, SectionHeading } from "@/components/layout/Section.tsx";
import type { Testimonial } from "@/lib/cms-types.ts";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function Testimonials({ testimonials }: { testimonials: readonly Testimonial[] }) {
  if (testimonials.length === 0) return null;
  return (
    <Section labelledBy="testimonials-title" id="testimonials">
      <SectionHeading
        id="testimonials-title"
        eyebrow="Voices"
        title="Loved by families"
        description="What parents and alumni say about life at school."
      />
      {/* Swipeable snap carousel on phones; a three-column grid from md. The list holds no focusable
          child, so it is focusable itself to keep the scroll region keyboard-operable (axe: scrollable-region-focusable). */}
      <ul
        // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex
        tabIndex={0}
        aria-label="Testimonials"
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-3 focus-visible:outline-2 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0"
      >
        {testimonials.map((item) => (
          <li key={item.id} className="w-[85%] shrink-0 snap-start sm:w-[60%] md:w-auto">
            <figure className="flex h-full flex-col rounded-2xl border border-border bg-surface p-7 shadow-1">
              <Quote aria-hidden="true" className="size-8 text-primary-300" />
              <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-fg">
                <p>{item.quote}</p>
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-11 place-items-center rounded-full bg-primary-subtle font-semibold text-primary-subtle-fg ring-1 ring-primary-200"
                >
                  {initials(item.author)}
                </span>
                <span>
                  <span className="block font-semibold">{item.author}</span>
                  <span className="block text-sm text-fg-muted">{item.role}</span>
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
