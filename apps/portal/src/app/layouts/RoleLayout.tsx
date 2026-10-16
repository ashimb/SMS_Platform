import { NoAccessPage } from "@/app/pages/NoAccessPage.tsx";
import { useAuth } from "@/lib/auth-store.ts";
import { portalFor } from "@/shared/constants/roles.ts";

import { AdminLayout } from "./AdminLayout.tsx";
import { ParentLayout } from "./ParentLayout.tsx";
import { TeacherLayout } from "./TeacherLayout.tsx";

/** Picks the layout for the signed-in user's role; URLs stay the same across roles. */
export function RoleLayout() {
  const roles = useAuth((state) => state.user?.roles);
  const portal = portalFor(roles ?? []);
  if (portal === "admin") return <AdminLayout />;
  if (portal === "teacher") return <TeacherLayout />;
  if (portal === "parent") return <ParentLayout />;
  return <NoAccessPage />;
}

export function usePortal() {
  const roles = useAuth((state) => state.user?.roles);
  return portalFor(roles ?? []);
}
