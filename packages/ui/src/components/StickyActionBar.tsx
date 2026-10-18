import { type ComponentProps } from "react";

import { cn } from "../lib/cn.ts";

export interface StickyActionBarProps extends ComponentProps<"div"> {
  /**
   * Set when a fixed bottom navigation is visible: the bar then sits above it (using the
   * `--sp-bottom-offset` variable the portal shell defines) instead of at the screen edge.
   */
  aboveBottomNav?: boolean;
}

/**
 * Primary actions of a long form (RESPONSIVE standard, "Sticky primary action bars on long
 * mobile forms"): on phones a bar pinned to the bottom of the screen, honouring the home-indicator
 * safe area; from `md` up it is an ordinary right-aligned row at the end of the form. Place it as
 * the last child of the padded page/form container (it bleeds into the container's padding).
 */
export function StickyActionBar({
  aboveBottomNav = false,
  className,
  ...props
}: StickyActionBarProps) {
  return (
    <div
      className={cn(
        "sticky z-20 -mx-4 mt-6 flex flex-col-reverse gap-3 border-t border-border bg-surface/95 px-4 pt-3 backdrop-blur sm:-mx-6 sm:px-6",
        aboveBottomNav
          ? "bottom-(--sp-bottom-offset) pb-3"
          : "bottom-0 pb-[max(0.75rem,var(--sp-safe-bottom))]",
        "md:static md:mx-0 md:flex-row md:justify-end md:border-0 md:bg-transparent md:px-0 md:pt-0 md:pb-0 md:backdrop-blur-none",
        className,
      )}
      {...props}
    />
  );
}
