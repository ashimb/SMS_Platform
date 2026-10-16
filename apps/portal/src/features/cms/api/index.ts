/**
 * Cms data access. TODO(cms phase): add list/detail queries and mutations here once the API
 * exposes the CMS module (FRD §4, module CMS), following features/students/api.
 */
export const cmsKeys = {
  all: ["cms"] as const,
  list: (page: number) => ["cms", "list", page] as const,
};
