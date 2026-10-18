import { test } from "../../fixtures/index.ts";

// Blocked on the exams module and PDF generation.
test.fixme("exam entry -> report card publish", async () => {
  // 1. A teacher enters marks for an assessment; marks above the maximum are rejected.
  // 2. The exam coordinator locks the marks and generates report cards for the class.
  // 3. Before publishing, the parent portal shows no results for the term.
  // 4. The coordinator publishes the term; publishing needs a second approver (maker-checker).
  // 5. Expect: the parent can open and download the report card PDF for their own child only.
  // 6. Expect: editing a locked mark afterwards requires a recorded, audited reason.
});
