import type { Metadata } from "next";
import Image from "next/image";

import { PageHeader } from "@/components/layout/PageHeader.tsx";
import { Container } from "@/components/layout/Section.tsx";
import { getGallery, getSite } from "@/lib/cms-client.ts";
import { pageMetadata } from "@/lib/seo.ts";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return pageMetadata({
    site,
    title: "Gallery",
    description: `Photos from life at ${site.name}: classrooms, events, sports and the arts.`,
    path: "/gallery",
  });
}

export default async function GalleryPage() {
  const items = await getGallery();
  return (
    <>
      <PageHeader
        title="Gallery"
        description="Moments from classrooms, events, sports and the arts."
      />
      <Container className="py-12 sm:py-16">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-strong p-10 text-center text-fg-muted">
            Photos will appear here soon.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <li key={item.id}>
                <figure className="overflow-hidden rounded-2xl border border-border bg-surface shadow-1">
                  <div className="relative aspect-[3/2]">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      quality={60}
                      priority={index < 3}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 hover:scale-105 motion-reduce:transform-none"
                    />
                  </div>
                  {item.caption ? (
                    <figcaption className="px-4 py-3 text-sm text-fg-muted">
                      {item.caption}
                    </figcaption>
                  ) : null}
                </figure>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
