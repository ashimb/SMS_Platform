import { Badge, Button, StatCard, StatCardGrid } from "@school-platform/ui";
import { BookOpen, CalendarCheck, ClipboardCheck, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { QueryError } from "@/shared/components/QueryError.tsx";
import { ROUTES } from "@/shared/constants/routes.ts";
import { cn } from "@/shared/utils/cn.ts";
import { formatNumber } from "@/shared/utils/format.ts";

import { isDashboardUnavailable, useDashboard } from "../api/index.ts";
import type { TeacherDashboardData } from "../types.ts";
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

function minutesOf(hhmm: string): number {
  const [h = "0", m = "0"] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

/** "now" | "next" | "done" | "later" for each period, so the current one can be highlighted. */
export function periodStates(periods: TeacherDashboardData["today"], now: Date) {
  const minute = now.getHours() * 60 + now.getMinutes();
  let nextFound = false;
  return periods.map((period) => {
    if (minute >= minutesOf(period.start) && minute < minutesOf(period.end)) return "now" as const;
    if (minute >= minutesOf(period.end)) return "done" as const;
    if (!nextFound) {
      nextFound = true;
      return "next" as const;
    }
    return "later" as const;
  });
}

/** Class/subject teacher dashboard (FR-RPT-001 CT/TCH widgets). */
export function TeacherDashboard() {
  const { t } = useTranslation("dashboard");
  const locale = useLocale();
  const query = useDashboard("teacher");

  const actions: QuickAction[] = [
    {
      key: "attendance",
      to: ROUTES.attendance,
      icon: CalendarCheck,
      label: t("actions.markAttendance"),
      description: t("actions.markAttendanceHint"),
    },
    {
      key: "marks",
      to: ROUTES.exams,
      icon: ClipboardCheck,
      label: t("actions.enterMarks"),
      description: t("actions.enterMarksHint"),
    },
    {
      key: "messages",
      to: ROUTES.communication,
      icon: MessageSquare,
      label: t("actions.messageParents"),
      description: t("actions.messageParentsHint"),
    },
  ];

  if (query.isPending) return <DashboardSkeleton stats={3} />;
  if (query.isError) {
    return (
      <div className="space-y-6">
        <DashboardGreeting />
        {isDashboardUnavailable(query.error) ? (
          <DashboardUnavailable
            actions={
              <Button asChild variant="secondary">
                <Link to={ROUTES.attendance}>{t("actions.markAttendance")}</Link>
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

  const data = query.data;
  const states = periodStates(data.today, new Date());

  return (
    <div className="space-y-8">
      <DashboardGreeting asOf={data.as_of} />

      {data.attendance_pending.length > 0 ? (
        <section
          aria-labelledby="attendance-due"
          className="flex flex-col gap-4 rounded-2xl bg-primary-700 p-5 text-white shadow-2 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div className="space-y-1">
            <h2 id="attendance-due" className="font-display text-lg font-semibold">
              {t("teacher.attendanceDue", {
                sections: data.attendance_pending.map((s) => s.section).join(", "),
              })}
            </h2>
            <p className="text-sm text-white/85">{t("teacher.attendanceDueHint")}</p>
          </div>
          <Button asChild variant="secondary" className="shrink-0">
            <Link to={ROUTES.attendance}>
              <CalendarCheck aria-hidden="true" />
              {t("actions.markAttendance")}
            </Link>
          </Button>
        </section>
      ) : null}

      <StatCardGrid role="region" aria-label={t("admin.keyFigures")} className="@3xl:grid-cols-3">
        <StatCard
          label={t("teacher.classesToday")}
          value={formatNumber(data.today.length, locale)}
          icon={<BookOpen />}
        />
        <StatCard
          label={t("teacher.marksPending")}
          value={formatNumber(data.marks_pending, locale)}
          icon={<ClipboardCheck />}
        />
        <StatCard
          label={t("teacher.unread")}
          value={formatNumber(data.unread_messages, locale)}
          icon={<MessageSquare />}
        />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title={t("teacher.todayTitle")}
          className="lg:col-span-2"
          link={{ to: ROUTES.timetable, label: t("viewAll") }}
        >
          {data.today.length === 0 ? (
            <PanelEmpty>{t("teacher.noClasses")}</PanelEmpty>
          ) : (
            <ol className="space-y-2">
              {data.today.map((period, index) => {
                const state = states[index] ?? "later";
                return (
                  <li
                    key={period.period}
                    aria-current={state === "now" ? "time" : undefined}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border p-3",
                      state === "now"
                        ? "border-primary-200 bg-primary-subtle dark:border-primary-800"
                        : "border-border",
                      state === "done" && "opacity-60",
                    )}
                  >
                    <div className="w-20 shrink-0 text-xs text-fg-muted tabular-nums">
                      {period.start}–{period.end}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fg">{period.subject}</p>
                      <p className="text-xs text-fg-muted">
                        {period.section}
                        {period.room ? ` · ${period.room}` : ""}
                      </p>
                    </div>
                    {state === "now" ? (
                      <Badge tone="primary" dot>
                        {t("teacher.now")}
                      </Badge>
                    ) : null}
                    {state === "next" ? <Badge tone="neutral">{t("teacher.next")}</Badge> : null}
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
        <div className="space-y-6">
          <QuickActions actions={actions} />
          <Panel title={t("teacher.homeworkTitle")}>
            <p className="text-sm text-fg-muted">
              {t("teacher.homeworkToday", { count: data.homework_today })}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
