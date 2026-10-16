// Shared Prettier config. The Tailwind plugin sorts class names in JSX and in cn()/cva() calls.
// Consumers must set `tailwindStylesheet` relative to their own Prettier config file (Tailwind v4
// reads the theme from that CSS entry point), e.g. the repo root prettier.config.js.

/** @type {import("prettier").Config & { tailwindFunctions?: string[] }} */
const config = {
  printWidth: 100,
  singleQuote: false,
  trailingComma: "all",
  endOfLine: "lf",
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindFunctions: ["cn", "cva", "clsx"],
};

export default config;
