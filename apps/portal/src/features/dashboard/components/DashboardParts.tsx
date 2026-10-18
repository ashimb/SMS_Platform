import { Card, Skeleton, StatCardGrid } from "@school-platform/ui";
import { ArrowRight, Sparkles } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useAuth } from "@/lib/auth-store.ts";
import { EmptyState } from "@/shared/components/EmptyState.tsx";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle.ts";
import { cn } from "@/shared/utils/cn.ts";
import {
  type AppLocale,
  formatDateTime,
  formatLongDay,
  toAppLocale,
} from "@/shared/utils/format.ts";

export function useLocale(): AppLocale {
  const { i18n } = useTranslation();
  return toAppLocale(i18n.language);
}

function greetingKey(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

/** "Good morning, Asha" + today's date + data freshness. */
export function DashboardGreeting({
  asOf,
  actions,
}: {
  asOf?: string | undefined;
  actions?: ReactNode;
}) {
  const { t } = useTranslation("dashboard");
  const locale = useLocale();
  const fullName = useAuth((state) => state.user?.full_name ?? "");
  const firstName = fullName.split(/\s+/)[0] ?? "";
  const now = new Date();
  useDocumentTitle(t("title"));

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-primary">{formatLongDay(now, locale)}</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
          {t(`greeting.${greetingKey(now.getHours())}`, { name: firstName })}
        </h1>
        {asOf ? (
          <p className="text-xs text-fg-subtle">
            {t("asOf", { time: formatDateTime(asOf, locale) })}
          </p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export interface QuickAction {
  key: string;
  to: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  label: string;
  description: string;
}

export function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  const { t } = useTranslation("dashboard");
  if (actions.length === 0) return null;
  return (
    <section aria-labelledby="quick-actions" className="space-y-3">
      <h2 id="quick-actions" className="text-sm font-semibold text-fg-muted">
        {t("quickActions")}
      </h2>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map(({ key, to, icon: Icon, label, description }) => (
          <li key={key}>
            <Link
              to={to}
              className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-1 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:hover:border-primary-800"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-fg transition-colors group-hover:bg-primary group-hover:text-primary-fg">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="space-y-0.5">
                <span className="block text-sm font-semibold text-fg">{label}</span>
                <span className="block text-xs text-fg-muted">{description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A dashboard panel: card with a heading, optional "view all" link and body. */
export function Panel({
  title,
  link,
  children,
  className,
}: {
  title: string;
  link?: { to: string; label: string } | undefined;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {link ? (
          <Link
            to={link.to}
            className="inline-flex items-center gap-1 rounded text-xs font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {link.label}
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </Card>
  );
}

export function PanelEmpty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-fg-muted">{children}</p>;
}

/** Skeleton matching the dashboard layout, so content does not jump when data arrives. */
export function DashboardSkeleton({ stats = 4 }: { stats?: number }) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6" role="status" aria-label={t("states.loading")}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-72" />
      </div>
      <StatCardGrid>
        {Array.from({ length: stats }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </StatCardGrid>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

/** Shown while the API has no dashboard endpoint (404): explains, and points to what works. */
export function DashboardUnavailable({ actions }: { actions: ReactNode }) {
  const { t } = useTranslation("dashboard");
  return (
    <EmptyState
      icon={<Sparkles />}
      title={t("unavailable.title")}
      description={t("unavailable.body")}
      action={actions}
      headingLevel="h2"
    />
  );
}
