import type { ReactNode } from "react";

import type { Permission } from "@/shared/constants/permissions.ts";
import { type PermissionMode, usePermission } from "@/shared/hooks/usePermission.ts";

export interface CanProps {
  /** Permission code(s) from the API catalogue. */
  permission: Permission | readonly Permission[];
  /** "all" (default): every permission is required; "any": one is enough. */
  mode?: PermissionMode;
  /** Rendered when the user lacks the permission (default: nothing). */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Renders `children` only for users holding the permission(s).
 *
 * This is a UX convenience, NOT access control: the backend is the real gate. It checks the same
 * permission on every request and refuses it (403) whatever the UI shows, so a user who reveals a
 * hidden button through dev tools still gets nothing.
 */
export function Can({ permission, mode = "all", fallback = null, children }: CanProps) {
  return usePermission(permission, mode) ? children : fallback;
}
