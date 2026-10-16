/**
 * Dashboard payloads for GET /api/v1/dashboards/{role} (FRD §8, widget sets from FR-RPT-001).
 *
 * The API does not serve these yet; MSW provides them in dev and tests. The shapes are the
 * portal's proposal for the API contract (docs/DEFERRED.md). Responses are validated at runtime,
 * so a mismatch shows a clean error state instead of a broken screen.
 * Money is a decimal string (never a float); percentages are numbers 0–100.
 */
import { z } from "zod";

const decimal = z.string().regex(/^-?\d+(\.\d+)?$/);
const isoDate = z.iso.date();
const isoDateTime = z.iso.datetime({ offset: true });
const percent = z.number().min(0).max(100);

export const adminDashboardSchema = z.object({
  as_of: isoDateTime,
  stats: z.object({
    students_enrolled: z.number().int().nonnegative(),
    attendance_today_pct: percent.nullable(),
    fees_collected_mtd: decimal,
    fees_target_mtd: decimal.nullable(),
    pending_approvals: z.number().int().nonnegative(),
  }),
  attendance_trend: z.array(z.object({ date: isoDate, present_pct: percent })),
  unmarked_sections: z.array(z.object({ section: z.string(), teacher: z.string() })),
  upcoming_events: z.array(z.object({ id: z.string(), title: z.string(), date: isoDate })),
  recent_notices: z.array(
    z.object({ id: z.string(), title: z.string(), published_at: isoDateTime, read_pct: percent }),
  ),
});

export const teacherDashboardSchema = z.object({
  as_of: isoDateTime,
  today: z.array(
    z.object({
      period: z.number().int().positive(),
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
      subject: z.string(),
      section: z.string(),
      room: z.string().nullable(),
    }),
  ),
  attendance_pending: z.array(z.object({ section_id: z.string(), section: z.string() })),
  marks_pending: z.number().int().nonnegative(),
  unread_messages: z.number().int().nonnegative(),
  homework_today: z.number().int().nonnegative(),
});

export const parentDashboardSchema = z.object({
  as_of: isoDateTime,
  children: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      class_section: z.string(),
      attendance_today: z.enum(["present", "absent", "late", "not_marked"]),
      attendance_pct: percent,
      dues: decimal,
      due_date: isoDate.nullable(),
      latest_notice: z.object({ title: z.string(), published_at: isoDateTime }).nullable(),
      latest_result: z.object({ exam: z.string(), grade: z.string() }).nullable(),
    }),
  ),
});

export const dashboardSchemas = {
  admin: adminDashboardSchema,
  teacher: teacherDashboardSchema,
  parent: parentDashboardSchema,
} as const;
