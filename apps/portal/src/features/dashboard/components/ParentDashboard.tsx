import { Avatar, Badge, Button, Card } from "@school-platform/ui";
import { CalendarCheck, ClipboardCheck, Megaphone, Users, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { EmptyState } from "@/shared/components/EmptyState.tsx";
import { QueryError } from "@/shared/components/QueryError.tsx";
import { ROUTES } from "@/shared/constants/routes.ts";
import { formatDate, formatINR, formatPercent } from "@/shared/utils/format.ts";

import { isDashboardUnavailable, useDashboard } from "../api/index.ts";
import type { ParentDashboardData } from "../types.ts";
import {
  DashboardGreeting,
  DashboardSkeleton,
  DashboardUnavailable,
  type QuickAction,
  QuickActions,
  useLocale,
} from "./DashboardParts.tsx";

type Child = ParentDashboardData["children"][number];

const ATTENDANCE_TONE = {
  present: "success",
  late: "warning",
  absent: "danger",
  not_marked: "neutral",
} as const;

function ChildCard({ child }: { child: Child }) {
  const { t } = useTranslation("dashboard");
  const locale = useLocale();
  const hasDues = Number(child.dues) > 0;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border p-5">
        <Avatar name={child.name} size="md" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-base font-semibold text-fg">{child.name}</h2>
          <p className="text-xs text-fg-muted">{child.class_section}</p>
        </div>
        <Badge tone={ATTENDANCE_TONE[child.attendance_today]} dot>
          {t(`parent.today.${child.attendance_today}`)}
        </Badge>
      </div>
      <dl className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <div className="p-4">
          <dt className="text-xs text-fg-muted">{t("parent.attendance")}</dt>
          <dd className="mt-1 font-display text-xl font-semibold text-fg tabular-nums">
            {formatPercent(child.attendance_pct, locale)}
          </dd>
        </div>
        <div className="p-4">
          <dt className="text-xs text-fg-muted">{t("parent.dues")}</dt>
          <dd
            className={`mt-1 font-display text-xl font-semibold tabular-nums ${hasDues ? "text-danger-subtle-fg" : "text-fg"}`}
          >
            {formatINR(child.dues, { locale })}
          </dd>
          {hasDues && child.due_date ? (
            <dd className="text-xs text-fg-muted">
              {t("parent.dueOn", { date: formatDate(child.due_date, locale) })}
            </dd>
          ) : null}
        </div>
      </dl>
      <ul className="space-y-3 p-5 text-sm">
        <li className="flex gap-2.5">
          <ClipboardCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
          <span className="text-fg-muted">
            {child.latest_result
              ? t("parent.latestResult", {
                  exam: child.latest_result.exam,
                  grade: child.latest_result.grade,
                })
              : t("parent.noResult")}
          </span>
        </li>
        <li className="flex gap-2.5">
          <Megaphone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
          <span className="text-fg-muted">
            {child.latest_notice ? child.latest_notice.title : t("parent.noNotice")}
          </span>
        </li>
      </ul>
      {hasDues ? (
        <div className="px-5 pb-5">
          <Button asChild className="w-full">
            <Link to={ROUTES.fees}>
              <Wallet aria-hidden="true" />
              {t("actions.payNow")}
            </Link>
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

/** Parent dashboard: one card per linked child (FR-RPT-001 PAR widgets). */
export function ParentDashboard() {
  const { t } = useTranslation("dashboard");
  const query = useDashboard("parent");

  const actions: QuickAction[] = [
    {
      key: "fees",
      to: ROUTES.fees,
      icon: Wallet,
      label: t("actions.payFees"),
      description: t("actions.payFeesHint"),
    },
    {
      key: "attendance",
      to: ROUTES.attendance,
      icon: CalendarCheck,
      label: t("actions.viewAttendance"),
      description: t("actions.viewAttendanceHint"),
    },
    {
      key: "results",
      to: ROUTES.exams,
      icon: ClipboardCheck,
      label: t("actions.viewResults"),
      description: t("actions.viewResultsHint"),
    },
    {
      key: "notices",
      to: ROUTES.communication,
      icon: Megaphone,
      label: t("actions.readNotices"),
      description: t("actions.readNoticesHint"),
    },
  ];

  if (query.isPending) return <DashboardSkeleton stats={2} />;
  if (query.isError) {
    return (
      <div className="space-y-6">
        <DashboardGreeting />
        {isDashboardUnavailable(query.error) ? (
          <DashboardUnavailable actions={null} />
        ) : (
          <QueryError error={query.error} onRetry={() => void query.refetch()} />
        )}
        <QuickActions actions={actions} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardGreeting asOf={query.data.as_of} />
      {query.data.children.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title={t("parent.noChildrenTitle")}
          description={t("parent.noChildrenBody")}
          headingLevel="h2"
        />
      ) : (
        <section
          aria-label={t("parent.childrenLabel")}
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {query.data.children.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </section>
      )}
      <QuickActions actions={actions} />
    </div>
  );
}
