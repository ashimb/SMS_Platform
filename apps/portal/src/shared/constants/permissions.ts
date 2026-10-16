/**
 * Permission codes, mirroring the API catalogue (apps/api/app/core/permissions.py `P`).
 *
 * The portal uses them only to decide what to *show*. The API checks the same permission on every
 * request, so hiding a button is a convenience, never the security boundary.
 */
export const PERMISSIONS = {
  tenantRead: "tenants.profile.read",
  tenantUpdate: "tenants.profile.update",
  usersRead: "users.account.read",
  usersCreate: "users.account.create",
  usersUpdate: "users.account.update",
  rolesRead: "rbac.role.read",
  rolesAssign: "rbac.role.assign",
  auditRead: "audit.log.read",
  studentsRead: "students.profile.read",
  studentsCreate: "students.profile.create",
  studentsUpdate: "students.profile.update",
  studentsDelete: "students.profile.delete",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
