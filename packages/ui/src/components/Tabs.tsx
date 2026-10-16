import * as TabsPrimitive from "@radix-ui/react-tabs";
import { type ComponentProps } from "react";

import { cn } from "../lib/cn.ts";
import { focusRing } from "../lib/styles.ts";

/** Tabs (Radix): arrow keys move between tabs, Home/End jump, automatic activation. */
export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-10 max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-surface-sunken p-1 text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex h-8 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] duration-(--sp-duration-fast)",
        "hover:text-fg disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-surface data-[state=active]:text-fg data-[state=active]:shadow-1",
        focusRing,
        className,
      )}
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
