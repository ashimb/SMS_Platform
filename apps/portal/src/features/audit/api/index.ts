/**
 * Audit data access. TODO(audit phase): add list/detail queries and mutations here once the API
 * exposes the AUD module (FRD §4, module AUD), following features/students/api.
 */
export const auditKeys = {
  all: ["audit"] as const,
  list: (page: number) => ["audit", "list", page] as const,
};
