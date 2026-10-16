/**
 * Attendance data access. TODO(attendance phase): add list/detail queries and mutations here once the API
 * exposes the ATT module (FRD §4, module ATT), following features/students/api.
 */
export const attendanceKeys = {
  all: ["attendance"] as const,
  list: (page: number) => ["attendance", "list", page] as const,
};
