/**
 * Shows the route only to users holding one of `roles`; everyone else sees the 403 page.
 * UX only: the backend is the real gate and refuses the underlying API calls regardless.
 */
import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";

import { ForbiddenPage } from "@/app/pages/ForbiddenPage.tsx";
import { useHasRole } from "@/shared/hooks/usePermission.ts";

export function RequireRole({
  roles,
  children,
}: {
  roles: readonly string[];
  children?: ReactNode;
}) {
  const allowed = useHasRole(roles);
  if (!allowed) return <ForbiddenPage />;
  return children ?? <Outlet />;
}
