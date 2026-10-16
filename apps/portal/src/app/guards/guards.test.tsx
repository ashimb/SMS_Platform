import { screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { Can } from "@/shared/components/Can.tsx";
import { PERMISSIONS } from "@/shared/constants/permissions.ts";
import { safeNextPath } from "@/shared/constants/routes.ts";
import { renderApp, renderWithProviders, signInAs } from "@/test/utils.tsx";

import { RequireAuth } from "./RequireAuth.tsx";

describe("RequireAuth", () => {
  it("sends anonymous users to sign-in and remembers where they were going", async () => {
    const { router } = renderApp("/students?status=enrolled");
    expect(await screen.findByRole("heading", { name: "Sign in", level: 1 })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search).toBe(
      `?next=${encodeURIComponent("/students?status=enrolled")}`,
    );
  });

  it("shows a loader (not the page) while the session is being restored", () => {
    // No init(): the session stays "unknown", as while the silent refresh is in flight.
    const router = createMemoryRouter([
      {
        path: "/",
        element: (
          <RequireAuth>
            <p>private page</p>
          </RequireAuth>
        ),
      },
    ]);
    renderWithProviders(<RouterProvider router={router} />);
    expect(screen.getByRole("status")).toHaveTextContent("Signing you in");
    expect(screen.queryByText("private page")).not.toBeInTheDocument();
  });

  it("sends signed-in users away from the sign-in page", async () => {
    await signInAs("admin@school.test");
    const { router } = renderApp("/login");
    expect(
      await screen.findByRole("heading", { name: /Good (morning|afternoon|evening), Asha/ }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });
});

describe("RequireRole / RequirePermission", () => {
  it("shows the 403 page for a route outside the user's role", async () => {
    await signInAs("teacher@school.test");
    renderApp("/settings");
    expect(
      await screen.findByRole("heading", { name: "You don't have access to this page" }),
    ).toBeInTheDocument();
  });

  it("shows the 403 page when a permission is missing", async () => {
    await signInAs("teacher@school.test"); // can read students, cannot create
    renderApp("/students/new");
    expect(
      await screen.findByRole("heading", { name: "You don't have access to this page" }),
    ).toBeInTheDocument();
  });

  it("lets a user with the permission through", async () => {
    await signInAs("admin@school.test");
    renderApp("/students/new");
    expect(
      await screen.findByRole("heading", { name: "Add student", level: 1 }),
    ).toBeInTheDocument();
  });

  it("explains when a signed-in account has no portal role", async () => {
    await signInAs("viewer@school.test");
    renderApp("/");
    expect(
      await screen.findByRole("heading", { name: "Your account isn't set up yet" }),
    ).toBeInTheDocument();
  });

  it("renders the designed 404 inside the layout for unknown paths", async () => {
    await signInAs("admin@school.test");
    renderApp("/no-such-page");
    expect(
      await screen.findByRole("heading", { name: "We couldn't find that page" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("navigation", { name: "Main navigation" }).length).toBeGreaterThan(
      0,
    );
  });
});

describe("<Can>", () => {
  it("renders children only with the permission, otherwise the fallback", async () => {
    await signInAs("teacher@school.test");
    renderWithProviders(
      <>
        <Can permission={PERMISSIONS.studentsRead}>
          <p>can read</p>
        </Can>
        <Can permission={PERMISSIONS.studentsCreate} fallback={<p>no create</p>}>
          <p>can create</p>
        </Can>
        <Can permission={[PERMISSIONS.studentsCreate, PERMISSIONS.studentsRead]} mode="any">
          <p>any of them</p>
        </Can>
      </>,
    );
    expect(screen.getByText("can read")).toBeInTheDocument();
    expect(screen.queryByText("can create")).not.toBeInTheDocument();
    expect(screen.getByText("no create")).toBeInTheDocument();
    expect(screen.getByText("any of them")).toBeInTheDocument();
  });

  it("renders nothing for anonymous users", () => {
    renderWithProviders(
      <Can permission={PERMISSIONS.studentsRead}>
        <p>secret</p>
      </Can>,
    );
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });
});

describe("safeNextPath (open-redirect protection)", () => {
  it.each([
    ["/students?q=ab", "/students?q=ab"],
    [null, "/"],
    ["https://evil.example", "/"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
    ["data:text/html,x", "/"],
    ["/login", "/"],
    ["/login/mfa?next=/x", "/"],
  ])("%s -> %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});
