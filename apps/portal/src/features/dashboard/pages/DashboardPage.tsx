import { usePortal } from "@/app/layouts/RoleLayout.tsx";

import { AdminDashboard } from "../components/AdminDashboard.tsx";
import { ParentDashboard } from "../components/ParentDashboard.tsx";
import { TeacherDashboard } from "../components/TeacherDashboard.tsx";

/** "/" renders the dashboard for the signed-in user's role. */
export function DashboardPage() {
  const portal = usePortal();
  if (portal === "teacher") return <TeacherDashboard />;
  if (portal === "parent") return <ParentDashboard />;
  return <AdminDashboard />;
}

export default DashboardPage;
