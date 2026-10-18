import { Container } from "@/components/layout/Section.tsx";
import { SafeHtml } from "@/components/security/SafeHtml.tsx";
import type { BlockOf } from "@/lib/cms-types.ts";

export function RichTextBlock({ block }: { block: BlockOf<"rich-text"> }) {
  return (
    <Container className="py-10 sm:py-14">
      <SafeHtml html={block.html} className="mx-auto max-w-3xl" />
    </Container>
  );
}
