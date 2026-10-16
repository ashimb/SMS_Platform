import type { Meta, StoryObj } from "@storybook/react-vite";

import { SCALE_STEPS } from "./color.ts";
import { validateBrandColor } from "./contrast.ts";

function Swatches({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold capitalize">{name}</p>
      <div className="grid grid-cols-11 overflow-hidden rounded-lg border border-border">
        {SCALE_STEPS.map((step) => (
          <div
            key={step}
            className="flex h-16 flex-col justify-end p-1.5 text-[0.625rem] font-medium"
            style={{
              background: `var(--sp-${name}-${String(step)})`,
              color: step >= 500 ? "#fff" : "#111827",
            }}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function Overview() {
  const yellow = validateBrandColor("#ffe600", "auto-correct");
  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Colour</h2>
        <Swatches name="primary" />
        <Swatches name="success" />
        <Swatches name="warning" />
        <Swatches name="danger" />
        <Swatches name="info" />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Type scale</h2>
        {(["5xl", "4xl", "3xl", "2xl", "xl", "lg", "base", "sm", "xs"] as const).map((size) => (
          <p
            key={size}
            style={{ fontSize: `var(--sp-text-${size})`, lineHeight: `var(--sp-leading-${size})` }}
          >
            {size} · Green Valley Public School
          </p>
        ))}
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Elevation and radius</h2>
        <div className="flex flex-wrap gap-6">
          {(["1", "2", "3", "4"] as const).map((level) => (
            <div
              key={level}
              className="grid size-24 place-items-center rounded-xl bg-surface text-sm"
              style={{ boxShadow: `var(--sp-shadow-${level})` }}
            >
              shadow-{level}
            </div>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Brand contrast validation</h2>
        <p className="text-sm text-fg-muted">
          Input #ffe600 fails white-text contrast; auto-correct produces {yellow.color} (
          {yellow.checks.map((check) => `${check.id} ${String(check.ratio)}:1`).join(", ")}).
        </p>
      </section>
    </div>
  );
}

const meta = { title: "Foundations/Design tokens", component: Overview } satisfies Meta<
  typeof Overview
>;
export default meta;
export const Tokens: StoryObj<typeof meta> = {};
