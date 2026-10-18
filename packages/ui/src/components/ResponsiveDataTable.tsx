import { flexRender, type RowData } from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { type ReactNode, useId, useState } from "react";

import { type Breakpoint, useBreakpoint } from "../hooks/useMediaQuery.ts";
import { cn } from "../lib/cn.ts";
import { focusRing } from "../lib/styles.ts";
import {
  type DataTableInstance,
  type DataTableProps,
  DataTableView,
  useDataTable,
} from "./DataTable.tsx";
import { Skeleton } from "./Skeleton.tsx";

/** Which columns appear where when the table becomes a list of cards on a phone. */
export interface MobileCardLayout {
  /** Column id shown as the card's headline (usually the name, with its link). */
  primary: string;
  /** Column ids shown as labelled lines under the headline. */
  secondary?: readonly string[];
  /** Column ids revealed by "Show details". Default: every column not used above. */
  details?: readonly string[];
  /** Labels for columns whose header is not a plain string. */
  labels?: Readonly<Record<string, string>>;
  showDetailsLabel?: string;
  hideDetailsLabel?: string;
}

export interface ResponsiveDataTableProps<TData extends RowData> extends DataTableProps<TData> {
  mobile: MobileCardLayout;
  /** Keep the header row visible while the rows scroll (desktop table). Default: true. */
  stickyHeader?: boolean;
  /** Viewport width from which the real table is shown. Default: `md`. */
  breakpoint?: Breakpoint;
}

/**
 * Data table that reads well on every screen (RESPONSIVE standard, "Never ship a table that
 * requires pinch-zoom"):
 *
 *   - from the breakpoint up: the full semantic table with a sticky header;
 *   - below it: a list of cards: the primary column as the headline, secondary columns as labelled
 *     lines, and the remaining columns behind an expandable "Show details" row.
 *
 * Loading shows skeletons in the shape of each presentation; empty and error states are shared.
 */
export function ResponsiveDataTable<TData extends RowData>({
  mobile,
  stickyHeader = true,
  breakpoint = "md",
  data,
  columns,
  getRowId,
  ...view
}: ResponsiveDataTableProps<TData>) {
  const wide = useBreakpoint(breakpoint);
  const table = useDataTable({ data, columns, ...(getRowId ? { getRowId } : {}) });

  if (wide) {
    return (
      <DataTableView
        table={table}
        {...view}
        {...(stickyHeader ? { maxHeightClassName: "max-h-[calc(100dvh-14rem)]" } : {})}
      />
    );
  }
  return <CardList table={table} mobile={mobile} {...view} />;
}

function columnLabel<TData extends RowData>(
  table: DataTableInstance<TData>,
  id: string,
  labels: Readonly<Record<string, string>> | undefined,
): string {
  const given = labels?.[id];
  if (given) return given;
  const header = table.getColumn(id)?.columnDef.header;
  return typeof header === "string" ? header : id;
}

function CardList<TData extends RowData>({
  table,
  mobile,
  caption,
  loading = false,
  loadingRows = 5,
  error,
  empty,
  className,
}: {
  table: DataTableInstance<TData>;
  mobile: MobileCardLayout;
} & Pick<
  DataTableProps<TData>,
  "caption" | "loading" | "loadingRows" | "error" | "empty" | "className"
>) {
  const rows = table.getRowModel().rows;
  const allIds = table.getAllLeafColumns().map((column) => column.id);
  const secondary = mobile.secondary ?? [];
  const used = new Set([mobile.primary, ...secondary]);
  const details = mobile.details ?? allIds.filter((id) => !used.has(id));

  if (loading) {
    return (
      // Explicit role: Safari/VoiceOver drops list semantics from unstyled lists.
      // eslint-disable-next-line jsx-a11y-x/no-redundant-roles
      <ul role="list" aria-label={caption} aria-busy="true" className={cn("space-y-3", className)}>
        {Array.from({ length: loadingRows }, (_, index) => (
          <li
            key={`loading-${String(index)}`}
            className="rounded-xl border border-border bg-surface p-4 shadow-1"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="mt-4 space-y-2">
              {secondary.slice(0, 2).map((id) => (
                <Skeleton key={id} className="h-3 w-56 max-w-full" />
              ))}
            </div>
          </li>
        ))}
      </ul>
    );
  }
  if (error) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-surface px-4 py-10 text-center",
          className,
        )}
      >
        {error}
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-surface px-4 py-10 text-center text-sm text-fg-muted",
          className,
        )}
      >
        {empty ?? "No records to show."}
      </div>
    );
  }

  return (
    // Explicit role: Safari/VoiceOver drops list semantics from unstyled lists.
    // eslint-disable-next-line jsx-a11y-x/no-redundant-roles
    <ul role="list" aria-label={caption} className={cn("space-y-3", className)}>
      {rows.map((row) => {
        const cell = (id: string): ReactNode => {
          const match = row.getAllCells().find((candidate) => candidate.column.id === id);
          return match ? flexRender(match.column.columnDef.cell, match.getContext()) : null;
        };
        return (
          <li key={row.id}>
            <MobileCard
              headline={cell(mobile.primary)}
              lines={secondary.map((id) => ({
                id,
                label: columnLabel(table, id, mobile.labels),
                value: cell(id),
              }))}
              details={details.map((id) => ({
                id,
                label: columnLabel(table, id, mobile.labels),
                value: cell(id),
              }))}
              showLabel={mobile.showDetailsLabel ?? "Show details"}
              hideLabel={mobile.hideDetailsLabel ?? "Hide details"}
            />
          </li>
        );
      })}
    </ul>
  );
}

interface Line {
  id: string;
  label: string;
  value: ReactNode;
}

function LabelledLines({ lines, className }: { lines: readonly Line[]; className?: string }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm",
        className,
      )}
    >
      {lines.map((line) => (
        <div key={line.id} className="contents">
          <dt className="text-fg-muted">{line.label}</dt>
          <dd className="min-w-0 break-words text-fg">{line.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function MobileCard({
  headline,
  lines,
  details,
  showLabel,
  hideLabel,
}: {
  headline: ReactNode;
  lines: readonly Line[];
  details: readonly Line[];
  showLabel: string;
  hideLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const regionId = useId();
  return (
    <article className="rounded-xl border border-border bg-surface p-4 shadow-1">
      {/* Links inside the headline get a 44px-tall tap area. */}
      <div className="min-w-0 text-base font-medium [&_a]:flex [&_a]:min-h-11 [&_a]:items-center">
        {headline}
      </div>
      {lines.length > 0 ? <LabelledLines lines={lines} className="mt-2" /> : null}
      {details.length > 0 ? (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={regionId}
            onClick={() => {
              setOpen((value) => !value);
            }}
            className={cn(
              "mt-3 flex min-h-11 w-full items-center justify-between rounded-lg px-1 text-sm font-medium text-primary-subtle-fg",
              focusRing,
            )}
          >
            {open ? hideLabel : showLabel}
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-4 transition-transform motion-reduce:transition-none",
                open && "rotate-180",
              )}
            />
          </button>
          <div id={regionId} hidden={!open} className="border-t border-border pt-3">
            <LabelledLines lines={details} />
          </div>
        </>
      ) : null}
    </article>
  );
}
