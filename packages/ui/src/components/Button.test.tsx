import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { expectNoA11yViolations } from "../test/a11y.ts";
import { Button } from "./Button.tsx";
import { Spinner } from "./Spinner.tsx";

describe("Button", () => {
  it("is accessible in every variant", async () => {
    render(
      <div>
        {(["primary", "secondary", "ghost", "danger", "link"] as const).map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
        <Button size="icon" aria-label="Settings">
          <svg aria-hidden="true" />
        </Button>
      </div>,
    );
    await expectNoA11yViolations();
  });

  it("defaults to type=button and responds to keyboard activation", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveProperty("type", "button");
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("loading: disabled, aria-busy, announces a loading label, keeps its name", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Pay fees
      </Button>,
    );
    const button = screen.getByRole("button", { name: /pay fees/i });
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button).toHaveProperty("disabled", true);
    expect(button.textContent).toContain("Loading");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    await expectNoA11yViolations();
  });

  it("disabled buttons cannot be activated", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Delete
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("asChild renders the child element with button styles", () => {
    render(
      <Button asChild>
        <a href="/students">Students</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Students" });
    expect(link.className).toContain("inline-flex");
  });
});

describe("Spinner", () => {
  it("is a labelled status by default and silent when decorative", async () => {
    const { rerender } = render(<Spinner label="Loading students" />);
    expect(screen.getByRole("status").textContent).toContain("Loading students");
    await expectNoA11yViolations();
    rerender(<Spinner decorative />);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
