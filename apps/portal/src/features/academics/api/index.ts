/**
 * Academics data access. TODO(academics phase): add list/detail queries and mutations here once the API
 * exposes the ACA module (FRD §4, module ACA), following features/students/api.
 */
export const academicsKeys = {
  all: ["academics"] as const,
  list: (page: number) => ["academics", "list", page] as const,
};
