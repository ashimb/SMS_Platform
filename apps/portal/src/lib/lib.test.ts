import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ageOn, formatDate, formatINR, toAppLocale } from "@/shared/utils/format.ts";

import { ApiError, toApiError } from "./api.ts";
import { readPreference, writePreference } from "./preferences.ts";
import { captureResetToken, clearResetToken, getResetToken } from "./reset-token.ts";

describe("formatINR (decimal strings, never floats)", () => {
  it.each([
    ["1234567.5", {}, "₹12,34,567.50"],
    ["12500.00", {}, "₹12,500"],
    ["12500", { alwaysPaise: true }, "₹12,500.00"],
    ["0.10", {}, "₹0.10"],
    ["99999999999999999.99", {}, "₹99,99,99,99,99,99,99,999.99"],
    ["not money", {}, "—"],
  ] as const)("%s -> %s", (amount, options, expected) => {
    expect(formatINR(amount, options)).toBe(expected);
  });

  it("keeps Latin digits for the Bengali locale", () => {
    expect(formatINR("123456.50", { locale: "bn" })).toBe("₹1,23,456.50");
    expect(formatDate("2026-06-05", "bn")).toBe("5 জুন 2026");
  });
});

describe("dates", () => {
  it("formats API dates without time-zone shifts", () => {
    expect(formatDate("2026-06-05")).toBe("5 Jun 2026");
    expect(formatDate(null)).toBe("—");
  });

  it("computes age in whole years", () => {
    expect(ageOn("2015-06-02", "2021-06-01")).toBe(5);
    expect(ageOn("2015-06-01", "2021-06-01")).toBe(6);
  });

  it("maps i18n languages to formatting locales", () => {
    expect(toAppLocale("bn")).toBe("bn");
    expect(toAppLocale("bn-IN")).toBe("bn");
    expect(toAppLocale("fr")).toBe("en");
  });
});

describe("ApiError", () => {
  it("reads the API error envelope, trace id and field errors", () => {
    const error = toApiError(
      {
        error: {
          code: "VALIDATION_FAILED",
          message: "The request is invalid.",
          details: [
            {
              field: "first_name",
              code: "value_error",
              message: "Value error, Name may contain letters only.",
            },
          ],
          trace_id: "t-1",
        },
      },
      new Response(null, { status: 422 }),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, code: "VALIDATION_FAILED", traceId: "t-1" });
    expect(error.fieldErrors()).toEqual({ first_name: "Name may contain letters only." });
  });

  it("falls back to the X-Request-ID header for the trace id", () => {
    const error = toApiError(
      null,
      new Response(null, { status: 502, headers: { "X-Request-ID": "edge-9" } }),
    );
    expect(error).toMatchObject({ code: "HTTP_ERROR", traceId: "edge-9" });
  });
});

describe("password-reset token handling", () => {
  afterEach(() => {
    clearResetToken();
    window.history.replaceState(null, "", "/");
  });

  it("moves the token out of the URL into memory before the app makes requests", () => {
    window.history.replaceState(null, "", "/reset-password?token=abcDEF123456_-xyz7890&x=1");
    captureResetToken();
    expect(getResetToken()).toBe("abcDEF123456_-xyz7890");
    expect(window.location.search).toBe("?x=1");
  });

  it("ignores tokens elsewhere and drops malformed ones", () => {
    window.history.replaceState(null, "", "/login?token=abcDEF123456_-xyz7890");
    captureResetToken();
    expect(getResetToken()).toBeNull();

    window.history.replaceState(null, "", "/reset-password?token=%3Cscript%3E");
    captureResetToken();
    expect(getResetToken()).toBeNull();
    expect(window.location.search).toBe("");
  });
});

describe("CSP nonce bootstrap (public/csp-nonce.js)", () => {
  const script = readFileSync(resolve(process.cwd(), "public/csp-nonce.js"), "utf8");

  function run(nonce: string) {
    const doc = document.implementation.createHTMLDocument();
    const meta = doc.createElement("meta");
    meta.name = "csp-nonce";
    meta.content = nonce;
    doc.head.append(meta);
    const win = { __webpack_nonce__: undefined as string | undefined };
    // Evaluate the classic script against an isolated document/window (test-only).
    // eslint-disable-next-line no-new-func -- evaluates our own static public/csp-nonce.js
    new Function("document", "window", script)(doc, win);
    return { doc, win };
  }

  it("stamps the nonce on script-created <style> elements only", () => {
    const { doc, win } = run("0123456789abcdef0123456789abcdef");
    expect(win.__webpack_nonce__).toBe("0123456789abcdef0123456789abcdef");
    expect(doc.createElement("style").getAttribute("nonce")).toBe(
      "0123456789abcdef0123456789abcdef",
    );
    expect(doc.createElement("div").hasAttribute("nonce")).toBe(false);
  });

  it("does nothing when nginx did not substitute a nonce (dev server)", () => {
    const { doc, win } = run("__CSP_NONCE__");
    expect(win.__webpack_nonce__).toBeUndefined();
    expect(doc.createElement("style").hasAttribute("nonce")).toBe(false);
  });
});

describe("preferences", () => {
  it("stores only whitelisted, non-sensitive values", () => {
    writePreference("sp-lang", "bn");
    expect(readPreference("sp-lang")).toBe("bn");
    writePreference("sp-lang", "<x>" as "bn");
    expect(readPreference("sp-lang")).toBe("bn");
    window.localStorage.setItem("sp-color-mode", "evil");
    expect(readPreference("sp-color-mode")).toBeNull();
  });
});
