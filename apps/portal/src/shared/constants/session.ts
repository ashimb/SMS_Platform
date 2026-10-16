/**
 * Client-side session timing (FRD §3.1 / FR-SEC-007).
 *
 * Staff roles default to a 60-minute idle timeout with a warning two minutes before. Per-role
 * values (accountants 30 min) and server-side idle enforcement arrive with auth hardening
 * (docs/DEFERRED.md P2-09); the client timer is a usability feature, the API remains the gate.
 */
export const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
export const IDLE_WARNING_MS = 2 * 60 * 1000;

/** Debounce for search inputs (FRD UX: results update while typing, without a request per key). */
export const SEARCH_DEBOUNCE_MS = 300;

export const DEFAULT_PAGE_SIZE = 25;
