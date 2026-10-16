// Root ESLint config: the shared SchoolPlatform flat config (packages/config/eslint).
import { createConfig } from "@school-platform/config/eslint";

export default createConfig({ react: true, rootDir: import.meta.dirname });
