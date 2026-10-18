import type { ReactNode } from "react";

import { cn } from "@/lib/cn.ts";

export function Container({
  className,
  children,
}: {
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl ps-[max(1rem,var(--sp-safe-left))] pe-[max(1rem,var(--sp-safe-right))] sm:ps-[max(1.5rem,var(--sp-safe-left))] sm:pe-[max(1.5rem,var(--sp-safe-right))] lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface SectionProps {
  /** Id of the heading that names this section (landmark label). */
  labelledBy?: string;
  id?: string;
  tone?: "default" | "sunken" | "primary";
  className?: string;
  children: ReactNode;
}

const TONES = {
  default: "bg-bg",
  sunken: "bg-surface-sunken",
  primary: "bg-primary-900 text-white",
} as const;

export function Section({ labelledBy, id, tone = "default", className, children }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("py-16 sm:py-20 lg:py-24", TONES[tone], className)}
    >
      <Container>{children}</Container>
    </section>
  );
}

interface SectionHeadingProps {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  /** Link or button rendered on the right on wide screens. */
  action?: ReactNode;
  tone?: "default" | "inverse";
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  action,
  tone = "default",
}: SectionHeadingProps) {
  const inverse = tone === "inverse";
  return (
    <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p
            className={cn(
              "mb-2 text-sm font-semibold tracking-wide uppercase",
              inverse ? "text-primary-200" : "text-primary-subtle-fg",
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2 id={id} className="text-3xl font-semibold sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className={cn("mt-3 text-lg", inverse ? "text-white/80" : "text-fg-muted")}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
