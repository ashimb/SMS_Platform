import Link from "next/link";

import { Container } from "@/components/layout/Section.tsx";
import { Button } from "@/components/ui.tsx";
import type { BlockOf } from "@/lib/cms-types.ts";
import { isInternalHref } from "@/lib/navigation.ts";

export function CtaBlock({ block }: { block: BlockOf<"cta"> }) {
  const titleId = `${block.id}-title`;
  const { button } = block;
  return (
    <section aria-labelledby={titleId} className="py-10 sm:py-14">
      <Container>
        <div className="rounded-3xl bg-primary-800 px-6 py-12 text-center text-white shadow-3 sm:px-12 sm:py-16">
          <h2 id={titleId} className="mx-auto max-w-2xl text-3xl font-semibold sm:text-4xl">
            {block.heading}
          </h2>
          {block.body ? (
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">{block.body}</p>
          ) : null}
          <Button asChild size="lg" className="mt-8 bg-white text-primary-900 hover:bg-primary-50">
            {isInternalHref(button.href) ? (
              <Link href={button.href}>{button.label}</Link>
            ) : (
              <a href={button.href} rel="noopener noreferrer">
                {button.label}
              </a>
            )}
          </Button>
        </div>
      </Container>
    </section>
  );
}
