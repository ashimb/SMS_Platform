import { type APIRequestContext, expect } from "@playwright/test";

import { PASSWORD, type UserKey, USERS, WEBSITE_URL } from "./seed.ts";

export interface LoginResult {
  status: number;
  accessToken: string | null;
  mfaRequired: boolean;
}

/** Sign in through the API. The edge serves /api on every host, so the website origin is enough. */
export async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<LoginResult> {
  const response = await request.post(`${WEBSITE_URL}/api/v1/auth/login`, {
    data: { email, password },
  });
  if (response.status() !== 200)
    return { status: response.status(), accessToken: null, mfaRequired: false };
  const body = (await response.json()) as { access_token?: string; mfa_token?: string };
  return {
    status: 200,
    accessToken: body.access_token ?? null,
    mfaRequired: typeof body.mfa_token === "string",
  };
}

/** A fresh session for a seeded user (a new login each time: refresh tokens rotate and are single-use). */
export async function tokenFor(request: APIRequestContext, user: UserKey): Promise<string> {
  const result = await apiLogin(request, USERS[user].email, PASSWORD);
  expect(result.status, `sign-in as ${user} (was the stack seeded with seed_e2e?)`).toBe(200);
  expect(result.accessToken).toBeTruthy();
  return result.accessToken as string;
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
