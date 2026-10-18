import * as TabsPrimitive from "@radix-ui/react-tabs";
import { type ComponentProps } from "react";

import { useScrollAffordance } from "../hooks/useScrollAffordance.ts";
import { cn } from "../lib/cn.ts";
import { focusRing } from "../lib/styles.ts";

/** Tabs (Radix): arrow keys move between tabs, Home/End jump, automatic activation. */
export const Tabs = TabsPrimitive.Root;

const edgeFade =
  "pointer-events-none absolute inset-y-0 w-8 from-surface-sunken to-transparent transition-opacity duration-(--sp-duration-fast)";

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  const { ref, canScrollStart, canScrollEnd } = useScrollAffordance<HTMLDivElement>();
  return (
    <div className="relative w-fit max-w-full">
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          "flex h-13 snap-x snap-mandatory scrollbar-none items-center gap-1 overflow-x-auto overscroll-x-contain rounded-lg bg-surface-sunken p-1 text-fg-muted md:pointer-fine:h-10 [&::-webkit-scrollbar]:hidden",
          className,
        )}
        {...props}
      />
      {/* Edge fades appear while more tabs are hidden on that side (the scroll affordance). */}
      <span
        aria-hidden="true"
        className={cn(
          edgeFade,
          "left-0 rounded-l-lg bg-linear-to-r",
          canScrollStart ? "opacity-100" : "opacity-0",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          edgeFade,
          "right-0 rounded-r-lg bg-linear-to-l",
          canScrollEnd ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

export function TabsTrigger({
  className,
  onFocus,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex h-11 min-w-11 shrink-0 snap-start items-center justify-center gap-2 rounded-md px-4 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] duration-(--sp-duration-fast) md:pointer-fine:h-8 md:pointer-fine:px-3",
        "hover:text-fg disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-1",
        focusRing,
        className,
      )}
      onFocus={(event) => {
        onFocus?.(event);
        // Keyboard navigation can land on a tab that is scrolled out of view.
        event.currentTarget.scrollIntoView?.({ inline: "nearest", block: "nearest" });
      }}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 rounded-md data-[state=active]:animate-fade-in", focusRing, className)}
      {...props}
    />
  );
}
