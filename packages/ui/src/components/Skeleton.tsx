import { type ComponentProps } from "react";

import { cn } from "../lib/cn.ts";

/**
 * Placeholder shaped like the content that is loading (prevents layout shift). Hidden from
 * assistive tech: the surrounding region should carry aria-busy="true".
 */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-surface-hover motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
