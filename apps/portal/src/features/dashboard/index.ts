/** Role dashboards (FR-RPT-001). Data via GET /api/v1/dashboards/{role}; MSW until the API has it. */
export {
  dashboardKeys,
  fetchDashboard,
  isDashboardUnavailable,
  useDashboard,
} from "./api/index.ts";
export { AdminDashboard } from "./components/AdminDashboard.tsx";
export { ParentDashboard } from "./components/ParentDashboard.tsx";
export { periodStates, TeacherDashboard } from "./components/TeacherDashboard.tsx";
export {
  adminDashboardSchema,
  dashboardSchemas,
  parentDashboardSchema,
  teacherDashboardSchema,
} from "./schemas.ts";
export type {
  AdminDashboardData,
  DashboardDataByRole,
  DashboardRole,
  ParentDashboardData,
  TeacherDashboardData,
} from "./types.ts";
