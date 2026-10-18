import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/layout/Section.tsx";
import { Button } from "@/components/ui.tsx";
import type { BlockOf } from "@/lib/cms-types.ts";
import { isInternalHref } from "@/lib/navigation.ts";

/** Page-opening banner. Renders the page's h1, so a CMS page should hold at most one hero. */
export function HeroBlock({ block }: { block: BlockOf<"hero"> }) {
  const titleId = `${block.id}-title`;
  return (
    <section
      aria-labelledby={titleId}
      className="relative isolate overflow-hidden bg-primary-900 text-white"
    >
      {block.image ? (
        <Image
          src={block.image.src}
          alt=""
          fill
          priority
          quality={60}
          sizes="100vw"
          className="-z-20 object-cover"
        />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-primary-950/90 via-primary-900/75 to-primary-900/30"
      />
      <Container className="py-20 sm:py-28 lg:py-32">
        <h1 id={titleId} className="max-w-3xl text-4xl font-semibold text-balance sm:text-6xl">
          {block.heading}
        </h1>
        {block.subheading ? (
          <p className="mt-5 max-w-2xl text-lg text-white/90 sm:text-xl">{block.subheading}</p>
        ) : null}
        {block.cta ? (
          <Button asChild size="lg" className="mt-8 bg-white text-primary-900 hover:bg-primary-50">
            {isInternalHref(block.cta.href) ? (
              <Link href={block.cta.href}>{block.cta.label}</Link>
            ) : (
              <a href={block.cta.href} rel="noopener noreferrer">
                {block.cta.label}
              </a>
            )}
          </Button>
        ) : null}
      </Container>
    </section>
  );
}
