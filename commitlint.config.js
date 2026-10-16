// Conventional Commits (https://www.conventionalcommits.org).
// Example: "feat(api): add tenant context dependency"
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 100],
    "scope-enum": [
      1,
      "always",
      [
        "api",
        "worker",
        "portal",
        "website",
        "ui",
        "api-client",
        "config",
        "e2e",
        "infra",
        "ci",
        "docs",
        "deps",
        "security",
        "repo",
      ],
    ],
  },
};
