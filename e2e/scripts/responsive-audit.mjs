#!/usr/bin/env node
/**
 * Responsive audit (RESPONSIVE / MOBILE-FIRST STANDARD, Phase 6).
 *
 * Measure (needs the stack running behind the edge proxy, and optionally a Storybook build):
 *   node e2e/scripts/responsive-audit.mjs --out results.json [--stories packages/ui/storybook-static]
 *        [--only site|portal|stories]
 * Report:
 *   node e2e/scripts/responsive-audit.mjs --report results.json --md docs/ui/responsive-audit.md
 *        [--baseline docs/ui/responsive-audit.baseline.json]
 *
 * Every website route, every portal route per role (plus open overlays) and every Storybook story is
 * loaded at 320, 375, 414, 768, 1024 and 1440 px (portrait) and 667x375 and 896x414 (phone
 * landscape). For each page it records: horizontal overflow, elements wider than the viewport,
 * touch targets under 44 px, inputs under 16 px on phones, tables on phones, images without
 * dimensions or `sizes`, fixed/sticky bars without safe-area handling, overlapping text, and the
 * viewport meta. Static greps add `100vh` usage and hover-only reveals.
 *
 * Environment: E2E_BASE_URL (default https://localhost:8443), E2E_PORTAL_URL (default
 * https://portal.localhost:8443), E2E_PASSWORD. Browsers resolve *.localhost on their own.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SITE = process.env["E2E_BASE_URL"] ?? "https://localhost:8443";
const PORTAL = process.env["E2E_PORTAL_URL"] ?? "https://portal.localhost:8443";
const PASSWORD = process.env["E2E_PASSWORD"] ?? "Gv-E2e-9fK2!xQw7";
const STUDENT_A = "01920000-0000-7000-8000-00000000a001";

const VIEWPORTS = [
  { w: 320, h: 640, label: "320" },
  { w: 375, h: 667, label: "375" },
  { w: 414, h: 896, label: "414" },
  { w: 768, h: 1024, label: "768" },
  { w: 1024, h: 768, label: "1024" },
  { w: 1440, h: 900, label: "1440" },
  { w: 667, h: 375, label: "375L" },
  { w: 896, h: 414, label: "414L" },
];

const SITE_ROUTES = [
  "/",
  "/about",
  "/admissions",
  "/notices",
  "/notices/diwali-holidays",
  "/events",
  "/events/annual-day-2026",
  "/gallery",
  "/contact",
  "/facilities",
  "/privacy-policy",
  "/this-page-does-not-exist",
];
const PORTAL_ANON = ["/login", "/forgot-password", "/reset-password"];
const MODULES = [
  "/guardians",
  "/staff",
  "/academics",
  "/timetable",
  "/attendance",
  "/exams",
  "/admissions",
  "/fees",
  "/communication",
  "/cms",
  "/reports",
  "/settings",
  "/audit",
];
const ROLE_ROUTES = {
  admin: {
    email: "admin@greenvalley.example.com",
    routes: [
      "/",
      "/students",
      "/students/new",
      `/students/${STUDENT_A}`,
      `/students/${STUDENT_A}/edit`,
      ...MODULES,
      "/403",
      "/does-not-exist",
    ],
  },
  teacher: {
    email: "teacher@greenvalley.example.com",
    routes: ["/", "/students", "/attendance", "/timetable", "/exams", "/communication"],
  },
  parent: { email: "parent@greenvalley.example.com", routes: ["/"] },
};

// ---------------------------------------------------------------------------------------------
// In-page measurement (must be self-contained: it is serialised into the page)
// ---------------------------------------------------------------------------------------------
function measurePage() {
  const vw = document.documentElement.clientWidth;
  const mobile = vw < 768;
  // Touch screens need 44px targets; a mouse on a wide screen only needs WCAG 2.5.8 AA (24px).
  const minTarget = matchMedia("(pointer: coarse)").matches ? 44 : 24;
  const out = {
    vw,
    overflowX: document.documentElement.scrollWidth - vw,
    offenders: [],
    small: [],
    smallInputs: [],
    tables: [],
    images: [],
    fixedNoSafe: [],
    overlaps: [],
    meta: null,
  };
  const describe = (el) => {
    const tag = el.tagName.toLowerCase();
    const id = el.id && !/^(radix|«|:r)/.test(el.id) ? `#${el.id}` : "";
    const cls =
      typeof el.className === "string"
        ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join(".")
        : "";
    const label = (el.getAttribute("aria-label") || el.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 28);
    return `${tag}${id}${cls ? "." + cls : ""}${label ? ` "${label}"` : ""}`;
  };
  const shown = (el, rect, cs) => {
    // Content of a closed <details> is not rendered (the browser still reports a layout box).
    const closed = el.closest("details:not([open])");
    if (closed && el !== closed && !el.closest("summary")) return false;
    return shown0(el, rect, cs);
  };
  const shown0 = (el, rect, cs) =>
    cs.display !== "none" &&
    cs.visibility !== "hidden" &&
    cs.opacity !== "0" &&
    rect.width > 1 &&
    rect.height > 1;
  const inScroller = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === "auto" || o === "scroll") return true;
    }
    return false;
  };

  const meta = document.querySelector('meta[name="viewport"]');
  out.meta = meta ? meta.getAttribute("content") : null;

  const all = Array.from(document.body.querySelectorAll("*"));

  // An element that sticks out is harmless when an ancestor that clips (overflow hidden/clip)
  // sits inside the viewport, e.g. a decorative blob in an overflow-hidden card.
  const clippedInside = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if ((o === "hidden" || o === "clip") && p.getBoundingClientRect().right <= vw + 1)
        return true;
    }
    return false;
  };

  // 1. Elements wider than the viewport (outside deliberate scroll containers).
  for (const el of all) {
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (!shown(el, rect, cs) || cs.position === "fixed") continue;
    if (rect.right > vw + 1 && !inScroller(el) && !clippedInside(el)) {
      out.offenders.push(describe(el));
      if (out.offenders.length >= 5) break;
    }
  }

  // 2. Touch targets and input font sizes.
  const targetSel =
    "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=menuitem], [role=tab], [role=combobox], [role=checkbox], [role=switch], [role=link]";
  for (const el of document.querySelectorAll(targetSel)) {
    const cs = getComputedStyle(el);
    let rect = el.getBoundingClientRect();
    if (!shown(el, rect, cs)) continue;
    // Skip links and other sr-only helpers are only visible (and sized) while focused.
    if (el.classList.contains("sr-only")) continue;
    // Disabled controls are exempt from the target-size requirement (WCAG 2.5.8 "inactive").
    if (el.matches(":disabled, [aria-disabled=true]")) continue;
    if (rect.right < 0 || rect.left > vw || rect.bottom < 0) continue;
    // A label wrapping/pointing at the control is part of the touch target.
    const labels = "labels" in el && el.labels ? Array.from(el.labels) : [];
    for (const label of labels) {
      const lr = label.getBoundingClientRect();
      if (lr.width >= 44 && lr.height >= 44) rect = lr;
    }
    // A pseudo-element hit area (the kit's touchHitArea) extends the target beyond its box.
    const after = getComputedStyle(el, "::after");
    if (after.position === "absolute" && after.content !== "none") {
      const aw = parseFloat(after.width);
      const ah = parseFloat(after.height);
      if (aw >= rect.width && ah >= rect.height) {
        rect = {
          width: aw,
          height: ah,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      }
    }
    const parentText = (el.parentElement?.textContent ?? "").trim().length;
    const ownText = (el.textContent ?? "").trim().length;
    const inline = el.tagName === "A" && cs.display === "inline" && parentText > ownText + 12;
    if ((rect.width < minTarget - 0.5 || rect.height < minTarget - 0.5) && !inline) {
      out.small.push(`${describe(el)} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
    }
    if (
      mobile &&
      el.matches("input:not([type=checkbox]):not([type=radio]), select, textarea") &&
      parseFloat(cs.fontSize) < 16
    ) {
      out.smallInputs.push(`${describe(el)} ${cs.fontSize}`);
    }
  }

  // 3. Tables on phones.
  if (mobile) {
    for (const table of document.querySelectorAll("table")) {
      const rect = table.getBoundingClientRect();
      const cs = getComputedStyle(table);
      if (!shown(table, rect, cs)) continue;
      const parent = table.parentElement;
      out.tables.push(
        `${describe(table)} width ${Math.round(rect.width)} in ${parent ? parent.clientWidth : "?"}`,
      );
    }
  }

  // 4. Images.
  for (const img of document.querySelectorAll("img")) {
    const rect = img.getBoundingClientRect();
    const cs = getComputedStyle(img);
    if (!shown(img, rect, cs)) continue;
    const fill = img.style.position === "absolute" || img.dataset["nimg"] === "fill";
    const dims = img.hasAttribute("width") && img.hasAttribute("height");
    const wDescriptors = /\d+w/.test(img.getAttribute("srcset") ?? "");
    const src = (img.currentSrc || img.src || "").slice(-40);
    if (!fill && !dims) out.images.push(`no width/height: ${src}`);
    if (wDescriptors && !img.getAttribute("sizes")) out.images.push(`srcset without sizes: ${src}`);
  }

  // 5. Fixed/sticky bars and safe-area handling.
  const safeSelectors = [];
  const walk = (rules) => {
    for (const rule of rules) {
      if (rule.cssRules && rule.cssRules.length) walk(rule.cssRules);
      if (rule.selectorText && rule.style) {
        const text = rule.style.cssText;
        if (text.includes("safe-area") || text.includes("--sp-safe"))
          safeSelectors.push(rule.selectorText);
      }
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules);
    } catch {
      // cross-origin sheet
    }
  }
  const hasSafe = (el) =>
    safeSelectors.some((selector) => {
      try {
        return el.matches(selector);
      } catch {
        return false;
      }
    });
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.position !== "fixed" && cs.position !== "sticky") continue;
    const rect = el.getBoundingClientRect();
    if (!shown(el, rect, cs)) continue;
    // Not edge-anchored chrome: sticky table headers scroll inside their table, bare overlay
    // backdrops carry no content, and dialogs/sheets apply the safe areas in their own padding
    // (asserted in packages/ui/src/components/Responsive.test.tsx).
    if (el.matches("thead, th") || el.closest("thead")) continue;
    if (el.children.length === 0 && el.textContent.trim() === "") continue;
    if (el.matches("[role=dialog]") || el.closest("[role=dialog]")) continue;
    // Popovers are positioned against their trigger, not the screen edge.
    if (el.closest("[role=menu], [role=listbox], [data-radix-popper-content-wrapper]")) continue;
    const bottomAnchored = cs.position === "fixed" && cs.bottom !== "auto" && cs.top === "auto";
    const topAnchored = cs.top !== "auto" && (cs.position === "fixed" || cs.position === "sticky");
    const nested = el.querySelector("*") && Array.from(el.querySelectorAll("*")).some(hasSafe);
    if ((bottomAnchored || topAnchored) && !hasSafe(el) && !nested) {
      out.fixedNoSafe.push(`${describe(el)} (${bottomAnchored ? "bottom" : "top"})`);
    }
  }

  // 6. Overlapping text (leaf elements with their own text). Fixed/sticky bars deliberately sit over
  // scrolling content, and aria-hidden / pointer-events-none text is decorative layering.
  const layered = (el) => {
    for (let p = el; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.position === "fixed" || s.position === "sticky" || s.pointerEvents === "none")
        return true;
      if (p.getAttribute("aria-hidden") === "true") return true;
    }
    return false;
  };
  const leaves = [];
  for (const el of all) {
    if (el.children.length > 0) continue;
    if (!(el.textContent ?? "").trim()) continue;
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (!shown(el, rect, cs) || rect.top > innerHeight * 3 || layered(el)) continue;
    leaves.push({ el, rect });
    if (leaves.length >= 250) break;
  }
  for (let i = 0; i < leaves.length && out.overlaps.length < 3; i += 1) {
    for (let j = i + 1; j < leaves.length; j += 1) {
      const a = leaves[i].rect;
      const b = leaves[j].rect;
      const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ix <= 2 || iy <= 2) continue;
      const smaller = Math.min(a.width * a.height, b.width * b.height);
      if ((ix * iy) / smaller > 0.5 && !leaves[i].el.contains(leaves[j].el)) {
        out.overlaps.push(`${describe(leaves[i].el)} x ${describe(leaves[j].el)}`);
        break;
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Measure mode
// ---------------------------------------------------------------------------------------------
const SEVERITY = {
  overflow: "High",
  table: "High",
  input: "High",
  target: "Medium",
  "safe-area": "Medium",
  overlap: "Medium",
  meta: "Medium",
  image: "Low",
  error: "Info",
};

function issuesFrom(screen, viewport, m) {
  const rows = [];
  const add = (kind, detail, items = []) =>
    rows.push({ screen, viewport, kind, severity: SEVERITY[kind], detail, items });
  if (m.overflowX > 0 || m.offenders.length > 0) {
    add(
      "overflow",
      m.overflowX > 0
        ? `page scrolls horizontally by ${String(m.overflowX)}px`
        : "element wider than the viewport (clipped, page does not scroll)",
      m.offenders.slice(0, 3),
    );
  }
  if (m.small.length > 0)
    add("target", `${m.small.length} target(s) under 44px`, m.small.slice(0, 4));
  if (m.smallInputs.length > 0)
    add("input", "input font-size under 16px", m.smallInputs.slice(0, 2));
  if (m.tables.length > 0)
    add("table", "table on a phone without a card treatment", m.tables.slice(0, 2));
  if (m.images.length > 0) add("image", "image without dimensions or sizes", m.images.slice(0, 2));
  if (m.fixedNoSafe.length > 0)
    add("safe-area", "fixed/sticky bar without safe-area padding", m.fixedNoSafe.slice(0, 3));
  if (m.overlaps.length > 0) add("overlap", "overlapping text", m.overlaps.slice(0, 2));
  // Storybook's preview iframe has no viewport meta of its own; only real pages are checked.
  const isStory = screen.startsWith("ui ");
  if (
    !isStory &&
    (m.meta === null ||
      !/viewport-fit=cover/.test(m.meta) ||
      /user-scalable=no|maximum-scale=1(\.0)?\b/.test(m.meta))
  ) {
    add("meta", `viewport meta: ${m.meta ?? "missing"}`);
  }
  return rows;
}

async function newContext(browser, vp) {
  return browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 2,
    isMobile: Math.min(vp.w, vp.h) < 600 || vp.w <= 1024,
    hasTouch: vp.w < 1440,
    ignoreHTTPSErrors: true,
    reducedMotion: "reduce",
  });
}

async function settle(page, ms = 700) {
  await page.waitForLoadState("load").catch(() => undefined);
  await page.waitForTimeout(ms);
}

async function signIn(page, email) {
  await page.goto(`${PORTAL}/login`, { waitUntil: "load" });
  await page.getByLabel(/^Email/).fill(email);
  await page.getByLabel(/^Password/).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20000 });
  await settle(page, 900);
}

async function clientNavigate(page, route) {
  await page.evaluate((target) => {
    window.history.pushState({}, "", target);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, route);
  await settle(page, 900);
}

async function measureAt(page, screen, vp, rows, results) {
  try {
    const m = await page.evaluate(measurePage, {});
    results.push(...issuesFrom(screen, vp.label, m));
    rows.count += 1;
  } catch (error) {
    results.push({
      screen,
      viewport: vp.label,
      kind: "error",
      severity: "Info",
      detail: String(error).slice(0, 120),
      items: [],
    });
  }
}

async function auditSite(browser, vp, results, counter) {
  const ctx = await newContext(browser, vp);
  const page = await ctx.newPage();
  for (const route of SITE_ROUTES) {
    try {
      await page.goto(`${SITE}${route}`, { waitUntil: "load" });
      await settle(page, 600);
      await measureAt(page, `website ${route}`, vp, counter, results);
    } catch (error) {
      results.push({
        screen: `website ${route}`,
        viewport: vp.label,
        kind: "error",
        severity: "Info",
        detail: String(error).slice(0, 120),
        items: [],
      });
    }
  }
  // Mobile menu open (below lg) and enquiry form with validation errors.
  try {
    await page.goto(`${SITE}/`, { waitUntil: "load" });
    await settle(page, 500);
    const menu = page.getByRole("button", { name: /open menu/i });
    if (await menu.isVisible()) {
      await menu.click();
      await settle(page, 500);
      await measureAt(page, "website mobile menu (open)", vp, counter, results);
    }
    await page.goto(`${SITE}/admissions#enquiry`, { waitUntil: "load" });
    await settle(page, 500);
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await settle(page, 500);
    await measureAt(page, "website enquiry form (validation errors)", vp, counter, results);
  } catch (error) {
    results.push({
      screen: "website overlays",
      viewport: vp.label,
      kind: "error",
      severity: "Info",
      detail: String(error).slice(0, 120),
      items: [],
    });
  }
  await ctx.close();
}

async function auditPortal(browser, vp, results, counter) {
  // Anonymous screens.
  {
    const ctx = await newContext(browser, vp);
    const page = await ctx.newPage();
    for (const route of PORTAL_ANON) {
      try {
        await page.goto(`${PORTAL}${route}`, { waitUntil: "load" });
        await settle(page, 900);
        await measureAt(page, `portal ${route}`, vp, counter, results);
      } catch (error) {
        results.push({
          screen: `portal ${route}`,
          viewport: vp.label,
          kind: "error",
          severity: "Info",
          detail: String(error).slice(0, 120),
          items: [],
        });
      }
    }
    // MFA step.
    try {
      await page.goto(`${PORTAL}/login`, { waitUntil: "load" });
      await page.getByLabel(/^Email/).fill("mfa@greenvalley.example.com");
      await page.getByLabel(/^Password/).fill(PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForURL(/\/login\/mfa/, { timeout: 15000 });
      await settle(page, 700);
      await measureAt(page, "portal /login/mfa", vp, counter, results);
    } catch (error) {
      results.push({
        screen: "portal /login/mfa",
        viewport: vp.label,
        kind: "error",
        severity: "Info",
        detail: String(error).slice(0, 120),
        items: [],
      });
    }
    // Login with an error banner.
    try {
      await page.goto(`${PORTAL}/login`, { waitUntil: "load" });
      await page.getByLabel(/^Email/).fill("admin@greenvalley.example.com");
      await page.getByLabel(/^Password/).fill("wrong-password-for-audit");
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.getByRole("alert").waitFor({ timeout: 10000 });
      await settle(page, 400);
      await measureAt(page, "portal /login (error state)", vp, counter, results);
    } catch (error) {
      results.push({
        screen: "portal /login (error)",
        viewport: vp.label,
        kind: "error",
        severity: "Info",
        detail: String(error).slice(0, 120),
        items: [],
      });
    }
    await ctx.close();
  }

  for (const [role, def] of Object.entries(ROLE_ROUTES)) {
    const ctx = await newContext(browser, vp);
    const page = await ctx.newPage();
    try {
      await signIn(page, def.email);
    } catch (error) {
      results.push({
        screen: `portal ${role} sign-in`,
        viewport: vp.label,
        kind: "error",
        severity: "Info",
        detail: String(error).slice(0, 120),
        items: [],
      });
      await ctx.close();
      continue;
    }
    for (const route of def.routes) {
      try {
        if (route !== "/" || page.url().replace(PORTAL, "") !== "/")
          await clientNavigate(page, route);
        await measureAt(
          page,
          `portal ${role} ${route.replace(STUDENT_A, ":id")}`,
          vp,
          counter,
          results,
        );
      } catch (error) {
        results.push({
          screen: `portal ${role} ${route}`,
          viewport: vp.label,
          kind: "error",
          severity: "Info",
          detail: String(error).slice(0, 120),
          items: [],
        });
      }
    }
    if (role === "admin") {
      try {
        await clientNavigate(page, "/students");
        // Open overlays on the list screen.
        const more = page.getByRole("button", { name: /^more$/i });
        if (await more.isVisible().catch(() => false)) {
          await more.click();
          await settle(page, 500);
          await measureAt(page, "portal admin overlay: More sheet", vp, counter, results);
          await page.keyboard.press("Escape");
          await settle(page, 300);
        }
        await page.getByRole("button", { name: /^Account menu/ }).click();
        await settle(page, 500);
        await measureAt(page, "portal admin overlay: account menu", vp, counter, results);
        await page.keyboard.press("Escape");
        await settle(page, 300);
        await page.keyboard.press("Control+K");
        await settle(page, 500);
        await measureAt(page, "portal admin overlay: command palette", vp, counter, results);
      } catch (error) {
        results.push({
          screen: "portal admin overlays",
          viewport: vp.label,
          kind: "error",
          severity: "Info",
          detail: String(error).slice(0, 120),
          items: [],
        });
      }
    }
    await ctx.close();
  }
}

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".map": "application/json",
};

function serveStatic(dir) {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    let file = path.join(dir, decodeURIComponent(url.pathname));
    if (!file.startsWith(dir)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!existsSync(file)) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function auditStories(browser, vp, results, counter, base, stories) {
  const ctx = await newContext(browser, vp);
  const page = await ctx.newPage();
  for (const story of stories) {
    const screen = `ui ${story.title} / ${story.name}`;
    try {
      await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:light`, {
        waitUntil: "load",
      });
      await page
        .waitForSelector("#storybook-root > *, #storybook-root *", { timeout: 8000 })
        .catch(() => undefined);
      await page.waitForTimeout(500);
      await measureAt(page, screen, vp, counter, results);
    } catch (error) {
      results.push({
        screen,
        viewport: vp.label,
        kind: "error",
        severity: "Info",
        detail: String(error).slice(0, 120),
        items: [],
      });
    }
  }
  await ctx.close();
}

function staticFindings() {
  const findings = [];
  const roots = ["apps/portal/src", "apps/website/src", "packages/ui/src"];
  const run = (pattern) => {
    try {
      return execFileSync("git", ["-C", ROOT, "grep", "-nE", pattern, "--", ...roots], {
        encoding: "utf8",
      })
        .split("\n")
        .filter((line) => line && !/\.(test|stories)\./.test(line));
    } catch {
      return [];
    }
  };
  for (const line of run("100vh|h-screen|min-h-screen|max-h-screen"))
    findings.push({ kind: "100vh", line });
  for (const line of run(
    "group-hover:(opacity-100|visible|block|flex)|(opacity-0|invisible)[^\"']*group-hover",
  )) {
    findings.push({ kind: "hover-only", line });
  }
  for (const line of run("onMouseEnter|onMouseOver")) findings.push({ kind: "hover-only", line });
  return findings;
}

async function measureAll() {
  const only = arg("only", "all");
  const out = arg("out", "responsive-results.json");
  const storiesDir = arg("stories", "");
  const browser = await chromium.launch({
    args: ["--host-resolver-rules=MAP *.localhost 127.0.0.1"],
  });
  const results = [];
  const counter = { count: 0 };
  let storyServer;
  let stories = [];
  let storyBase = "";
  if (storiesDir && (only === "all" || only === "stories")) {
    const dir = path.resolve(ROOT, storiesDir);
    storyServer = await serveStatic(dir);
    storyBase = `http://127.0.0.1:${storyServer.address().port}`;
    const index = JSON.parse(await readFile(path.join(dir, "index.json"), "utf8"));
    stories = Object.values(index.entries).filter((entry) => entry.type === "story");
    console.log(`stories: ${stories.length}`);
  }
  const queue = VIEWPORTS.map((vp) => async () => {
    if (only === "all" || only === "site") await auditSite(browser, vp, results, counter);
    if (only === "all" || only === "portal") await auditPortal(browser, vp, results, counter);
    if (stories.length && (only === "all" || only === "stories"))
      await auditStories(browser, vp, results, counter, storyBase, stories);
    console.log(`done ${vp.label}`);
  });
  // Four viewports at a time.
  const workers = Array.from({ length: 4 }, async () => {
    for (;;) {
      const next = queue.shift();
      if (!next) return;
      await next();
    }
  });
  await Promise.all(workers);
  await browser.close();
  storyServer?.close();
  await mkdir(path.dirname(path.resolve(out)), { recursive: true });
  await writeFile(
    out,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        measurements: counter.count,
        viewports: VIEWPORTS.map((v) => v.label),
        static: staticFindings(),
        rows: results,
      },
      null,
      1,
    ),
  );
  console.log(`wrote ${out}: ${counter.count} measurements, ${results.length} findings`);
}

// ---------------------------------------------------------------------------------------------
// Report mode
// ---------------------------------------------------------------------------------------------
const FIX = {
  overflow:
    "Let flex/grid children shrink (`min-w-0`, `break-words`); scroll wide content in its own `overflow-x-auto` box",
  target:
    "Raise to 44px on touch (`h-11 md:pointer-fine:h-10`) or extend the hit area with padding or a pseudo-element",
  input: "Use 16px text on phones (`text-base md:pointer-fine:text-sm`)",
  table: "Use `ResponsiveDataTable` (stacked cards below `md`, table from `md`)",
  image: "Give `width`/`height` (or `fill` in a sized box) and a correct `sizes`",
  "safe-area": "Add `env(safe-area-inset-*)` padding (`pt-safe` / `pb-safe`)",
  overlap: "Fix stacking/positioning so text does not collide; reserve space for fixed bars",
  meta: "Use `width=device-width, initial-scale=1, viewport-fit=cover` and never lock zoom",
  error: "Audit could not measure this screen; see detail",
};

function signature(row) {
  const first = row.items[0] ?? row.detail;
  if (row.kind === "target") {
    return row.items
      .slice(0, 3)
      .map((i) => i.replace(/ \d+x\d+$/, "").replace(/\s+"[^"]*"/, ""))
      .join(" | ");
  }
  if (row.kind === "overflow") return String(first).replace(/\s+"[^"]*"/, "");
  return String(first).slice(0, 90);
}

function aggregate(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.screen}||${row.kind}||${signature(row)}`;
    const entry = map.get(key) ?? {
      screen: row.screen,
      kind: row.kind,
      severity: row.severity,
      sig: signature(row),
      detail: row.detail,
      items: row.items,
      viewports: new Set(),
    };
    entry.viewports.add(row.viewport);
    map.set(key, entry);
  }
  return map;
}

const order = VIEWPORTS.map((v) => v.label);
const sortVp = (set) => [...set].sort((a, b) => order.indexOf(a) - order.indexOf(b));
const SEV_RANK = { High: 0, Medium: 1, Low: 2, Info: 3 };
const esc = (text) => String(text).replace(/\|/g, "\\|").replace(/\n/g, " ");

async function report() {
  const data = JSON.parse(await readFile(arg("report"), "utf8"));
  const mdPath = arg("md", "docs/ui/responsive-audit.md");
  const baselinePath = arg("baseline", "");
  const current = aggregate(data.rows.filter((r) => r.kind !== "error"));
  const errors = data.rows.filter((r) => r.kind === "error");
  let baseline = null;
  if (baselinePath && existsSync(baselinePath)) {
    const saved = JSON.parse(await readFile(baselinePath, "utf8"));
    if (saved.entries) {
      baseline = new Map(
        saved.entries.map((e) => [e.key, { ...e, viewports: new Set(e.viewports) }]),
      );
    } else {
      baseline = aggregate(saved.rows.filter((r) => r.kind !== "error"));
    }
  }
  const saveTo = arg("save-baseline", "");
  if (saveTo) {
    const entries = [...current.entries()].map(([key, e]) => ({
      key,
      screen: e.screen,
      kind: e.kind,
      severity: e.severity,
      sig: e.sig,
      detail: e.detail,
      items: e.items,
      viewports: [...e.viewports],
    }));
    await mkdir(path.dirname(path.resolve(saveTo)), { recursive: true });
    await writeFile(
      saveTo,
      JSON.stringify(
        { generated: data.generated, measurements: data.measurements, entries },
        null,
        1,
      ),
    );
    console.log(`saved baseline ${saveTo}: ${entries.length} entries`);
  }

  const lines = [];
  const total = (map, sev) => [...map.values()].filter((e) => e.severity === sev).length;
  lines.push("# Responsive audit");
  lines.push("");
  lines.push(
    `Generated ${data.generated.slice(0, 10)} by \`node e2e/scripts/responsive-audit.mjs\` (see the header of that file for the commands). ` +
      `${data.measurements} page measurements at ${data.viewports.join(", ")} px (\`L\` = phone landscape).`,
  );
  lines.push("");
  lines.push(
    "Scope: every public website route, every portal route for the admin, teacher and parent roles (plus the More sheet, account menu, command palette, mobile menu, MFA step and error states), and every `packages/ui` Storybook story.",
  );
  lines.push("");
  lines.push(
    "What is measured: horizontal overflow and elements wider than the viewport; touch targets under 44 px; inputs under 16 px on phones; tables on phones; images without dimensions or `sizes`; fixed/sticky bars without safe-area handling; overlapping text; viewport meta. Spacing between adjacent targets (8 px) is **not** measured automatically.",
  );
  lines.push("");

  if (baseline) {
    const stat = { Resolved: 0, Remaining: 0, New: 0 };
    for (const [key] of baseline) stat[current.has(key) ? "Remaining" : "Resolved"] += 1;
    for (const [key] of current) if (!baseline.has(key)) stat.New += 1;
    lines.push(
      `**Status against the baseline audit:** ${stat.Resolved} resolved, ${stat.Remaining} remaining, ${stat.New} new.`,
    );
    lines.push("");
  }

  lines.push("## Summary");
  lines.push("");
  lines.push("| Severity | Distinct findings (now) |" + (baseline ? " Baseline |" : ""));
  lines.push("|---|---|" + (baseline ? "---|" : ""));
  for (const sev of ["High", "Medium", "Low"]) {
    lines.push(
      `| ${sev} | ${total(current, sev)} |` + (baseline ? ` ${total(baseline, sev)} |` : ""),
    );
  }
  lines.push("");
  const byKind = {};
  for (const entry of current.values()) byKind[entry.kind] = (byKind[entry.kind] ?? 0) + 1;
  const byKindBase = {};
  if (baseline)
    for (const entry of baseline.values())
      byKindBase[entry.kind] = (byKindBase[entry.kind] ?? 0) + 1;
  lines.push("| Issue type | Now |" + (baseline ? " Baseline |" : ""));
  lines.push("|---|---|" + (baseline ? "---|" : ""));
  for (const kind of Object.keys({ ...byKind, ...byKindBase })) {
    lines.push(
      `| ${kind} | ${byKind[kind] ?? 0} |` + (baseline ? ` ${byKindBase[kind] ?? 0} |` : ""),
    );
  }
  lines.push("");

  lines.push("## Static findings");
  lines.push("");
  const vh = data.static.filter((f) => f.kind === "100vh");
  const hover = data.static.filter((f) => f.kind === "hover-only");
  lines.push(
    `- Fixed \`100vh\` / \`h-screen\` / \`min-h-screen\` usages: **${vh.length}**${
      vh.length
        ? "\n" +
          vh
            .slice(0, 8)
            .map((f) => `  - \`${f.line.slice(0, 140)}\``)
            .join("\n")
        : ""
    }`,
  );
  lines.push(
    `- Hover-only reveals (\`group-hover\` visibility toggles, mouse-enter handlers): **${hover.length}**${
      hover.length
        ? "\n" +
          hover
            .slice(0, 8)
            .map((f) => `  - \`${f.line.slice(0, 140)}\``)
            .join("\n")
        : ""
    }`,
  );
  lines.push(
    "- Tailwind v4 wraps every `hover:` utility in `@media (hover: hover)`, so hover styling is already gated for touch devices.",
  );
  lines.push("");

  lines.push("## Remaining items and known limits");
  lines.push("");
  for (const note of [
    "**`ui Data display/DataTable` stories (table on a phone).** The plain `DataTable` is the dense desktop primitive and scrolls inside its own box by design. Applications use `ResponsiveDataTable` (cards below `md`), which the portal students list and the `ui Responsive/ResponsiveDataTable` stories verify. Left as Remaining on purpose, not hidden from the audit.",
    "**Measurement rules.** Touch viewports (up to 1024 px) emulate a coarse pointer and must meet 44 px; a mouse on a 1440 px screen only has to meet the WCAG 2.5.8 minimum of 24 px (the kit uses `md:pointer-fine:` compact sizes). Skip links (`sr-only` until focused), disabled controls, popovers, bare overlay backdrops, sticky table headers, dialogs (safe areas asserted in `Responsive.test.tsx`) and the content of closed `<details>` are not counted.",
    "**Not measured automatically:** the 8 px spacing between adjacent targets, real-device notches and the iOS keyboard, image focal points (reviewed by eye), and the PWA install flow.",
    "**Portal badges on navigation items** (unread counts) are not implemented: no data source exists yet (see docs/DEFERRED.md).",
  ]) {
    lines.push(`- ${note}`);
  }
  lines.push("");

  lines.push("## Findings");
  lines.push("");
  const header =
    "| Screen / component | Viewport | Issue | Severity | Fix |" + (baseline ? " Status |" : "");
  lines.push(header);
  lines.push("|---|---|---|---|---|" + (baseline ? "---|" : ""));
  const merged = new Map(current);
  if (baseline)
    for (const [key, entry] of baseline)
      if (!merged.has(key)) merged.set(key, { ...entry, resolved: true });
  const sorted = [...merged.entries()].sort(
    ([, a], [, b]) =>
      (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9) || a.screen.localeCompare(b.screen),
  );
  for (const [key, entry] of sorted) {
    const issue = `${entry.detail}${
      entry.items.length
        ? `: ${entry.items
            .slice(0, 2)
            .map((i) => `\`${esc(i).slice(0, 90)}\``)
            .join(", ")}`
        : ""
    }`;
    const status = baseline
      ? entry.resolved
        ? "Resolved"
        : baseline.has(key)
          ? "Remaining"
          : "New"
      : "Open";
    lines.push(
      `| ${esc(entry.screen)} | ${sortVp(entry.viewports).join(", ")} | ${esc(issue)} | ${entry.severity} | ${esc(FIX[entry.kind] ?? "")} |${baseline ? ` ${status} |` : ""}`,
    );
  }
  if (errors.length) {
    lines.push("");
    lines.push("## Screens that could not be measured");
    lines.push("");
    const seen = new Set();
    for (const e of errors) {
      const k = `${e.screen}|${e.detail}`;
      if (seen.has(k)) continue;
      seen.add(k);
      lines.push(`- ${e.screen} (${e.viewport}): ${esc(e.detail)}`);
    }
  }
  lines.push("");
  await mkdir(path.dirname(path.resolve(mdPath)), { recursive: true });
  await writeFile(mdPath, lines.join("\n"));
  console.log(`wrote ${mdPath}: ${current.size} findings${baseline ? " (with status)" : ""}`);
}

if (arg("report", "")) await report();
else await measureAll();
