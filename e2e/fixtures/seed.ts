/**
 * Accounts and records created by `apps/api/scripts/seed_e2e.py`. Keep both files in sync.
 *
 * "parent" is a `viewer` (no data permissions): the API has no parent/guardian role until the
 * guardians module exists, and a viewer exercises the same deny-by-default paths.
 */
export const PASSWORD = process.env["E2E_PASSWORD"] ?? "Gv-E2e-9fK2!xQw7";

export const USERS = {
  admin: { email: "admin@greenvalley.example.com", role: "admin" },
  teacher: { email: "teacher@greenvalley.example.com", role: "teacher" },
  parent: { email: "parent@greenvalley.example.com", role: "viewer" },
  mfa: { email: "mfa@greenvalley.example.com", role: "admin" },
  lockout: { email: "lockout@greenvalley.example.com", role: "teacher" },
  tenantBAdmin: { email: "admin@isolation.example.com", role: "admin" },
} as const;

export type UserKey = keyof typeof USERS;

export const STUDENTS = {
  /** Belongs to the default tenant. */
  a: { id: "01920000-0000-7000-8000-00000000a001", admissionNo: "E2E-A-001", name: "Asha Verma" },
  /** Belongs to the second tenant; the default tenant must never see it. */
  b: {
    id: "01920000-0000-7000-8000-00000000b001",
    admissionNo: "E2E-B-001",
    name: "Bela Banerjee",
  },
} as const;

/** Public website (and the API, which the edge serves on every host). */
export const WEBSITE_URL = process.env["E2E_BASE_URL"] ?? "https://localhost";
/** Portal SPA on the `portal.` subdomain. */
export const PORTAL_URL = process.env["E2E_PORTAL_URL"] ?? "https://portal.localhost";

export const GENERIC_LOGIN_ERROR = /email or password is incorrect/i;
