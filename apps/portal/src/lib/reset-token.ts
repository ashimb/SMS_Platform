/**
 * Password-reset token handling (FRD FR-AUTH-005 security notes).
 *
 * The reset link carries a one-time token in the query string. It is moved into memory and
 * stripped from the address bar *before the app makes any request*, so it never appears in a
 * Referer header, server log, browser history entry or screenshot of the URL bar.
 * main.tsx calls `captureResetToken()` first thing.
 */
export const RESET_PATH = "/reset-password";

let captured: string | null = null;

export function captureResetToken(win: Window = window): void {
  const url = new URL(win.location.href);
  if (url.pathname !== RESET_PATH || !url.searchParams.has("token")) return;
  const token = url.searchParams.get("token") ?? "";
  // Shape check only (the API validates): 256-bit tokens, URL-safe base64 or hex.
  captured = /^[A-Za-z0-9_-]{16,256}$/.test(token) ? token : null;
  url.searchParams.delete("token");
  win.history.replaceState(win.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

export function getResetToken(): string | null {
  return captured;
}

/** Forget the token once it has been used (or rejected as expired). */
export function clearResetToken(): void {
  captured = null;
}
