import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "@/test/a11y.ts";
import { server } from "@/test/mocks/server.ts";
import { renderApp, signInAs } from "@/test/utils.tsx";

async function openList(email: string, path = "/students") {
  await signInAs(email);
  const view = renderApp(path);
  const table = await screen.findByRole("table", { name: "Students" });
  // Real rows (not loading skeletons) are in once the pagination summary appears.
  await screen.findByText(/^Showing 1–/);
  return { ...view, table };
}

function bodyRows(table: HTMLElement) {
  return within(table).getAllByRole("row").slice(1);
}

describe("StudentsListPage", () => {
  it("lists students from the API with server-side pagination", async () => {
    const { table, user, router } = await openList("admin@school.test");

    expect(bodyRows(table)).toHaveLength(25);
    expect(screen.getByText("Showing 1–25 of 137")).toBeInTheDocument();
    expect(screen.getByText("137 students")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Showing 26–50 of 137");
    expect(router.state.location.search).toBe("?page=2");
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
  });

  it("searches (debounced) and keeps the query in the URL", async () => {
    const { table, user, router } = await openList("admin@school.test");
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "SPS/2026/0042");

    await waitFor(() => {
      expect(bodyRows(table)).toHaveLength(1);
    });
    expect(within(table).getByText("SPS/2026/0042")).toBeInTheDocument();
    expect(router.state.location.search).toBe(`?q=${encodeURIComponent("SPS/2026/0042")}`);
  });

  it("shows a 'no matches' state with a way to clear filters", async () => {
    const { user } = await openList("admin@school.test");
    await user.type(screen.getByRole("searchbox", { name: "Search" }), "zzzz-nobody");
    expect(await screen.findByRole("heading", { name: "No students match" })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Clear filters" })[0] as HTMLElement);
    await screen.findByText("Showing 1–25 of 137");
  });

  it("reads filters from the URL on load", async () => {
    const { table } = await openList("admin@school.test", "/students?status=alumni");
    for (const row of bodyRows(table)) expect(row).toHaveTextContent("Alumni");
  });

  it("shows 'Add student' only to users allowed to create students", async () => {
    await openList("admin@school.test");
    expect(screen.getByRole("link", { name: "Add student" })).toHaveAttribute(
      "href",
      "/students/new",
    );
  });

  it("hides 'Add student' for a teacher (read-only access)", async () => {
    await openList("teacher@school.test");
    expect(screen.queryByRole("link", { name: "Add student" })).not.toBeInTheDocument();
  });

  it("shows an error state with the API trace id when the list fails", async () => {
    server.use(
      http.get("/api/v1/students", () =>
        HttpResponse.json(
          { error: { code: "INTERNAL_ERROR", message: "boom", trace_id: "trace-students-1" } },
          { status: 500 },
        ),
      ),
    );
    await signInAs("admin@school.test");
    renderApp("/students");
    expect(await screen.findByText("trace-students-1")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = await openList("admin@school.test");
    await expectNoA11yViolations(container);
  });
});
