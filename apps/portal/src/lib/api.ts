/**
 * Portal API access: the typed client factory and a uniform error type.
 *
 * The client instance lives with the auth store (src/lib/auth-store.ts), which owns the access
 * token. Feature code imports `api` from "@/lib/auth-store" and unwraps results with `unwrap()`,
 * so every failure becomes an `ApiError` carrying the API's error code and trace id.
 */
import {
  type ApiClient,
  type ApiClientOptions,
  type components,
  createApiClient,
  type GetToken,
  type OnRefresh,
  type paths,
} from "@school-platform/api-client";

import type { PendingPaths } from "./pending-api.ts";

export type PortalPaths = paths & PendingPaths;
export type PortalApi = ApiClient<PortalPaths>;
export type Schemas = components["schemas"];

export function createPortalApi(
  getToken: GetToken,
  onRefresh: OnRefresh,
  options: ApiClientOptions = {},
): PortalApi {
  // Same origin in every environment (nginx in production, the Vite proxy in dev).
  return createApiClient<PortalPaths>(window.location.origin, getToken, onRefresh, options);
}

export interface ApiErrorDetail {
  field: string | null;
  code: string;
  message: string;
}

/** A failed API call. `traceId` is shown to users so support can find the request in logs. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: readonly ApiErrorDetail[];
  readonly traceId: string | null;

  constructor(init: {
    status: number;
    code: string;
    message: string;
    details?: readonly ApiErrorDetail[];
    traceId?: string | null;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details ?? [];
    this.traceId = init.traceId ?? null;
  }

  /** Map validation details onto form fields: { admission_no: "message", ... }. */
  fieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const detail of this.details) {
      if (detail.field && !(detail.field in result)) {
        result[detail.field] = detail.message.replace(/^Value error, /, "");
      }
    }
    return result;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function toApiError(body: unknown, response: Response): ApiError {
  const envelope = isRecord(body) && isRecord(body["error"]) ? body["error"] : null;
  const rawDetails = envelope && Array.isArray(envelope["details"]) ? envelope["details"] : [];
  const details = rawDetails.filter(isRecord).map((d) => ({
    field: typeof d["field"] === "string" ? d["field"] : null,
    code: typeof d["code"] === "string" ? d["code"] : "invalid",
    message: typeof d["message"] === "string" ? d["message"] : "Invalid value.",
  }));
  const traceId =
    (envelope && typeof envelope["trace_id"] === "string" ? envelope["trace_id"] : null) ??
    response.headers.get("X-Request-ID");
  return new ApiError({
    status: response.status,
    code: envelope && typeof envelope["code"] === "string" ? envelope["code"] : "HTTP_ERROR",
    message:
      envelope && typeof envelope["message"] === "string"
        ? envelope["message"]
        : `Request failed (${String(response.status)})`,
    details,
    traceId,
  });
}

interface FetchResult<T> {
  data?: T;
  error?: unknown;
  response: Response;
}

/** Resolve an openapi-fetch call to its data, or throw an `ApiError`. */
export async function unwrap<T>(call: Promise<FetchResult<T>>): Promise<T> {
  let result: FetchResult<T>;
  try {
    result = await call;
  } catch (cause) {
    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: cause instanceof Error ? cause.message : "Network request failed",
    });
  }
  if (!result.response.ok) throw toApiError(result.error, result.response);
  return result.data as T;
}

export function isApiError(error: unknown, status?: number): error is ApiError {
  return error instanceof ApiError && (status === undefined || error.status === status);
}
