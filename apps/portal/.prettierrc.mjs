// Shared Prettier config; Tailwind class sorting reads the portal's stylesheet so token
// utilities (bg-surface, text-fg-muted, ...) sort like core utilities.
import base from "@school-platform/config/prettier";

export default { ...base, tailwindStylesheet: "./src/styles/index.css" };
