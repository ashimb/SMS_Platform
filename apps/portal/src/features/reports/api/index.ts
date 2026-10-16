/**
 * Reports data access. TODO(reports phase): add list/detail queries and mutations here once the API
 * exposes the RPT module (FRD §4, module RPT), following features/students/api.
 */
export const reportsKeys = {
  all: ["reports"] as const,
  list: (page: number) => ["reports", "list", page] as const,
};
