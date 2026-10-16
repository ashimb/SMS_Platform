/**
 * Endpoints the portal calls that the API does not serve yet, typed from the FRD contract so the
 * typed client covers them. In dev and tests they are served by MSW (src/test/mocks). When the
 * API implements one, regenerate packages/api-client and delete its entry here: TypeScript then
 * flags any drift between the FRD shape used here and the real schema.
 *
 * - POST /auth/password/forgot  FRD §8 (FR-AUTH-005): always 202, never reveals if the account exists
 * - POST /auth/password/reset   FRD §8 (FR-AUTH-005): 204, or 410 RESET_TOKEN_INVALID
 * - GET  /dashboards/{role}     FRD §8 (FR-RPT-001): role widget data (validated with Zod on read)
 */
import type { components } from "@school-platform/api-client";

type ErrorEnvelope = components["schemas"]["ErrorEnvelope"];

interface NoParams {
  query?: never;
  header?: never;
  path?: never;
  cookie?: never;
}

interface JsonResponse<T> {
  headers: Record<string, unknown>;
  content: { "application/json": T };
}

interface EmptyResponse {
  headers: Record<string, unknown>;
  content?: never;
}

interface PathItem {
  parameters: NoParams;
  get?: never;
  put?: never;
  post?: never;
  delete?: never;
  options?: never;
  head?: never;
  patch?: never;
  trace?: never;
}

export type DashboardRole = "admin" | "teacher" | "parent";

export interface PendingPaths {
  "/api/v1/auth/password/forgot": Omit<PathItem, "post"> & {
    post: {
      parameters: NoParams;
      requestBody: { content: { "application/json": { identifier: string } } };
      responses: {
        202: EmptyResponse;
        422: JsonResponse<ErrorEnvelope>;
        429: JsonResponse<ErrorEnvelope>;
      };
    };
  };
  "/api/v1/auth/password/reset": Omit<PathItem, "post"> & {
    post: {
      parameters: NoParams;
      requestBody: {
        content: {
          "application/json": { token: string; new_password: string; mfa_code?: string };
        };
      };
      responses: {
        204: EmptyResponse;
        410: JsonResponse<ErrorEnvelope>;
        422: JsonResponse<ErrorEnvelope>;
        429: JsonResponse<ErrorEnvelope>;
      };
    };
  };
  "/api/v1/dashboards/{role}": Omit<PathItem, "get" | "parameters"> & {
    parameters: Omit<NoParams, "path"> & { path: { role: DashboardRole } };
    get: {
      parameters: Omit<NoParams, "path"> & { path: { role: DashboardRole } };
      requestBody?: never;
      responses: {
        200: JsonResponse<unknown>;
        401: JsonResponse<ErrorEnvelope>;
        403: JsonResponse<ErrorEnvelope>;
        404: JsonResponse<ErrorEnvelope>;
      };
    };
  };
}
