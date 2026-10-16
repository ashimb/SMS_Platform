/** tsc does not emit .d.ts inputs; copy the generated schema next to the compiled client. */
import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
mkdirSync(`${root}dist/generated`, { recursive: true });
copyFileSync(`${root}src/generated/schema.d.ts`, `${root}dist/generated/schema.d.ts`);
console.log("copied schema.d.ts to dist/generated");
