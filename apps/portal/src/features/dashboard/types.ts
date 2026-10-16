import type { z } from "zod";

import type { DashboardRole } from "@/lib/pending-api.ts";

import type {
  adminDashboardSchema,
  parentDashboardSchema,
  teacherDashboardSchema,
} from "./schemas.ts";

export type AdminDashboardData = z.infer<typeof adminDashboardSchema>;
export type TeacherDashboardData = z.infer<typeof teacherDashboardSchema>;
export type ParentDashboardData = z.infer<typeof parentDashboardSchema>;

export interface DashboardDataByRole {
  admin: AdminDashboardData;
  teacher: TeacherDashboardData;
  parent: ParentDashboardData;
}

export type { DashboardRole };
