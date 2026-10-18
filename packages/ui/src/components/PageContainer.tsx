import { type ComponentProps, type ElementType } from "react";

import { cn } from "../lib/cn.ts";

const SIZES = {
  narrow: "max-w-3xl",
  default: "max-w-7xl",
  wide: "max-w-screen-2xl",
  full: "max-w-none",
} as const;

export interface PageContainerProps extends ComponentProps<"div"> {
  size?: keyof typeof SIZES;
  as?: ElementType;
}

/**
 * Page content wrapper with the same side padding everywhere (16px on phones, 24px from `sm`,
 * 32px from `lg`) and a readable maximum width. Side padding also respects landscape safe areas
 * (notch on the side).
 */
export function PageContainer({
  size = "default",
  as: Tag = "div",
  className,
  ...props
}: PageContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-4 pl-[max(1rem,var(--sp-safe-left))] sm:px-6 sm:pl-[max(1.5rem,var(--sp-safe-left))] lg:px-8 lg:pl-[max(2rem,var(--sp-safe-left))]",
        "pr-[max(1rem,var(--sp-safe-right))] sm:pr-[max(1.5rem,var(--sp-safe-right))] lg:pr-[max(2rem,var(--sp-safe-right))]",
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
