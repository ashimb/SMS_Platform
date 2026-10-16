/**
 * MSW request handlers: an in-memory stand-in for the API, used by the dev server
 * (VITE_API_MOCKING) and by tests. Behaviour mirrors the real API where it exists: the error
 * envelope, generic 401s for bad credentials, CSRF header on cookie endpoints, permission checks
 * (403), and 404 for unknown records.
 *
 * The refresh-token "cookie" is simulated by an in-memory session (an HttpOnly cookie cannot be
 * set by a mock), so nothing is written to document.cookie or web storage even in dev.
 */
import { delay, http, HttpResponse, type RequestHandler } from "msw";

import type { Schemas } from "@/lib/api.ts";

import {
  adminDashboard,
  makeStudents,
  MOCK_MFA_CODE,
  MOCK_PASSWORD,
  type MockUser,
  parentDashboard,
  teacherDashboard,
  tenant,
  users,
  VALID_RESET_TOKEN,
} from "./data.ts";

const API = "/api/v1";

interface MockState {
  students: Schemas["StudentOut"][];
  /** Simulated refresh-cookie session (the signed-in user's email). */
  session: string | null;
  accessTokens: Map<string, string>;
  mfaTokens: Map<string, string>;
  refreshCount: number;
}

export const mockState: MockState = {
  students: makeStudents(),
  session: null,
  accessTokens: new Map(),
  mfaTokens: new Map(),
  refreshCount: 0,
};

export function resetMockState(): void {
  mockState.students = makeStudents();
  mockState.session = null;
  mockState.accessTokens.clear();
  mockState.mfaTokens.clear();
  mockState.refreshCount = 0;
}

/** Start a server-side session as if the refresh cookie were present (tests: "already signed in"). */
export function mockSignedIn(email: string): void {
  mockState.session = email;
}

let tokenCounter = 0;
function token(prefix: string): string {
  tokenCounter += 1;
  return `${prefix}.${String(Date.now())}.${String(tokenCounter)}.mock-signature-0123456789`;
}

function error(status: number, code: string, message: string, details: unknown[] = []) {
  return HttpResponse.json(
    { error: { code, message, details, trace_id: `mock-${code.toLowerCase()}-${String(status)}` } },
    { status },
  );
}

function findUser(email: string | null): MockUser | undefined {
  return users.find((u) => u.me.email === email);
}

function issue(email: string) {
  const access = token("at");
  mockState.accessTokens.set(access, email);
  mockState.session = email;
  return {
    status: "ok" as const,
    access_token: access,
    token_type: "bearer" as const,
    expires_in: 600,
  };
}

function principal(request: Request): MockUser | null {
  const header = request.headers.get("Authorization") ?? "";
  const email = mockState.accessTokens.get(header.replace(/^Bearer /, ""));
  return findUser(email ?? null) ?? null;
}

type Guarded = (user: MockUser) => Response | Promise<Response>;

function requirePermission(request: Request, permission: string | null, handler: Guarded) {
  const user = principal(request);
  if (!user) return error(401, "UNAUTHENTICATED", "Authentication required.");
  if (permission && !user.me.permissions.includes(permission)) {
    return error(403, "FORBIDDEN", "You do not have permission to perform this action.");
  }
  return handler(user);
}

