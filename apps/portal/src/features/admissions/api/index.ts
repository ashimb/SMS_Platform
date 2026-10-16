/**
 * Admissions data access. TODO(admissions phase): add list/detail queries and mutations here once the API
 * exposes the ADM module (FRD §4, module ADM), following features/students/api.
 */
export const admissionsKeys = {
  all: ["admissions"] as const,
  list: (page: number) => ["admissions", "list", page] as const,
};
