/**
 * Fees data access. TODO(fees phase): add list/detail queries and mutations here once the API
 * exposes the FIN module (FRD §4, module FIN), following features/students/api.
 */
export const feesKeys = {
  all: ["fees"] as const,
  list: (page: number) => ["fees", "list", page] as const,
};
