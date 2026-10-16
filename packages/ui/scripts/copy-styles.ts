/** Copies the generated token stylesheets into dist/styles for consumers. */
import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
mkdirSync(`${root}dist/styles`, { recursive: true });
for (const file of ["tokens.css", "theme.css", "index.css"]) {
  copyFileSync(`${root}src/styles/${file}`, `${root}dist/styles/${file}`);
}
console.log("copied styles to dist/styles");
