/**
 * Shows the route only to users holding the permission(s); everyone else sees the 403 page.
 * UX only: the backend is the real gate. It checks the same permission on every request
 * (deny by default), so this guard just avoids showing screens that would fail.
 */
import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";

import { ForbiddenPage } from "@/app/pages/ForbiddenPage.tsx";
import type { Permission } from "@/shared/constants/permissions.ts";
import { type PermissionMode, usePermission } from "@/shared/hooks/usePermission.ts";

export function RequirePermission({
  permission,
  mode = "all",
  children,
}: {
  permission: Permission | readonly Permission[];
  mode?: PermissionMode;
  children?: ReactNode;
}) {
  const allowed = usePermission(permission, mode);
  if (!allowed) return <ForbiddenPage />;
  return children ?? <Outlet />;
}
