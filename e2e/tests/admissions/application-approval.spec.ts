import { test } from "../../fixtures/index.ts";

// Blocked on the admissions module (apps/api/app/modules/admissions has no endpoints yet).
test.fixme("admission application -> approval", async () => {
  // 1. A guardian opens /admissions on the website and sends an enquiry (becomes a lead).
  // 2. An admissions officer signs in to the portal and opens Admissions -> Enquiries.
  // 3. They convert the lead into an application for "Class VI" and request documents.
  // 4. The guardian uploads the documents through the application link they were emailed.
  // 5. The officer reviews the application, records the assessment result and approves it.
  // 6. Expect: the application status is "Approved", a student record is created in Students
  //    with an admission number, and the guardian receives an approval email.
  // 7. Expect: the audit log shows who approved the application and when.
});
