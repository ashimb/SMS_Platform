/**
 * Password-reset calls (FRD FR-AUTH-005). Endpoints are typed in lib/pending-api.ts until the API
 * implements them (docs/DEFERRED.md); MSW serves them in dev and tests.
 */
import { ApiError, unwrap } from "@/lib/api.ts";
import { api } from "@/lib/auth-store.ts";

import type { AuthErrorView } from "../types.ts";

/** Always resolves the same way for known and unknown accounts (the API answers 202 for both). */
export async function requestPasswordReset(identifier: string): Promise<void> {
  await unwrap(api.POST("/api/v1/auth/password/forgot", { body: { identifier } }));
}

export async function resetPassword(input: {
  token: string;
  password: string;
  mfaCode?: string | undefined;
}): Promise<void> {
  await unwrap(
    api.POST("/api/v1/auth/password/reset", {
      body: {
        token: input.token,
        new_password: input.password,
        ...(input.mfaCode ? { mfa_code: input.mfaCode } : {}),
      },
    }),
  );
}

/** Map any auth error to a non-enumerating category. */
export function describeAuthError(error: unknown): AuthErrorView {
  if (!(error instanceof ApiError)) return { kind: "unknown", traceId: null };
  if (error.status === 0) return { kind: "offline", traceId: null };
  if (error.status === 429) return { kind: "rateLimited", traceId: null };
  if (error.code === "MFA_INVALID") return { kind: "mfaInvalid", traceId: null };
  if (error.code === "MFA_EXPIRED") return { kind: "mfaExpired", traceId: null };
  if (error.status === 401 || error.status === 423 || error.status === 422) {
    return { kind: "invalid", traceId: null };
  }
  return { kind: "unknown", traceId: error.traceId };
}
