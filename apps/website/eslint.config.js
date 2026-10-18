// Website lint config: the shared SchoolPlatform rules (TypeScript strict, React hooks, jsx-a11y,
// import order, security bans incl. dangerouslySetInnerHTML) plus the Next.js rules.
//
// eslint-config-next 16 bundles its own copies of the react / react-hooks / jsx-a11y / import
// plugins, declares ESLint <= 9 peers, and clashes with the shared config's plugin instances.
// Only its Next-specific plugin is needed here (the other rule sets are already in the shared
// config), so @next/eslint-plugin-next is used directly. See docs/DEFERRED.md P5-05.
import nextPlugin from "@next/eslint-plugin-next";
import { createConfig } from "@school-platform/config/eslint";

export default [
  ...createConfig({
    react: true,
    rootDir: import.meta.dirname,
    ignores: [".next/**", "next-env.d.ts", "coverage/**"],
  }),
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // App Router only: there is no pages/ directory for this rule to inspect.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];
