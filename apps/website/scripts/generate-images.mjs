/**
 * Generates the placeholder artwork in public/images (hero, gallery, Open Graph) with sharp, so the
 * repository ships no stock photography and the demo site still looks finished.
 *
 *   node scripts/generate-images.mjs
 *
 * Output is deterministic (seeded) JPEG. Replace the files, or point the CMS at real media, for a
 * real school. Nothing here runs at build or runtime.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const OUT = fileURLToPath(new URL("../public/images/", import.meta.url));

/** Small seeded PRNG (mulberry32) so regenerated images are byte-stable. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTES = {
  campus: {
    top: "#0b3b45",
    mid: "#1f8a8a",
    bottom: "#f4d9a6",
    hill: ["#0f5c4d", "#0a4a3f"],
    ink: "#fff7e6",
  },
  library: {
    top: "#2a1f5c",
    mid: "#6b5bd6",
    bottom: "#f3c6a1",
    hill: ["#3b2f86", "#2a1f5c"],
    ink: "#fff3e0",
  },
  stage: {
    top: "#3a0f2e",
    mid: "#b8325f",
    bottom: "#ffb36b",
    hill: ["#6d1a3f", "#4a1230"],
    ink: "#fff1dc",
  },
  science: {
    top: "#06304a",
    mid: "#1789b8",
    bottom: "#b8f0e0",
    hill: ["#0d5f7a", "#093f55"],
    ink: "#e9fffa",
  },
  sport: {
    top: "#0b3d2e",
    mid: "#2fa36b",
    bottom: "#f6e58d",
    hill: ["#1d7a4f", "#135a3a"],
    ink: "#fffbe0",
  },
  art: {
    top: "#40204f",
    mid: "#e0568a",
    bottom: "#ffd58a",
    hill: ["#8f3a78", "#632a58"],
    ink: "#fff0f3",
  },
  robot: {
    top: "#0a1f44",
    mid: "#2f6fe0",
    bottom: "#a8e1ff",
    hill: ["#1b4aa3", "#123577"],
    ink: "#eaf6ff",
  },
};

function hills(w, h, colors, rand) {
  return colors
    .map((color, i) => {
      const base = h * (0.68 + i * 0.1);
      const amp = h * (0.07 - i * 0.015);
      const phase = rand() * Math.PI * 2;
      const points = [];
      for (let x = 0; x <= w; x += w / 24) {
        const y = base + Math.sin((x / w) * Math.PI * (2 + i) + phase) * amp;
        points.push(`${x.toFixed(0)},${y.toFixed(0)}`);
      }
      return `<polygon fill="${color}" points="0,${h} ${points.join(" ")} ${w},${h}"/>`;
    })
    .join("");
}

function building(w, h, ink) {
  const bw = w * 0.34;
  const bh = h * 0.26;
  const x = w * 0.6;
  const y = h * 0.66 - bh;
  const windows = [];
  for (let r = 0; r < 2; r += 1) {
    for (let c = 0; c < 6; c += 1) {
      windows.push(
        `<rect x="${(x + bw * 0.08 + c * bw * 0.15).toFixed(0)}" y="${(y + bh * 0.2 + r * bh * 0.38).toFixed(0)}" width="${(bw * 0.09).toFixed(0)}" height="${(bh * 0.22).toFixed(0)}" rx="3" fill="${ink}" opacity="0.85"/>`,
      );
    }
  }
  return `
    <rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" fill="#0a2c33" opacity="0.92"/>
    <polygon points="${(x - bw * 0.04).toFixed(0)},${y.toFixed(0)} ${(x + bw / 2).toFixed(0)},${(y - bh * 0.45).toFixed(0)} ${(x + bw * 1.04).toFixed(0)},${y.toFixed(0)}" fill="#0a2c33"/>
    ${windows.join("")}
    <rect x="${(x + bw * 0.44).toFixed(0)}" y="${(y + bh * 0.62).toFixed(0)}" width="${(bw * 0.12).toFixed(0)}" height="${(bh * 0.38).toFixed(0)}" rx="4" fill="${ink}" opacity="0.9"/>`;
}

function trees(w, h, rand, count) {
  let out = "";
  for (let i = 0; i < count; i += 1) {
    const x = rand() * w * 0.55;
    const y = h * (0.7 + rand() * 0.16);
    const r = h * (0.04 + rand() * 0.05);
    out += `<rect x="${(x - r * 0.08).toFixed(0)}" y="${y.toFixed(0)}" width="${(r * 0.16).toFixed(0)}" height="${(r * 0.9).toFixed(0)}" fill="#0a2c33" opacity="0.8"/>
      <circle cx="${x.toFixed(0)}" cy="${(y - r * 0.2).toFixed(0)}" r="${r.toFixed(0)}" fill="#0c4a3a" opacity="0.9"/>`;
  }
  return out;
}

/** A simple motif per activity, drawn with basic shapes in the palette's ink colour. */
function motif(kind, w, h, rand, ink) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const unit = Math.min(w, h);
  switch (kind) {
    case "library": {
      let books = "";
      for (let i = 0; i < 9; i += 1) {
        const bw = unit * (0.05 + rand() * 0.03);
        const bh = unit * (0.22 + rand() * 0.14);
        books += `<rect x="${(cx - unit * 0.34 + i * unit * 0.075).toFixed(0)}" y="${(cy + unit * 0.2 - bh).toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" rx="4" fill="${ink}" opacity="${(0.5 + rand() * 0.4).toFixed(2)}"/>`;
      }
      return books;
    }
    case "stage":
      return `<polygon points="${cx},${cy - unit * 0.3} ${cx - unit * 0.34},${cy + unit * 0.3} ${cx + unit * 0.34},${cy + unit * 0.3}" fill="${ink}" opacity="0.22"/>
        <circle cx="${cx}" cy="${cy - unit * 0.05}" r="${unit * 0.09}" fill="${ink}" opacity="0.9"/>
        <rect x="${cx - unit * 0.05}" y="${cy + unit * 0.04}" width="${unit * 0.1}" height="${unit * 0.22}" rx="${unit * 0.04}" fill="${ink}" opacity="0.9"/>`;
    case "science":
      return `<path d="M${cx - unit * 0.05} ${cy - unit * 0.28} h${unit * 0.1} v${unit * 0.2} l${unit * 0.18} ${unit * 0.34} h${-unit * 0.46} l${unit * 0.18} ${-unit * 0.34} Z" fill="${ink}" opacity="0.85"/>
        <circle cx="${cx + unit * 0.12}" cy="${cy - unit * 0.18}" r="${unit * 0.03}" fill="${ink}" opacity="0.6"/>
        <circle cx="${cx + unit * 0.2}" cy="${cy - unit * 0.28}" r="${unit * 0.02}" fill="${ink}" opacity="0.5"/>`;
    case "sport": {
      let lanes = "";
      for (let i = 0; i < 4; i += 1) {
        lanes += `<ellipse cx="${cx}" cy="${cy + unit * 0.1}" rx="${unit * (0.5 - i * 0.06)}" ry="${unit * (0.2 - i * 0.025)}" fill="none" stroke="${ink}" stroke-width="3" opacity="0.5"/>`;
      }
      return (
        lanes +
        `<circle cx="${cx + unit * 0.2}" cy="${cy - unit * 0.1}" r="${unit * 0.05}" fill="${ink}" opacity="0.95"/>`
      );
    }
    case "art": {
      let blobs = "";
      for (let i = 0; i < 6; i += 1) {
        blobs += `<circle cx="${(cx + (rand() - 0.5) * unit * 0.7).toFixed(0)}" cy="${(cy + (rand() - 0.5) * unit * 0.4).toFixed(0)}" r="${(unit * (0.05 + rand() * 0.07)).toFixed(0)}" fill="${ink}" opacity="${(0.35 + rand() * 0.5).toFixed(2)}"/>`;
      }
      return blobs;
    }
    case "robot":
      return `<rect x="${cx - unit * 0.14}" y="${cy - unit * 0.18}" width="${unit * 0.28}" height="${unit * 0.24}" rx="${unit * 0.05}" fill="${ink}" opacity="0.9"/>
        <circle cx="${cx - unit * 0.06}" cy="${cy - unit * 0.07}" r="${unit * 0.03}" fill="#0a1f44"/>
        <circle cx="${cx + unit * 0.06}" cy="${cy - unit * 0.07}" r="${unit * 0.03}" fill="#0a1f44"/>
        <rect x="${cx - unit * 0.1}" y="${cy + unit * 0.08}" width="${unit * 0.2}" height="${unit * 0.18}" rx="${unit * 0.03}" fill="${ink}" opacity="0.75"/>
        <line x1="${cx}" y1="${cy - unit * 0.18}" x2="${cx}" y2="${cy - unit * 0.27}" stroke="${ink}" stroke-width="5"/>
        <circle cx="${cx}" cy="${cy - unit * 0.29}" r="${unit * 0.02}" fill="${ink}"/>`;
    default:
      return "";
  }
}

