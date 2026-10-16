# @school-platform/config

Shared configuration for every TypeScript workspace.

| Export | Use |
|---|---|
| `@school-platform/config/tsconfig/base.json` | Strict base: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, bundler resolution |
| `@school-platform/config/tsconfig/react.json` | Base + DOM libs + `react-jsx` (UI package, Vite portal) |
| `@school-platform/config/tsconfig/next.json` | React + Next.js plugin, `jsx: preserve` (website) |
| `@school-platform/config/eslint` | `createConfig({ react })`: typescript-eslint strict + stylistic, react-hooks, jsx-a11y (strict), simple-import-sort, no `dangerouslySetInnerHTML` |
| `@school-platform/config/prettier` | Prettier defaults + Tailwind class sorting (also inside `cn()`/`cva()`) |
| `@school-platform/config/tailwind/app.css` | Tailwind v4 entry for apps: tokens, theme mapping, dark variant, UI package source scanning |

The a11y rules come from `eslint-plugin-jsx-a11y-x`, the es-tooling maintained fork of
`eslint-plugin-jsx-a11y`. The original doesn't support ESLint 10 yet.
