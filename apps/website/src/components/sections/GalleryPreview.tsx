import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Section, SectionHeading } from "@/components/layout/Section.tsx";
import { Button } from "@/components/ui.tsx";
import type { GalleryItem } from "@/lib/cms-types.ts";

/** Bento-style preview of up to six photos; the first is featured. */
export function GalleryPreview({ items }: { items: readonly GalleryItem[] }) {
  const shown = items.slice(0, 6);
  if (shown.length === 0) return null;
  return (
    <Section labelledBy="gallery-title" id="gallery" tone="sunken">
      <SectionHeading
        id="gallery-title"
        eyebrow="Life at school"
        title="A look around campus"
        action={
          <Button asChild variant="secondary">
            <Link href="/gallery">
              Full gallery <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      <ul className="grid auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] sm:gap-4 lg:grid-cols-4">
        {shown.map((item, index) => (
          <li
            key={item.id}
            className={
              index === 0
                ? "relative col-span-2 row-span-2 overflow-hidden rounded-2xl"
                : "relative overflow-hidden rounded-2xl"
            }
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              quality={60}
              sizes={
                index === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"
              }
              className="object-cover transition-transform duration-500 hover:scale-105 motion-reduce:transform-none"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