function svgScene({ w, h, palette, seed, kind }) {
  const rand = rng(seed);
  const p = PALETTES[palette];
  const sunX = w * (0.15 + rand() * 0.4);
  const sunY = h * (0.22 + rand() * 0.12);
  const scenery = kind === "campus";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${p.top}"/>
        <stop offset="0.55" stop-color="${p.mid}"/>
        <stop offset="1" stop-color="${p.bottom}"/>
      </linearGradient>
      <radialGradient id="glow" cx="${sunX}" cy="${sunY}" r="${h * 0.7}" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="${p.ink}" stop-opacity="0.75"/>
        <stop offset="0.35" stop-color="${p.ink}" stop-opacity="0.18"/>
        <stop offset="1" stop-color="${p.ink}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#sky)"/>
    <rect width="${w}" height="${h}" fill="url(#glow)"/>
    <circle cx="${sunX}" cy="${sunY}" r="${h * 0.07}" fill="${p.ink}" opacity="0.95"/>
    ${hills(w, h, p.hill, rand)}
    ${scenery ? building(w, h, p.ink) + trees(w, h, rand, 9) : motif(kind, w, h, rand, p.ink)}
  </svg>`;
}

async function render(name, spec) {
  const svg = svgScene(spec);
  const buffer = await sharp(Buffer.from(svg))
    .jpeg({ quality: 72, mozjpeg: true, chromaSubsampling: "4:2:0" })
    .toBuffer();
  await writeFile(`${OUT}${name}.jpg`, buffer);
  console.log(`${name}.jpg  ${spec.w}x${spec.h}  ${(buffer.length / 1024).toFixed(0)} KB`);
}

await mkdir(OUT, { recursive: true });
await render("hero", { w: 1920, h: 1080, palette: "campus", seed: 7, kind: "campus" });
await render("og", { w: 1200, h: 630, palette: "campus", seed: 11, kind: "campus" });
const gallery = [
  ["gallery-1", "library"],
  ["gallery-2", "stage"],
  ["gallery-3", "science"],
  ["gallery-4", "sport"],
  ["gallery-5", "art"],
  ["gallery-6", "robot"],
];
for (const [index, [name, kind]] of gallery.entries()) {
  await render(name, { w: 1200, h: 800, palette: kind, seed: 100 + index, kind });
}