const authHandlers: RequestHandler[] = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    await delay();
    const body = (await request.json()) as { email?: string; password?: string };
    const user = findUser(body.email?.trim().toLowerCase() ?? null);
    // Same response for unknown users and wrong passwords (no enumeration).
    if (!user || body.password !== MOCK_PASSWORD) {
      return error(401, "INVALID_CREDENTIALS", "The email or password is incorrect.");
    }
    if (user.me.mfa_enabled) {
      const mfa = token("mfa");
      mockState.mfaTokens.set(mfa, user.me.email);
      return HttpResponse.json({ status: "mfa_required", mfa_token: mfa, expires_in: 300 });
    }
    return HttpResponse.json(issue(user.me.email));
  }),

  http.post(`${API}/auth/mfa/challenge`, async ({ request }) => {
    await delay();
    const body = (await request.json()) as { mfa_token?: string; code?: string };
    const email = mockState.mfaTokens.get(body.mfa_token ?? "");
    if (!email)
      return error(401, "INVALID_TOKEN", "Your session has expired. Please sign in again.");
    if (body.code !== MOCK_MFA_CODE)
      return error(401, "MFA_INVALID", "The verification code is incorrect.");
    mockState.mfaTokens.delete(body.mfa_token ?? "");
    return HttpResponse.json(issue(email));
  }),

  http.post(`${API}/auth/refresh`, async ({ request }) => {
    await delay();
    mockState.refreshCount += 1;
    if (request.headers.get("X-SP-CSRF") !== "1")
      return error(403, "CSRF_FAILED", "Missing CSRF header.");
    if (!mockState.session)
      return error(401, "INVALID_TOKEN", "Your session has expired. Please sign in again.");
    return HttpResponse.json(issue(mockState.session));
  }),

  http.post(`${API}/auth/logout`, ({ request }) => {
    if (request.headers.get("X-SP-CSRF") !== "1")
      return error(403, "CSRF_FAILED", "Missing CSRF header.");
    mockState.session = null;
    const header = request.headers.get("Authorization") ?? "";
    mockState.accessTokens.delete(header.replace(/^Bearer /, ""));
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/auth/me`, ({ request }) =>
    requirePermission(request, null, (user) => HttpResponse.json(user.me)),
  ),

  http.get(`${API}/tenant`, () => HttpResponse.json(tenant)),
];

const studentHandlers: RequestHandler[] = [
  http.get(`${API}/students`, async ({ request }) => {
    await delay();
    return requirePermission(request, "students.profile.read", () => {
      const url = new URL(request.url);
      const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
      const pageSize = Math.min(200, Math.max(1, Number(url.searchParams.get("page_size") ?? 50)));
      const q = (url.searchParams.get("q") ?? "").toLocaleLowerCase();
      const status = url.searchParams.get("status");
      if (q && q.length < 2) {
        return error(422, "VALIDATION_FAILED", "The request is invalid.", [
          {
            field: "q",
            code: "string_too_short",
            message: "String should have at least 2 characters",
          },
        ]);
      }
      const matches = mockState.students.filter((s) => {
        const name = [s.first_name, s.middle_name, s.last_name]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase();
        return (
          (!q || name.includes(q) || s.admission_no.toLocaleLowerCase().includes(q)) &&
          (!status || s.status === status)
        );
      });
      const items = matches.slice((page - 1) * pageSize, page * pageSize);
      return HttpResponse.json({
        items,
        total: matches.length,
        page,
        page_size: pageSize,
        pages: Math.ceil(matches.length / pageSize),
      });
    });
  }),

  http.get(`${API}/students/:id`, async ({ request, params }) => {
    await delay();
    return requirePermission(request, "students.profile.read", () => {
      const student = mockState.students.find((s) => s.id === params["id"]);
      return student
        ? HttpResponse.json(student)
        : error(404, "NOT_FOUND", "The requested resource was not found.");
    });
  }),

  http.post(`${API}/students`, async ({ request }) => {
    await delay();
    const body = (await request.json()) as Schemas["StudentCreate"];
    return requirePermission(request, "students.profile.create", () => {
      if (mockState.students.some((s) => s.admission_no === body.admission_no)) {
        return error(
          409,
          "DUPLICATE_ADMISSION_NO",
          "A student with this admission number already exists.",
        );
      }
      const now = new Date().toISOString();
      const student: Schemas["StudentOut"] = {
        id: crypto.randomUUID(),
        admission_no: body.admission_no,
        first_name: body.first_name,
        middle_name: body.middle_name ?? null,
        last_name: body.last_name ?? null,
        date_of_birth: body.date_of_birth,
        gender: body.gender,
        admission_date: body.admission_date,
        status: "provisional",
        current_grade: body.current_grade ?? null,
        section: body.section ?? null,
        created_at: now,
        updated_at: now,
      };
      mockState.students.unshift(student);
      return HttpResponse.json(student, { status: 201 });
    });
  }),

  http.patch(`${API}/students/:id`, async ({ request, params }) => {
    await delay();
    const body = (await request.json()) as Schemas["StudentUpdate"];
    return requirePermission(request, "students.profile.update", () => {
      const index = mockState.students.findIndex((s) => s.id === params["id"]);
      const current = mockState.students[index];
      if (!current) return error(404, "NOT_FOUND", "The requested resource was not found.");
      const updated: Schemas["StudentOut"] = {
        ...current,
        ...Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)),
        updated_at: new Date().toISOString(),
      };
      mockState.students[index] = updated;
      return HttpResponse.json(updated);
    });
  }),
];

/** Endpoints the API does not implement yet (lib/pending-api.ts). */
export const pendingHandlers: RequestHandler[] = [
  http.get(`${API}/dashboards/:role`, async ({ request, params }) => {
    await delay();
    return requirePermission(request, null, () => {
      const role = params["role"];
      if (role === "admin") return HttpResponse.json(adminDashboard());
      if (role === "teacher") return HttpResponse.json(teacherDashboard());
      if (role === "parent") return HttpResponse.json(parentDashboard());
      return error(404, "NOT_FOUND", "The requested resource was not found.");
    });
  }),

  http.post(`${API}/auth/password/forgot`, async () => {
    await delay();
    return new HttpResponse(null, { status: 202 });
  }),

  http.post(`${API}/auth/password/reset`, async ({ request }) => {
    await delay();
    const body = (await request.json()) as { token?: string; new_password?: string };
    if (body.token !== VALID_RESET_TOKEN) {
      return error(410, "RESET_TOKEN_INVALID", "This reset link has expired or was already used.");
    }
    if ((body.new_password ?? "").toLowerCase().includes("password")) {
      return error(422, "PASSWORD_BREACHED", "The request is invalid.", [
        {
          field: "new_password",
          code: "password_breached",
          message: "This password is too common.",
        },
      ]);
    }
    return new HttpResponse(null, { status: 204 });
  }),
];

export const handlers: RequestHandler[] = [...authHandlers, ...studentHandlers, ...pendingHandlers];

export function handlersFor(mode: "all" | "pending"): RequestHandler[] {
  return mode === "all" ? handlers : pendingHandlers;
}
