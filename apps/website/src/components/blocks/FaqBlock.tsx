import { ChevronDown } from "lucide-react";

import { Container } from "@/components/layout/Section.tsx";
import { SafeHtml } from "@/components/security/SafeHtml.tsx";
import type { BlockOf } from "@/lib/cms-types.ts";

/** Native <details> accordion: keyboard and screen-reader accessible without any JavaScript. */
export function FaqBlock({ block }: { block: BlockOf<"faq"> }) {
  const titleId = `${block.id}-title`;
  return (
    <Container className="py-10 sm:py-14">
      <section aria-labelledby={block.heading ? titleId : undefined} className="mx-auto max-w-3xl">
        {block.heading ? (
          <h2 id={titleId} className="mb-6 text-2xl font-semibold sm:text-3xl">
            {block.heading}
          </h2>
        ) : null}
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {block.items.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-medium hover:bg-surface-hover focus-visible:bg-surface-hover [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown
                  aria-hidden="true"
                  className="size-5 shrink-0 text-fg-subtle transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <div className="px-5 pb-5">
                <SafeHtml html={item.answerHtml} />
              </div>
            </details>
          ))}
        </div>
      </section>
    </Container>
  );
}
