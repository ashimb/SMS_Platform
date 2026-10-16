import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Inbox } from "lucide-react";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../test/a11y.ts";
import { Avatar, initials } from "./Avatar.tsx";
import { Badge } from "./Badge.tsx";
import { Button } from "./Button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./Card.tsx";
import { EmptyState } from "./EmptyState.tsx";
import { PageHeader } from "./PageHeader.tsx";
import { Skeleton } from "./Skeleton.tsx";
import { StatCard } from "./StatCard.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs.tsx";
import { toast, Toaster } from "./Toast.tsx";

describe("Badge", () => {
  it("renders every tone with text (colour is not the only signal)", async () => {
    render(
      <div>
        {(["neutral", "primary", "success", "warning", "danger", "info"] as const).map((tone) => (
          <Badge key={tone} tone={tone} dot>
            {tone}
          </Badge>
        ))}
      </div>,
    );
    expect(screen.getByText("success")).toBeTruthy();
    await expectNoA11yViolations();
  });
});

describe("Card", () => {
  it("composes with a correct heading level", async () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle as="h2">Fee collection</CardTitle>
          <CardDescription>This month</CardDescription>
        </CardHeader>
        <CardContent>₹4,20,000</CardContent>
        <CardFooter>
          <Button variant="secondary">View report</Button>
        </CardFooter>
      </Card>,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Fee collection" })).toBeTruthy();
    await expectNoA11yViolations();
  });
});

describe("Avatar", () => {
  it("falls back to initials with an accessible name", async () => {
    render(<Avatar name="Priya Sharma" />);
    expect(screen.getByRole("img", { name: "Priya Sharma" }).textContent).toBe("PS");
    await expectNoA11yViolations();
  });

  it("computes initials for single names and Indic scripts", () => {
    expect(initials("Madhavan")).toBe("M");
    expect(initials("  aarav  kumar  singh ")).toBe("AS");
    expect(initials("प्रिया शर्मा")).toBe("पश");
  });
});

describe("Tabs", () => {
  it("switches panels with arrow keys", async () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList aria-label="Student sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees" disabled>
            Fees
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Profile</TabsContent>
        <TabsContent value="attendance">94% present</TabsContent>
      </Tabs>,
    );
    await expectNoA11yViolations();
    await userEvent.tab();
    expect(document.activeElement?.textContent).toBe("Overview");
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Attendance" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(screen.getByRole("tabpanel").textContent).toBe("94% present");
  });
});

describe("Skeleton", () => {
  it("is hidden from assistive technology", async () => {
    const { container } = render(
      <div aria-busy="true">
        <Skeleton className="h-4 w-24" />
      </div>,
    );
    expect(container.querySelector("[aria-hidden='true']")).toBeTruthy();
    await expectNoA11yViolations();
  });
});

describe("EmptyState", () => {
  it("explains the state and offers an action", async () => {
    render(
      <EmptyState
        icon={<Inbox />}
        title="No homework today"
        description="Homework posted by teachers appears here."
        action={<Button>Post homework</Button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "No homework today" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Post homework" })).toBeTruthy();
    await expectNoA11yViolations();
  });

  it("has an error tone", async () => {
    render(
      <EmptyState
        tone="error"
        icon={<Inbox />}
        title="Couldn't load students"
        action={<Button>Retry</Button>}
      />,
    );
    await expectNoA11yViolations();
  });
});

describe("PageHeader", () => {
  it("renders the page's h1 with description and actions", async () => {
    render(
      <PageHeader
        title="Students"
        description="1,742 enrolled this year"
        breadcrumbs={<nav aria-label="Breadcrumb">People / Students</nav>}
        actions={<Button>Add student</Button>}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Students" })).toBeTruthy();
    await expectNoA11yViolations();
  });
});

describe("StatCard", () => {
  it("states the trend in text, not only colour", async () => {
    render(
      <StatCard
        label="Attendance today"
        value="94%"
        delta={{ value: "+2.1%", trend: "up", sentiment: "positive", label: "vs last week" }}
      />,
    );
    expect(screen.getByText("Up")).toBeTruthy();
    expect(screen.getByText("94%")).toBeTruthy();
    await expectNoA11yViolations();
  });

  it("shows skeletons and aria-busy while loading", async () => {
    const { container } = render(<StatCard label="Fees collected" value="₹0" loading />);
    expect(container.querySelector("[aria-busy='true']")).toBeTruthy();
    expect(screen.queryByText("₹0")).toBeNull();
    await expectNoA11yViolations();
  });
});

describe("Toaster", () => {
  it("announces toasts in a live region", async () => {
    render(<Toaster />);
    act(() => {
      toast.success("Attendance submitted", {
        description: "Parents of 2 students will be notified.",
      });
    });
    expect(await screen.findByText("Attendance submitted")).toBeTruthy();
    expect(document.querySelector("[aria-live]")).toBeTruthy();
    await expectNoA11yViolations();
  });
});
