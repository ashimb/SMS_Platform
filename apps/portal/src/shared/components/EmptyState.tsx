import { EmptyState as BaseEmptyState, type EmptyStateProps } from "@school-platform/ui";

import { cn } from "@/shared/utils/cn.ts";

/**
 * Empty state for whole sections: the UI kit's EmptyState on a soft dotted surface, so an empty
 * page still looks designed rather than broken. Always pair it with the next useful action.
 */
export function EmptyState({ className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border-strong bg-surface",
        "bg-[radial-gradient(var(--sp-border)_1px,transparent_1px)] [background-size:16px_16px]",
        className,
      )}
    >
      <BaseEmptyState {...props} />
    </div>
  );
}
