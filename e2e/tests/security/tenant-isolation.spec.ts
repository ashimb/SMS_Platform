import {
  apiLogin,
  bearer,
  expect,
  GENERIC_LOGIN_ERROR,
  PASSWORD,
  STUDENTS,
  test,
  tokenFor,
  USERS,
  WEBSITE_URL,
} from "../../fixtures/index.ts";
import { LoginPage } from "../../pages/LoginPage.ts";

/**
 * Tenant isolation through the real edge.
 *
 * Host-based tenant resolution is not implemented yet (docs/DEFERRED.md P2-20): every request
 * resolves to the default tenant. A tenant B session therefore cannot exist on tenant A's host at
 * all, so the checks are run in both directions: A cannot read B's record by id or by search, and
 * B's administrator cannot sign in here. The API's own suite (tests/tenant_isolation) covers
 * B-token-on-A-resource with forged tenant claims.
 */
test.describe("tenant isolation", () => {
  test("a tenant A admin cannot fetch a tenant B student by id (404, not 403)", async ({
    request,
  }) => {
    const token = await tokenFor(request, "admin");
    const response = await request.get(`${WEBSITE_URL}/api/v1/students/${STUDENTS.b.id}`, {
      headers: bearer(token),
    });

    expect(response.status()).toBe(404);
    const text = await response.text();
    expect(text).not.toContain(STUDENTS.b.admissionNo);
    expect(text).not.toContain("Bela");
  });

  test("a tenant B student never appears in tenant A searches", async ({ request }) => {
    const token = await tokenFor(request, "admin");
    const response = await request.get(`${WEBSITE_URL}/api/v1/students?q=Banerjee`, {
      headers: bearer(token),
    });

    expect(response.status()).toBe(200);
    expect(await response.text()).not.toContain(STUDENTS.b.admissionNo);
  });

  test("control: the same call for tenant A's own student succeeds", async ({ request }) => {
    const token = await tokenFor(request, "admin");
    const response = await request.get(`${WEBSITE_URL}/api/v1/students/${STUDENTS.a.id}`, {
      headers: bearer(token),
    });

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain(STUDENTS.a.admissionNo);
  });

  test("a tenant B administrator cannot sign in on tenant A", async ({ request }) => {
    const result = await apiLogin(request, USERS.tenantBAdmin.email, PASSWORD);
    expect(result.status).toBe(401);
    expect(result.accessToken).toBeNull();
  });

  test("the sign-in form gives a tenant B administrator the generic error", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(USERS.tenantBAdmin.email, PASSWORD);
    await expect(login.alert).toContainText(GENERIC_LOGIN_ERROR);
  });

  test("tenant identity cannot be chosen by the client (header and query are ignored)", async ({
    request,
  }) => {
    const token = await tokenFor(request, "admin");
    const response = await request.get(
      `${WEBSITE_URL}/api/v1/students/${STUDENTS.b.id}?tenant_id=x`,
      {
        headers: {
          ...bearer(token),
          "X-Tenant-ID": "isolation-test",
          "X-Forwarded-Host": "isolation-test",
        },
      },
    );
    expect(response.status()).toBe(404);
  });
});
