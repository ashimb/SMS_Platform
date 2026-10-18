import {
  bearer,
  expect,
  PORTAL_URL,
  STUDENTS,
  test,
  tokenFor,
  WEBSITE_URL,
} from "../../fixtures/index.ts";

const STUDENTS_API = `${WEBSITE_URL}/api/v1/students`;

test.describe("students list: API authorization", () => {
  test("loads for an admin", { tag: "@smoke" }, async ({ request }) => {
    const token = await tokenFor(request, "admin");
    const response = await request.get(STUDENTS_API, { headers: bearer(token) });

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain(STUDENTS.a.admissionNo);
  });

  test("loads for a teacher, who holds the read permission", async ({ request }) => {
    const token = await tokenFor(request, "teacher");
    const response = await request.get(STUDENTS_API, { headers: bearer(token) });
    expect(response.status()).toBe(200);
  });

  test(
    "is forbidden for a parent (no data permissions), without leaking any record",
    {
      tag: "@smoke",
    },
    async ({ request }) => {
      const token = await tokenFor(request, "parent");
      const response = await request.get(STUDENTS_API, { headers: bearer(token) });

      expect(response.status()).toBe(403);
      expect(await response.text()).not.toContain(STUDENTS.a.admissionNo);
    },
  );

  test("requires authentication", async ({ request }) => {
    const response = await request.get(STUDENTS_API);
    expect(response.status()).toBe(401);
  });

  test("a parent cannot create students either (deny by default)", async ({ request }) => {
    const token = await tokenFor(request, "parent");
    const response = await request.post(STUDENTS_API, {
      headers: bearer(token),
      data: {
        admission_no: "HACK-1",
        first_name: "Eve",
        date_of_birth: "2015-01-01",
        gender: "female",
        admission_date: "2026-01-01",
      },
    });
    expect(response.status()).toBe(403);
  });
});

test.describe("students list: portal UI", () => {
  test("an admin sees the seeded student", async ({ page, signedInAs }) => {
    await signedInAs("admin");
    await page.goto(`${PORTAL_URL}/students`);

    await expect(page.getByText(STUDENTS.a.admissionNo)).toBeVisible();
  });

  test("a parent account never sees student records", async ({ page, signedInAs }) => {
    await signedInAs("parent");
    await page.goto(`${PORTAL_URL}/students`);

    await expect(page.getByText(STUDENTS.a.admissionNo)).toHaveCount(0);
    await expect(page.getByText(/isn't set up yet|don't have access/i)).toBeVisible();
  });
});
