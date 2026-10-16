import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { expectNoA11yViolations } from "../test/a11y.ts";
import { Button } from "./Button.tsx";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "./Dialog.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./DropdownMenu.tsx";
import { Sheet, SheetContent, SheetTrigger } from "./Sheet.tsx";
import { Tooltip, TooltipProvider } from "./Tooltip.tsx";

describe("Dialog", () => {
  function Example() {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button>Publish results</Button>
        </DialogTrigger>
        <DialogContent title="Publish results?" description="84 families will be notified.">
          <p>This cannot be undone.</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button>Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  it("opens as a named modal, traps focus, closes on Escape and restores focus", async () => {
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Publish results" });
    await userEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Publish results?" });
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    expect(dialog.contains(document.activeElement)).toBe(true);
    await expectNoA11yViolations();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(document.activeElement).toBe(trigger);
  });

  it("has a labelled close button", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("button", { name: "Publish results" }));
    await userEvent.click(await screen.findByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});

describe("Sheet", () => {
  it.each(["right", "left", "bottom"] as const)(
    "opens from the %s edge accessibly",
    async (side) => {
      render(
        <Sheet>
          <SheetTrigger asChild>
            <Button>Filters</Button>
          </SheetTrigger>
          <SheetContent side={side} title="Filter students" description="Narrow the list">
            <p>Filters</p>
          </SheetContent>
        </Sheet>,
      );
      await userEvent.click(screen.getByRole("button", { name: "Filters" }));
      expect(await screen.findByRole("dialog", { name: "Filter students" })).toBeTruthy();
      await expectNoA11yViolations();
      await userEvent.keyboard("{Escape}");
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).toBeNull();
      });
    },
  );
});

describe("Tooltip", () => {
  it("appears on keyboard focus and describes the trigger", async () => {
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip content="Export as CSV">
          <Button aria-label="Export">⇩</Button>
        </Tooltip>
      </TooltipProvider>,
    );
    await userEvent.tab();
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip.textContent).toContain("Export as CSV");
    await expectNoA11yViolations();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).toBeNull();
    });
  });
});

describe("DropdownMenu", () => {
  it("opens with Enter, moves with arrows, and selects with Enter", async () => {
    const onArchive = vi.fn();
    const onEdit = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Student</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem disabled>Transfer</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={onArchive}>
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const trigger = screen.getByRole("button", { name: "Actions" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    expect(menu).toBeTruthy();
    await expectNoA11yViolations();

    // Edit is first; the disabled Transfer item is skipped by arrow navigation.
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onEdit).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });
});
