/**
 * 14-day attendance trend (recharts). Loaded lazily so teacher/parent dashboards and the sign-in
 * page never download the chart library. The same data is available to screen readers as a table.
 */
import { Button } from "@school-platform/ui";
import { ChartColumn, Table2 } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDate, formatPercent } from "@/shared/utils/format.ts";

import type { AdminDashboardData } from "../types.ts";
import { useLocale } from "./DashboardParts.tsx";

export function AttendanceTrendChart({ data }: { data: AdminDashboardData["attendance_trend"] }) {
  const { t } = useTranslation("dashboard");
  const locale = useLocale();
  const [asTable, setAsTable] = useState(false);
  const gradientId = useId().replaceAll(":", "");
  const short = (date: string) => formatDate(date, locale).split(" ").slice(0, 2).join(" ");

  return (
    <figure className="m-0">
      <figcaption className="sr-only">{t("admin.trendCaption")}</figcaption>
      <div className="mb-2 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setAsTable((value) => !value);
          }}
        >
          {asTable ? <ChartColumn aria-hidden="true" /> : <Table2 aria-hidden="true" />}
          {asTable ? t("admin.viewAsChart") : t("admin.viewAsTable")}
        </Button>
      </div>
      <div className={asTable ? "hidden" : "h-56 sm:h-64"} aria-hidden="true">
        <ResponsiveContainer
          width="100%"
          height="100%"
          initialDimension={{ width: 600, height: 256 }}
        >
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--sp-primary-500)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--sp-primary-500)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--sp-border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={short}
              tick={{ fill: "var(--sp-fg-subtle)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              domain={[60, 100]}
              tickFormatter={(value: number) => `${String(value)}%`}
              tick={{ fill: "var(--sp-fg-subtle)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              cursor={{ stroke: "var(--sp-border-strong)" }}
              contentStyle={{
                background: "var(--sp-surface-raised)",
                border: "1px solid var(--sp-border)",
                borderRadius: 8,
                color: "var(--sp-fg)",
                boxShadow: "var(--sp-shadow-2)",
              }}
              labelFormatter={(label) => formatDate(String(label), locale)}
              formatter={(value) => [formatPercent(Number(value), locale), t("admin.present")]}
            />
            <Area
              type="monotone"
              dataKey="present_pct"
              stroke="var(--sp-primary-600)"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <table
        className={
          asTable
            ? "max-h-72 w-full overflow-y-auto text-sm [&_td]:border-t [&_td]:border-border [&_td]:py-2 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium"
            : "sr-only"
        }
      >
        <caption>{t("admin.trendCaption")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("admin.date")}</th>
            <th scope="col">{t("admin.present")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date}>
              <td>{formatDate(point.date, locale)}</td>
              <td>{formatPercent(point.present_pct, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default AttendanceTrendChart;
