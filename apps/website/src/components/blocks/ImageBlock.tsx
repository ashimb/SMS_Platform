import Image from "next/image";

import { Container } from "@/components/layout/Section.tsx";
import type { BlockOf } from "@/lib/cms-types.ts";

export function ImageBlock({ block }: { block: BlockOf<"image"> }) {
  const { image, caption } = block;
  return (
    <Container className="py-10 sm:py-14">
      <figure className="mx-auto max-w-4xl">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          quality={75}
          sizes="(min-width: 1024px) 896px, 100vw"
          className="h-auto w-full rounded-2xl shadow-2"
        />
        {caption ? (
          <figcaption className="mt-3 text-center text-sm text-fg-muted">{caption}</figcaption>
        ) : null}
      </figure>
    </Container>
  );
}
