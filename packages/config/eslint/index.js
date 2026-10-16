// Shared ESLint flat config for SchoolPlatform TypeScript/React code.
//
//   import { createConfig } from "@school-platform/config/eslint";
//   export default createConfig({ react: true });
//
// Includes: @eslint/js recommended, typescript-eslint strict + stylistic, React hooks rules,
// JSX accessibility rules (eslint-plugin-jsx-a11y-x, the maintained fork of jsx-a11y that
// supports ESLint 10), and deterministic import ordering (simple-import-sort).
import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export const defaultIgnores = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
  "**/storybook-static/**",
  "**/playwright-report/**",
  "**/test-results/**",
  "**/src/generated/**",
  "apps/api/**",
];

/**
 * @param {{ react?: boolean, ignores?: string[], rootDir?: string }} [options]
 *   rootDir: directory of the calling eslint.config.js (pass `import.meta.dirname`). Required
 *   once several configs exist in the repo, so typescript-eslint resolves the right tsconfig.
 * @returns {import("typescript-eslint").ConfigArray}
 */
export function createConfig(options = {}) {
  const { react = true, ignores = [], rootDir } = options;

  return tseslint.config(
    { ignores: [...defaultIgnores, ...ignores] },
    js.configs.recommended,
    ...tseslint.configs.strict,
    ...tseslint.configs.stylistic,
    {
      languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ...(rootDir ? { parserOptions: { tsconfigRootDir: rootDir } } : {}),
        globals: { ...globals.browser, ...globals.node },
      },
      plugins: { "simple-import-sort": simpleImportSort },
      rules: {
        "simple-import-sort/imports": "error",
        "simple-import-sort/exports": "error",
        "@typescript-eslint/consistent-type-imports": [
          "error",
          { fixStyle: "inline-type-imports" },
        ],
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
        // Security-relevant defaults (FRD FR-SEC-018/019).
        "no-eval": "error",
        "no-implied-eval": "error",
        "no-new-func": "error",
        "no-script-url": "error",
      },
    },
    ...(react
      ? [
          reactHooks.configs.flat["recommended-latest"],
          jsxA11y.configs.strict,
          {
            files: ["**/*.{jsx,tsx}"],
            rules: {
              // Raw HTML injection is banned; render sanitised content through a dedicated
              // reviewed component only (FRD FR-SEC-018).
              "no-restricted-syntax": [
                "error",
                {
                  selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
                  message: "dangerouslySetInnerHTML is not allowed (XSS risk).",
                },
              ],
            },
          },
        ]
      : []),
  );
}

export default createConfig();
