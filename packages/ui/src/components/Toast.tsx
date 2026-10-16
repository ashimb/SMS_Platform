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
