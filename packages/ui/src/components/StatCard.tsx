import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { type ReactNode } from "react";

import { cn } from "../lib/cn.ts";
import { Card } from "./Card.tsx";
import { Skeleton } from "./Skeleton.tsx";

export interface StatDelta {
  /** Display text, e.g. "+4.2%" or "₹12,500". */
  value: string;
  trend: "up" | "down" | "neutral";
  /** Whether this trend is good news (green) or bad news (red) for this metric. */
  sentiment?: "positive" | "negative" | "neutral";
  /** Context for the comparison, e.g. "vs last month". */
  label?: string;
}

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  delta?: StatDelta;
  icon?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  className?: string;
}

const trendIcon = { up: ArrowUpRight, down: ArrowDownRight, neutral: ArrowRight } as const;
const trendWords = { up: "Up", down: "Down", neutral: "No change," } as const;
const sentimentClass = {
  positive: "bg-success-subtle text-success-subtle-fg",
  negative: "bg-danger-subtle text-danger-subtle-fg",
  neutral: "bg-surface-sunken text-fg-muted",
} as const;

/** KPI tile for dashboards. Trend is conveyed by icon, colour, and text (not colour alone). */
export function StatCard({
  label,
  value,
  delta,
  icon,
  footer,
  loading = false,
  className,
}: StatCardProps) {
  const Icon = delta ? trendIcon[delta.trend] : null;
  return (
    <Card className={cn("flex flex-col gap-4 p-5", className)} aria-busy={loading || undefined}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-fg-muted">{label}</p>
        {icon ? (
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-lg bg-primary-subtle text-primary-subtle-fg [&_svg]:size-4.5"
          >
            {icon}
          </span>
        ) : null}
      </div>
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="font-display text-3xl font-semibold tracking-tight text-fg tabular-nums">
            {value}
          </p>
          {delta && Icon ? (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  sentimentClass[delta.sentiment ?? "neutral"],
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                <span className="sr-only">{trendWords[delta.trend]}</span>
                {delta.value}
              </span>
              {delta.label ? <span className="text-fg-subtle">{delta.label}</span> : null}
            </p>
          ) : null}
        </div>
      )}
      {footer ? (
        <div className="border-t border-border pt-3 text-sm text-fg-muted">{footer}</div>
      ) : null}
    </Card>
  );
}
