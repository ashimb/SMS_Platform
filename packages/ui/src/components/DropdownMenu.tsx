import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { type ComponentProps } from "react";

import { cn } from "../lib/cn.ts";

/** Menu (Radix): arrow keys, typeahead, Escape, focus returns to the trigger. */
export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;
export const DropdownMenuGroup = DropdownPrimitive.Group;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = "end",
  ...props
}: ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 min-w-48 overflow-hidden rounded-lg border border-border bg-surface-raised p-1 text-fg shadow-3 data-[state=open]:animate-scale-in",
          className,
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export interface DropdownMenuItemProps extends ComponentProps<typeof DropdownPrimitive.Item> {
  /** Destructive actions are styled in red (and should confirm before acting). */
  destructive?: boolean;
}

export function DropdownMenuItem({
  className,
  destructive = false,
  ...props
}: DropdownMenuItemProps) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "relative flex h-9 cursor-pointer items-center gap-2 rounded-md px-2.5 text-sm transition-colors outline-none select-none",
        "data-disabled:pointer-events-none data-disabled:text-fg-subtle data-highlighted:bg-surface-hover [&_svg]:size-4 [&_svg]:text-fg-subtle",
        destructive &&
          "text-danger-subtle-fg data-highlighted:bg-danger-subtle [&_svg]:text-current",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn(
        "px-2.5 py-1.5 text-xs font-semibold tracking-wide text-fg-subtle uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Separator>) {
  return (
    <DropdownPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}
