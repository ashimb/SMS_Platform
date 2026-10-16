/**
 * Staff data access. TODO(staff phase): add list/detail queries and mutations here once the API
 * exposes the STF module (FRD §4, module STF), following features/students/api.
 */
export const staffKeys = {
  all: ["staff"] as const,
  list: (page: number) => ["staff", "list", page] as const,
};
