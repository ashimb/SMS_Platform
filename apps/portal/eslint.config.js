// ESLint 10 resolves the nearest config per file, so this file governs apps/portal (root `npm run
// lint` included). Rules come from the shared config: TypeScript strict, React hooks, jsx-a11y,
// import order, and the security bans (eval, javascript: URLs, dangerouslySetInnerHTML).
import { createConfig } from "@school-platform/config/eslint";

export default createConfig({
  react: true,
  rootDir: import.meta.dirname,
  ignores: ["dev-dist/**"],
});
