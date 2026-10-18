import Image from "next/image";

import { Container } from "@/components/layout/Section.tsx";
import type { BlockOf } from "@/lib/cms-types.ts";

export function GalleryBlock({ block }: { block: BlockOf<"gallery"> }) {
  const titleId = `${block.id}-title`;
  return (
    <Container className="py-10 sm:py-14">
      <section aria-labelledby={block.heading ? titleId : undefined}>
        {block.heading ? (
          <h2 id={titleId} className="mb-6 text-2xl font-semibold sm:text-3xl">
            {block.heading}
          </h2>
        ) : null}
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {block.images.map((image) => (
            <li key={image.src} className="relative aspect-[3/2] overflow-hidden rounded-xl">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                quality={60}
                sizes="(min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 hover:scale-105 motion-reduce:transform-none"
              />
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
