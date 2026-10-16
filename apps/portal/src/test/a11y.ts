/**
 * axe-core assertion for page tests (vitest-axe).
 *
 * Only `color-contrast` is disabled: jsdom cannot compute rendered colours (contrast is covered
 * by the UI package's token/brand validator tests and real-browser Lighthouse/Storybook checks).
 * Unlike component tests, `region` stays ON here: pages render inside their real layouts, so
 * all content must sit in landmarks.
 */
import { expect } from "vitest";
import { configureAxe } from "vitest-axe";

const runAxe = configureAxe({ rules: { "color-contrast": { enabled: false } } });

export async function expectNoA11yViolations(node: Element = document.body): Promise<void> {
  const results = await runAxe(node);
  const summary = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes.map((n) => n.target.join(" ")).join(", ")})`,
  );
  expect(summary, "axe accessibility violations").toEqual([]);
}
