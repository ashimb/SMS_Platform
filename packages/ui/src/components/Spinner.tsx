import { type ComponentProps } from "react";

import { cn } from "../lib/cn.ts";

export interface SpinnerProps extends Omit<ComponentProps<"span">, "children"> {
  size?: "sm" | "md" | "lg";
  /** Accessible label announced to screen readers. */
  label?: string;
  /** Hide from assistive tech when a parent already announces the busy state. */
  decorative?: boolean;
}

const sizes = { sm: "size-4", md: "size-5", lg: "size-8" } as const;

/** Loading indicator. Rotation pauses for users who prefer reduced motion. */
export function Spinner({
  size = "md",
  label = "Loading",
  decorative = false,
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      role={decorative ? undefined : "status"}
      aria-hidden={decorative || undefined}
      className={cn("inline-flex shrink-0 text-current", className)}
      {...props}
    >
      <svg
        className={cn(sizes[size], "animate-spin motion-reduce:animate-none")}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {decorative ? null : <span className="sr-only">{label}</span>}
    </span>
  );
}
