import type { ApiError } from "@/lib/api.ts";

/**
 * User-facing sign-in failure categories. Deliberately coarse: an unknown email, a wrong password,
 * a locked or a disabled account all map to "invalid" so the UI never reveals which accounts
 * exist (FRD FR-AUTH-001 AC-2).
 */
export type AuthFailure =
  "invalid" | "rateLimited" | "offline" | "mfaInvalid" | "mfaExpired" | "unknown";

export interface AuthErrorView {
  kind: AuthFailure;
  /** Support reference for unexpected failures only. */
  traceId: string | null;
}

export type { ApiError };
