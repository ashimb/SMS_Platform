/**
 * Role codes and which portal experience (layout, navigation, dashboard) each one gets.
 *
 * API system roles today: admin, principal, teacher, viewer (apps/api/app/modules/rbac/constants.py).
 * "parent"/"guardian" are the FRD's PAR role, which the API adds with the guardians module.
 */
export const ROLES = {
  admin: "admin",
  principal: "principal",
  teacher: "teacher",
  parent: "parent",
  guardian: "guardian",
  viewer: "viewer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export type PortalKind = "admin" | "teacher" | "parent";

export const PORTAL_ROLES: Record<PortalKind, readonly string[]> = {
  admin: [ROLES.admin, ROLES.principal],
  teacher: [ROLES.teacher],
  parent: [ROLES.parent, ROLES.guardian],
};

/** The portal for a user's roles; staff roles win over parent roles. Null: no portal access. */
export function portalFor(roles: readonly string[]): PortalKind | null {
  const kinds: PortalKind[] = ["admin", "teacher", "parent"];
  return kinds.find((kind) => PORTAL_ROLES[kind].some((role) => roles.includes(role))) ?? null;
}
