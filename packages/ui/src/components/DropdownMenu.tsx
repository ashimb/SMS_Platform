import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useRef,
  useState,
} from "react";

import { useBreakpoint, useCoarsePointer } from "../hooks/useMediaQuery.ts";
import { useSwipeToDismiss } from "../hooks/useSwipeToDismiss.ts";
import { cn } from "../lib/cn.ts";
import { ResponsiveSheetOverlay } from "./ResponsiveSheet.tsx";

/**
 * Menu with two presentations (RESPONSIVE standard, "Dropdowns become native-feeling sheets on
 * mobile"):
 *
 *   - wide screens with a mouse: a Radix popover menu (arrow keys, typeahead, Escape, focus
 *     returns to the trigger);
 *   - phones and touch devices: a bottom sheet of large rows (48px) that dismisses with a tap
 *     outside, a swipe down or Escape.
 *
 * Both take the same children, so call sites do not change. The first (server) render is the
 * phone presentation.
 */
interface SheetMenu {
  setOpen: (open: boolean) => void;
}
const SheetMenuContext = createContext<SheetMenu | null>(null);

export function DropdownMenu({
  open,
  defaultOpen,
  onOpenChange,
  children,
  ...rest
}: ComponentProps<typeof DropdownPrimitive.Root>) {
  const wide = useBreakpoint("md");
  const touch = useCoarsePointer();
  const [inner, setInner] = useState(defaultOpen ?? false);
  const isOpen = open ?? inner;
  const setOpen = (next: boolean) => {
    setInner(next);
    onOpenChange?.(next);
  };

  if (wide && !touch) {
    return (
      <DropdownPrimitive.Root {...rest} open={isOpen} onOpenChange={setOpen}>
        {children}
      </DropdownPrimitive.Root>
    );
  }
  return (
    <SheetMenuContext.Provider value={{ setOpen }}>
      <DialogPrimitive.Root open={isOpen} onOpenChange={setOpen}>
        {children}
      </DialogPrimitive.Root>
    </SheetMenuContext.Provider>
  );
}

export function DropdownMenuTrigger(props: ComponentProps<typeof DropdownPrimitive.Trigger>) {
  const sheet = useContext(SheetMenuContext);
  return sheet ? (
    <DialogPrimitive.Trigger {...(props as ComponentProps<typeof DialogPrimitive.Trigger>)} />
  ) : (
    <DropdownPrimitive.Trigger {...props} />
  );
}

export function DropdownMenuGroup(props: ComponentProps<typeof DropdownPrimitive.Group>) {
  const sheet = useContext(SheetMenuContext);
  return sheet ? (
    <div role="group" {...(props as ComponentProps<"div">)} />
  ) : (
    <DropdownPrimitive.Group {...props} />
  );
}

export interface DropdownMenuContentProps extends ComponentProps<typeof DropdownPrimitive.Content> {
  /** Accessible name of the bottom sheet shown on phones. */
  sheetTitle?: string;
}

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = "end",
  sheetTitle = "Menu",
  children,
  ...props
}: DropdownMenuContentProps) {
  const sheet = useContext(SheetMenuContext);
  if (sheet) return <MenuSheet title={sheetTitle}>{children}</MenuSheet>;
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
      >
        {children}
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  );
}

function MenuSheet({ title, children }: { title: string; children: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipe = useSwipeToDismiss({
    onDismiss: () => {
      closeRef.current?.click();
    },
  });
  return (
    <DialogPrimitive.Portal>
      <ResponsiveSheetOverlay />
      <DialogPrimitive.Content
        data-responsive-sheet="bottom"
        aria-describedby={undefined}
        style={swipe.style}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-border bg-surface-raised text-fg shadow-4 data-[state=open]:animate-slide-in-bottom"
      >
        <div
          {...swipe.handleProps}
          className="shrink-0 cursor-grab px-5 pt-2 pb-2 active:cursor-grabbing"
        >
          <span
            aria-hidden="true"
            className="mx-auto block h-1.5 w-10 rounded-full bg-border-strong"
          />
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
        </div>
        <div
          role="menu"
          aria-label={title}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-[max(1rem,var(--sp-safe-bottom))]"
        >
          {children}
        </div>
        <DialogPrimitive.Close ref={closeRef} hidden tabIndex={-1} aria-hidden="true" />
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
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
  const sheet = useContext(SheetMenuContext);
  if (sheet) {
    const {
      onSelect,
      disabled,
      children,
      asChild: _asChild,
      textValue: _textValue,
      ...rest
    } = props;
    return (
      <button
        type="button"
        role="menuitem"
        {...(disabled ? { disabled: true } : {})}
        {...(rest as ComponentProps<"button">)}
        onClick={() => {
          const selection = new Event("menu.itemSelect", { cancelable: true });
          onSelect?.(selection);
          if (!selection.defaultPrevented) sheet.setOpen(false);
        }}
        className={cn(
          "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-base transition-colors outline-none select-none",
          "focus-visible:bg-surface-hover active:bg-surface-hover disabled:pointer-events-none disabled:text-fg-subtle [&_svg]:size-5 [&_svg]:text-fg-subtle",
          destructive && "text-danger-subtle-fg [&_svg]:text-current",
          className,
        )}
      >
        {children}
      </button>
    );
  }
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
  const sheet = useContext(SheetMenuContext);
  const classes = cn(
    "px-2.5 py-1.5 text-xs font-semibold tracking-wide text-fg-subtle uppercase",
    sheet && "px-3 py-2",
    className,
  );
  return sheet ? (
    <div className={classes} {...(props as ComponentProps<"div">)} />
  ) : (
    <DropdownPrimitive.Label className={classes} {...props} />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: ComponentProps<typeof DropdownPrimitive.Separator>) {
  const sheet = useContext(SheetMenuContext);
  const classes = cn("-mx-1 my-1 h-px bg-border", className);
  return sheet ? (
    <div role="separator" className={classes} {...(props as ComponentProps<"div">)} />
  ) : (
    <DropdownPrimitive.Separator className={classes} {...props} />
  );
}
