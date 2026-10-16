import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "@/test/a11y.ts";
import { server } from "@/test/mocks/server.ts";
import { renderApp, signInAs } from "@/test/utils.tsx";

import { periodStates } from "../components/TeacherDashboard.tsx";

describe("Admin dashboard", () => {
  it("shows key figures from the API (INR with Indian grouping), quick actions and panels", async () => {
    await signInAs("admin@school.test");
    renderApp("/");

    const figures = await screen.findByRole("region", { name: "Key figures" });
    expect(within(figures).getByText("1,248")).toBeInTheDocument();
    expect(within(figures).getByText("93.4%")).toBeInTheDocument();
    expect(within(figures).getByText("₹18.4L")).toBeInTheDocument();
    expect(within(figures).getByText("2 sections not marked yet")).toBeInTheDocument();

    const actions = screen.getByRole("region", { name: "Quick actions" });
    expect(within(actions).getByRole("link", { name: /Add a student/ })).toHaveAttribute(
      "href",
      "/students/new",
    );
    expect(screen.getByRole("heading", { name: "Recent notices" })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    await signInAs("admin@school.test");
    const { container } = renderApp("/");
    await screen.findByRole("region", { name: "Key figures" });
    await expectNoA11yViolations(container);
  });

  it("shows a designed state (not an error) while the API has no dashboard endpoint", async () => {
    server.use(
      http.get("/api/v1/dashboards/:role", () =>
        HttpResponse.json({ error: { code: "NOT_FOUND", message: "Not found" } }, { status: 404 }),
      ),
    );
    await signInAs("admin@school.test");
    renderApp("/");
    expect(
      await screen.findByRole("heading", { name: "Your dashboard is almost ready" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an error with a support reference when loading fails", async () => {
    server.use(
      http.get("/api/v1/dashboards/:role", () =>
        HttpResponse.json(
          { error: { code: "INTERNAL_ERROR", message: "boom", trace_id: "trace-abc123" } },
          { status: 500 },
        ),
      ),
    );
    await signInAs("admin@school.test");
    renderApp("/");
    expect(await screen.findByText("trace-abc123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

describe("Teacher and parent dashboards", () => {
  it("teacher: today's timetable and the attendance call to action", async () => {
    await signInAs("teacher@school.test");
    renderApp("/");
    expect(await screen.findByRole("heading", { name: "Attendance due: 7B" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Today's timetable" })).toBeInTheDocument();
    // Teachers get the teacher navigation, without admin-only sections.
    expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
  });

  it("parent: one card per child with dues and a pay action", async () => {
    await signInAs("parent@school.test");
    const { container } = renderApp("/");
    const children = await screen.findByRole("region", { name: "Your children" });
    expect(within(children).getByRole("heading", { name: "Ananya Sharma" })).toBeInTheDocument();
    expect(within(children).getByText("₹12,500")).toBeInTheDocument();
    expect(within(children).getAllByRole("link", { name: "Pay now" })).toHaveLength(1);
    await expectNoA11yViolations(container);
  });

  it("periodStates marks the current and next periods", () => {
    const periods = [
      { period: 1, start: "08:00", end: "08:40", subject: "M", section: "7B", room: null },
      { period: 2, start: "08:45", end: "09:25", subject: "M", section: "8A", room: null },
      { period: 3, start: "10:00", end: "10:40", subject: "S", section: "7B", room: null },
      { period: 4, start: "11:00", end: "11:40", subject: "S", section: "6C", room: null },
    ];
    const at = new Date(2026, 9, 16, 8, 50);
    expect(periodStates(periods, at)).toEqual(["done", "now", "next", "later"]);
  });
});
