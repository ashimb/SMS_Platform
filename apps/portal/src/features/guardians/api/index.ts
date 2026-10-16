/**
 * Guardians data access. TODO(guardians phase): add list/detail queries and mutations here once the API
 * exposes the GRD module (FRD §4, module GRD), following features/students/api.
 */
export const guardiansKeys = {
  all: ["guardians"] as const,
  list: (page: number) => ["guardians", "list", page] as const,
};
