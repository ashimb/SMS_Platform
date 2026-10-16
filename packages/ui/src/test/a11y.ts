/**
 * axe-core accessibility assertion for component tests (vitest-axe).
 *
 * Disabled rules, and why:
 * - `color-contrast`: jsdom cannot compute rendered colours. Contrast is covered by the
 *   contrast-validator unit tests and by the Storybook a11y addon (real browser).
 * - `region`: "all content inside landmarks" is a page-level rule; components are tested in
 *   isolation. Pages are checked with it enabled in the app E2E accessibility suite.
 */
import { expect } from "vitest";
import { configureAxe } from "vitest-axe";

const runAxe = configureAxe({
  rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
});

export async function expectNoA11yViolations(node: Element = document.body): Promise<void> {
  const results = await runAxe(node);
  const summary = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes.map((n) => n.target.join(" ")).join(", ")})`,
  );
  expect(summary, "axe accessibility violations").toEqual([]);
}
