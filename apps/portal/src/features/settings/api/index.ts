/**
 * Settings data access. TODO(settings phase): add list/detail queries and mutations here once the API
 * exposes the CFG / TEN module (FRD §4, module CFG / TEN), following features/students/api.
 */
export const settingsKeys = {
  all: ["settings"] as const,
  list: (page: number) => ["settings", "list", page] as const,
};
