/**
 * Timetable data access. TODO(timetable phase): add list/detail queries and mutations here once the API
 * exposes the TT module (FRD §4, module TT), following features/students/api.
 */
export const timetableKeys = {
  all: ["timetable"] as const,
  list: (page: number) => ["timetable", "list", page] as const,
};
