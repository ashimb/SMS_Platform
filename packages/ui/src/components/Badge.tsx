import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps } from "react";

import { cn } from "../lib/cn.ts";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ring-1 ring-inset",
  {
    variants: {
      tone: {
        neutral: "bg-surface-sunken text-fg-muted ring-border",
        primary: "bg-primary-subtle text-primary-subtle-fg ring-primary-200 dark:ring-primary-800",
        success: "bg-success-subtle text-success-subtle-fg ring-success-200 dark:ring-success-800",
        warning: "bg-warning-subtle text-warning-subtle-fg ring-warning-200 dark:ring-warning-800",
        danger: "bg-danger-subtle text-danger-subtle-fg ring-danger-200 dark:ring-danger-800",
        info: "bg-info-subtle text-info-subtle-fg ring-info-200 dark:ring-info-800",
      },
      size: { sm: "h-5 px-2 text-xs", md: "h-6 px-2.5 text-xs" },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export interface BadgeProps extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  /** Leading status dot. Colour is never the only signal: keep a text label. */
  dot?: boolean;
}

export function Badge({ className, tone, size, dot = false, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {dot ? <span aria-hidden="true" className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
