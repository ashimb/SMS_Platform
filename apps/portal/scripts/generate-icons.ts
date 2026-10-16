/**
 * Renders the PWA PNG icons from public/icons/favicon.svg with Playwright's Chromium.
 *
 *   npx playwright install chromium        (once; or set BROWSER_CHANNEL=chrome to use Chrome)
 *   node scripts/generate-icons.ts
 *
 * Outputs icon-192.png, icon-512.png, icon-maskable-512.png (glyph inside the 80% safe zone)
 * and apple-touch-icon.png (180 px, opaque). Re-run when the default brand mark changes.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const iconsDir = fileURLToPath(new URL("../public/icons/", import.meta.url));
const svg = readFileSync(`${iconsDir}favicon.svg`, "utf8");
const glyph = /<path[^>]*\/>/.exec(svg)?.[0];
if (!glyph) throw new Error("favicon.svg has no <path> glyph");

const BRAND = "#4f46e5";

function standard(): string {
  return svg;
}

/** Full-bleed background, glyph scaled to 60% so it stays inside the maskable safe zone. */
function maskable(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="${BRAND}"/>
  <g transform="translate(12.8 12.8) scale(0.6)">${glyph}</g>
</svg>`;
}

const outputs: [file: string, size: number, markup: string][] = [
  ["icon-192.png", 192, standard()],
  ["icon-512.png", 512, standard()],
  ["icon-maskable-512.png", 512, maskable()],
  ["apple-touch-icon.png", 180, maskable()],
];

const channel = process.env["BROWSER_CHANNEL"];
const browser = await chromium.launch(channel ? { channel } : {});
try {
  for (const [file, size, markup] of outputs) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    const sized = markup.replace("<svg ", `<svg width="${size}" height="${size}" `);
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${sized}</body></html>`,
    );
    await page.locator("svg").screenshot({ path: `${iconsDir}${file}`, omitBackground: true });
    await page.close();
    console.log(`wrote public/icons/${file} (${size}px)`);
  }
} finally {
  await browser.close();
}
