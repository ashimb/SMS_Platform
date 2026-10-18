import { Container } from "@/components/layout/Section.tsx";
import { AnimatedNumber } from "@/components/sections/AnimatedNumber.tsx";
import type { Stat } from "@/lib/cms-types.ts";

/** Key figures band, overlapping the hero's bottom edge. */
export function Stats({ stats }: { stats: readonly Stat[] }) {
  return (
    <section aria-label="Green Valley at a glance" className="relative z-10 -mt-12 sm:-mt-16">
      <Container>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 bg-surface px-6 py-7 text-center">
              <dd className="order-1 font-display text-4xl font-semibold text-primary-subtle-fg sm:text-5xl">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </dd>
              <dt className="order-2 text-sm font-medium text-fg-muted">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
