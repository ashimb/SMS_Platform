import { motion, useReducedMotion } from "motion/react";
import { type ReactNode } from "react";

import { cn } from "../lib/cn.ts";

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  /** Decorative icon (lucide-react element). */
  icon?: ReactNode;
  /** Primary next step, e.g. <Button>Add student</Button>. */
  action?: ReactNode;
  /** "error" uses danger accents; pair with a Retry action. */
  tone?: "neutral" | "error";
  headingLevel?: "h2" | "h3";
  className?: string;
}

/** Explains why a view is empty and what to do next (FRD FR-UX-015). */
export function EmptyState({
  title,
  description,
  icon,
  action,
  tone = "neutral",
  headingLevel: Heading = "h3",
  className,
}: EmptyStateProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className={cn(
            "mb-1 grid size-12 place-items-center rounded-full [&_svg]:size-6",
            tone === "error"
              ? "bg-danger-subtle text-danger-subtle-fg"
              : "bg-primary-subtle text-primary-subtle-fg",
          )}
        >
          {icon}
        </div>
      ) : null}
      <Heading className="text-base font-semibold text-fg">{title}</Heading>
      {description ? <p className="max-w-sm text-sm text-fg-muted">{description}</p> : null}
      {action ? <div className="mt-2 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </motion.section>
  );
}
