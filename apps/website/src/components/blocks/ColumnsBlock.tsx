import Image from "next/image";

import { Container } from "@/components/layout/Section.tsx";
import { SafeHtml } from "@/components/security/SafeHtml.tsx";
import type { BlockOf } from "@/lib/cms-types.ts";

const GRID: Record<number, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
};

export function ColumnsBlock({ block }: { block: BlockOf<"columns"> }) {
  return (
    <Container className="py-10 sm:py-14">
      <div className={`grid gap-6 ${GRID[block.columns.length] ?? "md:grid-cols-2"}`}>
        {block.columns.map((column, index) => (
          <div
            key={`${block.id}-${index}`}
            className="rounded-2xl border border-border bg-surface p-6 shadow-1"
          >
            {column.image ? (
              <Image
                src={column.image.src}
                alt={column.image.alt}
                width={column.image.width}
                height={column.image.height}
                quality={60}
                sizes="(min-width: 768px) 33vw, 100vw"
                className="mb-4 h-auto w-full rounded-lg"
              />
            ) : null}
            {column.heading ? (
              <h3 className="mb-2 text-xl font-semibold">{column.heading}</h3>
            ) : null}
            <SafeHtml html={column.html} />
          </div>
        ))}
      </div>
    </Container>
  );
}
