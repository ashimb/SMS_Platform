/**
 * Permission checks for showing or hiding UI. The API enforces the same permissions on every
 * request; these hooks only keep users from seeing actions that would be refused.
 */
import { useAuth } from "@/lib/auth-store.ts";
import type { Permission } from "@/shared/constants/permissions.ts";

export type PermissionMode = "all" | "any";

export function hasPermissions(
  granted: readonly string[] | undefined,
  required: Permission | readonly Permission[],
  mode: PermissionMode = "all",
): boolean {
  const list: readonly Permission[] = typeof required === "string" ? [required] : required;
  if (!granted || list.length === 0) return false;
  return mode === "all"
    ? list.every((p) => granted.includes(p))
    : list.some((p) => granted.includes(p));
}

export function usePermission(
  required: Permission | readonly Permission[],
  mode: PermissionMode = "all",
): boolean {
  const granted = useAuth((state) => state.user?.permissions);
  return hasPermissions(granted, required, mode);
}

export function useHasRole(roles: readonly string[]): boolean {
  const userRoles = useAuth((state) => state.user?.roles);
  return Boolean(userRoles?.some((role) => roles.includes(role)));
}
