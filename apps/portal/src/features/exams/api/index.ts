/**
 * Exams data access. TODO(exams phase): add list/detail queries and mutations here once the API
 * exposes the EXM module (FRD §4, module EXM), following features/students/api.
 */
export const examsKeys = {
  all: ["exams"] as const,
  list: (page: number) => ["exams", "list", page] as const,
};
