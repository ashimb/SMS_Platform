// Repository Prettier config: shared defaults plus the Tailwind v4 stylesheet used for class
// sorting (paths are relative to this file).
import base from "@school-platform/config/prettier";

/** @type {import("prettier").Config} */
export default {
  ...base,
  tailwindStylesheet: "./packages/ui/src/styles/index.css",
};
