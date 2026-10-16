import { Badge, Button, Skeleton, StatCard } from "@school-platform/ui";
import {
  CalendarCheck,
  ClipboardCheck,
  IndianRupee,
  Megaphone,
  UserPlus,
  UsersRound,
  Wallet,
} from "lucide-react";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { QueryError } from "@/shared/components/QueryError.tsx";
import { PERMISSIONS } from "@/shared/constants/permissions.ts";
import { ROUTES } from "@/shared/constants/routes.ts";
import { usePermission } from "@/shared/hooks/usePermission.ts";
import { formatDate, formatINR, formatNumber, formatPercent } from "@/shared/utils/format.ts";

import { isDashboardUnavailable, useDashboard } from "../api/index.ts";
import {
  DashboardGreeting,
  DashboardSkeleton,
  DashboardUnavailable,
  Panel,
  PanelEmpty,
  type QuickAction,
  QuickActions,
  useLocale,
} from "./DashboardParts.tsx";

const AttendanceTrendChart = lazy(() => import("./AttendanceTrendChart.tsx"));

function useAdminActions(): QuickAction[] {
  const { t } = useTranslation("dashboard");
  const canAddStudent = usePermission(PERMISSIONS.studentsCreate);
  const actions: QuickAction[] = [
    {
      key: "attendance",
      to: ROUTES.attendance,
      icon: CalendarCheck,
      label: t("actions.markAttendance"),
      description: t("actions.markAttendanceHint"),
    },
    {
      key: "notice",
      to: ROUTES.communication,
      icon: Megaphone,
      label: t("actions.sendNotice"),
      description: t("actions.sendNoticeHint"),
    },
    {
      key: "fees",
      to: ROUTES.fees,
      icon: Wallet,
      label: t("actions.recordPayment"),
      description: t("actions.recordPaymentHint"),
    },
  ];
  if (canAddStudent) {
    actions.unshift({
      key: "student",
      to: ROUTES.studentNew,
      icon: UserPlus,
      label: t("actions.addStudent"),
      description: t("actions.addStudentHint"),
    });
  }
  return actions.slice(0, 4);
}

/** Principal / office dashboard (FR-RPT-001 PRN + ADM widgets). */
export function AdminDashboard() {
  const { t } = useTranslation("dashboard");
  const locale = useLocale();
  const actions = useAdminActions();
  const query = useDashboard("admin");

  if (query.isPending) return <DashboardSkeleton />;

  if (query.isError) {
    return (
      <div className="space-y-6">
        <DashboardGreeting />
        {isDashboardUnavailable(query.error) ? (
          <DashboardUnavailable
            actions={
              <Button asChild variant="secondary">
                <Link to={ROUTES.students}>{t("actions.openStudents")}</Link>
              </Button>
            }
          />
        ) : (
          <QueryError error={query.error} onRetry={() => void query.refetch()} />
        )}
        <QuickActions actions={actions} />
      </div>
    );
  }

  const { stats, attendance_trend, unmarked_sections, upcoming_events, recent_notices } =
    query.data;
  const target = stats.fees_target_mtd;

  return (
    <div className="space-y-8">
      <DashboardGreeting asOf={query.data.as_of} />

      <section aria-label={t("admin.keyFigures")} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("admin.students")}
          value={formatNumber(stats.students_enrolled, locale)}
          icon={<UsersRound />}
        />
        <StatCard
          label={t("admin.attendanceToday")}
          value={
            stats.attendance_today_pct === null
              ? "—"
              : formatPercent(stats.attendance_today_pct, locale)
          }
          icon={<CalendarCheck />}
          footer={
            unmarked_sections.length > 0
              ? t("admin.unmarkedCount", { count: unmarked_sections.length })
              : t("admin.allMarked")
          }
        />
        <StatCard
          label={t("admin.feesMtd")}
          value={formatINR(stats.fees_collected_mtd, { locale, compact: true })}
          icon={<IndianRupee />}
          footer={
            target
              ? t("admin.ofTarget", { target: formatINR(target, { locale, compact: true }) })
              : undefined
          }
        />
        <StatCard
          label={t("admin.approvals")}
          value={formatNumber(stats.pending_approvals, locale)}
          icon={<ClipboardCheck />}
        />
      </section>

      <QuickActions actions={actions} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title={t("admin.trendTitle")}
          className="lg:col-span-2"
          link={{ to: ROUTES.attendance, label: t("viewAll") }}
        >
          {attendance_trend.length === 0 ? (
            <PanelEmpty>{t("admin.noTrend")}</PanelEmpty>
          ) : (
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
              <AttendanceTrendChart data={attendance_trend} />
            </Suspense>
          )}
        </Panel>

        <Panel
          title={t("admin.unmarkedTitle")}
          link={{ to: ROUTES.attendance, label: t("viewAll") }}
        >
          {unmarked_sections.length === 0 ? (
            <PanelEmpty>{t("admin.allMarked")}</PanelEmpty>
          ) : (
            <ul className="divide-y divide-border">
              {unmarked_sections.map((row) => (
                <li key={row.section} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm font-medium text-fg">{row.section}</span>
                  <span className="truncate text-sm text-fg-muted">{row.teacher}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title={t("admin.noticesTitle")}
          className="lg:col-span-2"
          link={{ to: ROUTES.communication, label: t("viewAll") }}
        >
          {recent_notices.length === 0 ? (
            <PanelEmpty>{t("admin.noNotices")}</PanelEmpty>
          ) : (
            <ul className="divide-y divide-border">
              {recent_notices.map((notice) => (
                <li key={notice.id} className="flex items-center gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{notice.title}</p>
                    <p className="text-xs text-fg-subtle">
                      {formatDate(notice.published_at, locale)}
                    </p>
                  </div>
                  <div className="w-32 shrink-0">
                    <div className="mb-1 flex justify-between text-xs text-fg-muted">
                      <span>{t("admin.read")}</span>
                      <span className="tabular-nums">
                        {formatPercent(notice.read_pct, locale, 0)}
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-surface-sunken"
                      role="meter"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={notice.read_pct}
                      aria-label={t("admin.readRate", { title: notice.title })}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${String(notice.read_pct)}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={t("admin.eventsTitle")}>
          {upcoming_events.length === 0 ? (
            <PanelEmpty>{t("admin.noEvents")}</PanelEmpty>
          ) : (
            <ul className="space-y-3">
              {upcoming_events.map((event) => (
                <li key={event.id} className="flex items-center gap-3">
                  <Badge tone="primary" size="md">
                    {formatDate(event.date, locale).split(" ").slice(0, 2).join(" ")}
                  </Badge>
                  <span className="text-sm text-fg">{event.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
