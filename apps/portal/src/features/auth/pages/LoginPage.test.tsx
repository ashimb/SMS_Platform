import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { auth } from "@/lib/auth-store.ts";
import { expectNoA11yViolations } from "@/test/a11y.ts";
import { MOCK_MFA_CODE, MOCK_PASSWORD } from "@/test/mocks/data.ts";
import { renderApp } from "@/test/utils.tsx";

async function openLogin(path = "/login") {
  const view = renderApp(path);
  await screen.findByRole("heading", { name: "Sign in", level: 1 });
  return view;
}

describe("LoginPage", () => {
  it("validates on submit with accessible, field-linked errors", async () => {
    const { user } = await openLogin();
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const email = screen.getByLabelText(/^Email/);
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription("Enter your email address.");
    expect(screen.getByLabelText(/^Password/)).toHaveAccessibleDescription("Enter your password.");

    await user.type(email, "not-an-email");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(email).toHaveAccessibleDescription("Enter a valid email address, like name@school.in.");
  });

  it("uses the same generic message for an unknown account and a wrong password", async () => {
    const { user } = await openLogin();
    const email = screen.getByLabelText(/^Email/);
    const password = screen.getByLabelText(/^Password/);

    await user.type(email, "nobody@school.test");
    await user.type(password, "whatever-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    const unknownMessage = (await screen.findByRole("alert")).textContent;

    await user.clear(email);
    await user.type(email, "admin@school.test");
    await user.type(password, "wrong-password-1");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => {
      expect(password).toHaveValue("");
    });
    const wrongPasswordMessage = screen.getByRole("alert").textContent;

    expect(unknownMessage).toContain("The email or password is incorrect");
    expect(wrongPasswordMessage).toBe(unknownMessage);
    // Focus moves to the error banner (FRD FR-AUTH-001 UI).
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveFocus();
    });
  });

  it("signs in and continues to the requested page", async () => {
    const { user, router } = await openLogin(`/login?next=${encodeURIComponent("/students")}`);
    await user.type(screen.getByLabelText(/^Email/), "admin@school.test");
    await user.type(screen.getByLabelText(/^Password/), MOCK_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: "Students", level: 1 })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/students");
  });

  it("asks for the MFA code when the account has two-step verification", async () => {
    const { user, router } = await openLogin();
    await user.type(screen.getByLabelText(/^Email/), "principal@school.test");
    await user.type(screen.getByLabelText(/^Password/), MOCK_PASSWORD);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const code = await screen.findByLabelText(/^Verification code/);
    expect(code).toHaveAttribute("autocomplete", "one-time-code");
    await user.type(code, MOCK_MFA_CODE); // auto-submits at six digits

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(auth.store.getState().status).toBe("authenticated");
  });

  it("explains why the previous session ended", async () => {
    await auth.login("admin@school.test", MOCK_PASSWORD);
    await auth.logout("idle");
    expect(auth.store.getState().endReason).toBe("idle");
    await openLogin();
    expect(screen.getByRole("status")).toHaveTextContent("signed out after a period of inactivity");
  });

  it("has no axe violations", async () => {
    const { container } = await openLogin();
    await expectNoA11yViolations(container);
  });
});
