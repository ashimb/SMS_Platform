/**
 * Communication data access. TODO(communication phase): add list/detail queries and mutations here once the API
 * exposes the COM module (FRD §4, module COM), following features/students/api.
 */
export const communicationKeys = {
  all: ["communication"] as const,
  list: (page: number) => ["communication", "list", page] as const,
};
