import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { type ReactNode } from "react";

import { cn } from "../lib/cn.ts";

/** Wrap the app once. Tooltips open on hover and keyboard focus, and close on Escape. */
export const TooltipProvider = TooltipPrimitive.Provider;

export interface TooltipProps {
  content: ReactNode;
  /** A single focusable element (button, link). Tooltips never hold essential information. */
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = "top",
  delayDuration = 300,
  className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-50 max-w-xs rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-50 shadow-3 data-[state=delayed-open]:animate-fade-in dark:bg-neutral-50 dark:text-neutral-900",
            className,
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-neutral-900 dark:fill-neutral-50" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
