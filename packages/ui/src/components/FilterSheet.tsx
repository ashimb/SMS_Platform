import { SlidersHorizontal } from "lucide-react";
import { type ReactNode } from "react";

import { type Breakpoint, useBreakpoint } from "../hooks/useMediaQuery.ts";
import { cn } from "../lib/cn.ts";
import { Badge } from "./Badge.tsx";
import { Button } from "./Button.tsx";
import {
  ResponsiveSheet,
  ResponsiveSheetClose,
  ResponsiveSheetContent,
  ResponsiveSheetFooter,
  ResponsiveSheetTrigger,
} from "./ResponsiveSheet.tsx";

export interface FilterSheetProps {
  /** The filter controls. They render inline from `inlineFrom` up and inside the sheet below. */
  children: ReactNode;
  /** Number of filters currently applied (drives the count chip). */
  activeCount?: number;
  /** Clears every filter. When given, a "Clear" action is offered. */
  onClear?: () => void;
  /** Label of the trigger button. */
  label?: string;
  /** Title of the sheet (defaults to the label). */
  title?: string;
  clearLabel?: string;
  applyLabel?: string;
  closeLabel?: string;
  /** Screen-reader text for the count chip, e.g. "2 active". */
  activeLabel?: (count: number) => string;
  /** Viewport width from which the filters sit inline instead of in a sheet. Default: `md`. */
  inlineFrom?: Breakpoint;
  className?: string;
}

/**
 * Filters that collapse into a sheet on phones (RESPONSIVE standard): a "Filters" button with an
 * active-filter count chip opens a bottom sheet holding the controls; from `inlineFrom` up the
 * same controls simply sit in the toolbar. Keep the page's search field outside this component so
 * it stays visible at every size.
 */
export function FilterSheet({
  children,
  activeCount = 0,
  onClear,
  label = "Filters",
  title,
  clearLabel = "Clear filters",
  applyLabel = "Show results",
  closeLabel = "Close",
  activeLabel = (count) => `${String(count)} active`,
  inlineFrom = "md",
  className,
}: FilterSheetProps) {
  const inline = useBreakpoint(inlineFrom);

  if (inline) {
    return (
      <div className={cn("flex flex-wrap items-end gap-3", className)}>
        {children}
        {activeCount > 0 && onClear ? (
          <Button type="button" variant="ghost" onClick={onClear}>
            {clearLabel}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <ResponsiveSheet>
      <ResponsiveSheetTrigger asChild>
        <Button type="button" variant="secondary" className={cn("justify-center", className)}>
          <SlidersHorizontal aria-hidden="true" />
          {label}
          {activeCount > 0 ? (
            <>
              <Badge tone="primary" size="sm" aria-hidden="true">
                {activeCount}
              </Badge>
              <span className="sr-only">{activeLabel(activeCount)}</span>
            </>
          ) : null}
        </Button>
      </ResponsiveSheetTrigger>
      <ResponsiveSheetContent title={title ?? label} closeLabel={closeLabel}>
        <div className="flex flex-col gap-4">{children}</div>
        <ResponsiveSheetFooter>
          {onClear ? (
            <Button type="button" variant="ghost" onClick={onClear} disabled={activeCount === 0}>
              {clearLabel}
            </Button>
          ) : null}
          <ResponsiveSheetClose asChild>
            <Button type="button">{applyLabel}</Button>
          </ResponsiveSheetClose>
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
