import { test } from "../../fixtures/index.ts";

// Blocked on the attendance and guardians modules (no endpoints yet) and a real parent role.
test.fixme("teacher marks attendance -> parent sees it", async () => {
  // 1. A teacher signs in and opens Attendance for their section (e.g. VI-A) for today.
  // 2. They mark one student "Absent" with a reason and submit the register.
  // 3. Expect: submitting twice is idempotent (no duplicate register for the day).
  // 4. The linked parent signs in to the portal and opens the dashboard.
  // 5. Expect: today's attendance for their child shows "Absent" with the reason.
  // 6. Expect: the parent receives an absence notification (email/SMS stub in Mailpit).
  // 7. Expect: a parent of a different child sees nothing about this student.
});
