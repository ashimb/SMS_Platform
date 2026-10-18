import { type ComponentProps } from "react";
import { toast, Toaster as SonnerToaster } from "sonner";

/**
 * Toasts (sonner) styled with design tokens. Announced politely via an ARIA live region;
 * use for confirmations and background results, never for errors that block a task (use an
 * inline alert instead). Keep messages short, and offer Undo where an action is reversible.
 */
export function Toaster(props: ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      duration={5000}
      gap={8}
      // Phones: toasts stack above the portal's bottom navigation and clear of the home
      // indicator (and below the notch); desktop keeps the corner offset.
      offset={{ top: "calc(var(--sp-safe-top) + 1rem)", right: "1rem" }}
      mobileOffset={{
        top: "calc(var(--sp-safe-top) + 0.75rem)",
        bottom: "calc(var(--sp-safe-bottom) + var(--sp-bottom-offset, 0px) + 0.75rem)",
        left: "0.75rem",
        right: "0.75rem",
      }}
      toastOptions={{
        classNames: {
          toast:
            "group flex w-full items-start gap-3 rounded-lg border border-border bg-surface-raised p-4 text-sm text-fg shadow-3",
          title: "font-semibold",
          description: "text-fg-muted",
          actionButton: "rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-fg",
          cancelButton: "rounded-md bg-surface-sunken px-2.5 py-1 text-xs font-medium text-fg",
          closeButton: "border-border bg-surface text-fg-subtle",
          success: "[&_[data-icon]]:text-success",
          error: "[&_[data-icon]]:text-danger",
          warning: "[&_[data-icon]]:text-warning",
          info: "[&_[data-icon]]:text-info",
        },
      }}
      {...props}
    />
  );
}

export { toast };
