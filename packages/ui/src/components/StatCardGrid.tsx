import { type ComponentProps } from "react";

import { cn } from "../lib/cn.ts";

/**
 * Grid of StatCards that reflows 1 -> 2 -> 4 columns (RESPONSIVE standard). It follows the width
 * of its own container, not the viewport (container queries), so it behaves the same in a narrow
 * dashboard column next to a sidebar as in a full-width page.
 */
export function StatCardGrid({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className="@container">
      <div
        className={cn(
          "grid grid-cols-1 gap-3 sm:gap-4 @md:grid-cols-2 @3xl:grid-cols-4",
          className,
        )}
        {...props}
      />
    </div>
  );
}
