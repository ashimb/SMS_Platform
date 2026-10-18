import { render, screen, waitFor, within } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { setViewport } from "../../vitest.setup.ts";
import { expectNoA11yViolations } from "../test/a11y.ts";
import { Button } from "./Button.tsx";
import { createDataTableColumnHelper } from "./DataTable.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./DropdownMenu.tsx";
import { FilterSheet } from "./FilterSheet.tsx";
import { FormGrid, FormGridFull } from "./FormGrid.tsx";
import { PageContainer } from "./PageContainer.tsx";
import { ResponsiveDataTable } from "./ResponsiveDataTable.tsx";
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetFooter,
  ResponsiveSheetTrigger,
} from "./ResponsiveSheet.tsx";
import { Select } from "./Select.tsx";
import { StatCardGrid } from "./StatCardGrid.tsx";
import { StickyActionBar } from "./StickyActionBar.tsx";

const PHONE = 375;

describe("ResponsiveSheet", () => {
  function Example() {
    return (
      <ResponsiveSheet>
        <ResponsiveSheetTrigger asChild>
          <Button>Publish results</Button>
        </ResponsiveSheetTrigger>
        <ResponsiveSheetContent
          title="Publish results?"
          description="84 families will be notified."
        >
          <p>This cannot be undone.</p>
          <ResponsiveSheetFooter>
            <Button>Publish</Button>
          </ResponsiveSheetFooter>
        </ResponsiveSheetContent>
      </ResponsiveSheet>
    );
  }

  it("is a centered modal on wide screens", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("button", { name: "Publish results" }));
    const dialog = await screen.findByRole("dialog", { name: "Publish results?" });
    expect(dialog.getAttribute("data-responsive-sheet")).toBe("modal");
    await expectNoA11yViolations();
  });

  it("is a bottom sheet on phones: named, trapped, Escape closes, focus returns", async () => {
    setViewport(PHONE);
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Publish results" });
    await userEvent.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Publish results?" });
    expect(dialog.getAttribute("data-responsive-sheet")).toBe("bottom");
    expect(dialog.contains(document.activeElement)).toBe(true);
    // The scrolling body keeps its content clear of the home indicator.
    expect(dialog.innerHTML).toContain("var(--sp-safe-bottom)");
    await expectNoA11yViolations();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(document.activeElement).toBe(trigger);
  });

  it("dismisses with a swipe down on the grab handle", async () => {
    setViewport(PHONE);
    render(<Example />);
    await userEvent.click(screen.getByRole("button", { name: "Publish results" }));
    const dialog = await screen.findByRole("dialog");
    const handle = dialog.querySelector<HTMLElement>("[style*='touch-action']");
    expect(handle).not.toBeNull();

    fireEvent.pointerDown(handle as HTMLElement, { clientY: 400, pointerId: 1, timeStamp: 0 });
    fireEvent.pointerMove(handle as HTMLElement, { clientY: 480, pointerId: 1, timeStamp: 100 });
    fireEvent.pointerUp(handle as HTMLElement, { clientY: 560, pointerId: 1, timeStamp: 200 });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("locks page scroll while open", async () => {
    setViewport(PHONE);
    render(<Example />);
    await userEvent.click(screen.getByRole("button", { name: "Publish results" }));
    await screen.findByRole("dialog");
    expect(document.body.getAttribute("data-scroll-locked")).toBeTruthy();
  });
});

describe("DropdownMenu", () => {
  function Example({ onEdit }: { onEdit: () => void }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent sheetTitle="Student actions">
          <DropdownMenuLabel>Student</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem destructive>Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  it("is a popover menu on wide screens", async () => {
    render(<Example onEdit={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(await screen.findAllByRole("menuitem")).toHaveLength(2);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is a bottom sheet of large rows on phones, and selecting closes it", async () => {
    setViewport(PHONE);
    const onEdit = vi.fn();
    render(<Example onEdit={onEdit} />);
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));

    const dialog = await screen.findByRole("dialog", { name: "Student actions" });
    expect(dialog.getAttribute("data-responsive-sheet")).toBe("bottom");
    const items = within(dialog).getAllByRole("menuitem");
    expect(items).toHaveLength(2);
    expect(items[0]?.className).toContain("min-h-12");
    await expectNoA11yViolations();

    await userEvent.click(items[0] as HTMLElement);
    expect(onEdit).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});

describe("Select", () => {
  const options = [
    { value: "a", label: "Class A" },
    { value: "b", label: "Class B" },
  ];

  it("is a Radix combobox on wide screens", () => {
    render(<Select aria-label="Class" options={options} placeholder="Pick one" />);
    expect(screen.getByRole("combobox", { name: "Class" }).tagName).toBe("BUTTON");
  });

  it("is the native OS picker on phones, with a placeholder and 16px-friendly sizing", async () => {
    setViewport(PHONE);
    const onChange = vi.fn();
    render(
      <Select
        aria-label="Class"
        options={options}
        placeholder="Pick one"
        onValueChange={onChange}
      />,
    );
    const select = screen.getByRole("combobox", { name: "Class" });
    expect(select.tagName).toBe("SELECT");
    expect(select.className).toContain("text-base");
    expect(select.className).toContain("h-11");
    expect((select as HTMLSelectElement).value).toBe("");
    expect(screen.getByRole("option", { name: "Pick one" })).toBeTruthy();

    await userEvent.selectOptions(select, "b");
    expect(onChange).toHaveBeenCalledWith("b");
    await expectNoA11yViolations();
  });

  it("also uses the native picker on touch devices that are wide (tablets)", () => {
    setViewport(1024, "coarse");
    render(<Select aria-label="Class" options={options} />);
    expect(screen.getByRole("combobox", { name: "Class" }).tagName).toBe("SELECT");
  });
});

interface Row {
  id: string;
  name: string;
  admissionNo: string;
  section: string;
  status: string;
}
const helper = createDataTableColumnHelper<Row>();
const columns = [
  helper.accessor("name", {
    header: "Name",
    cell: (info) => <a href={`/s/${info.row.original.id}`}>{info.getValue()}</a>,
  }),
  helper.accessor("admissionNo", { header: "Admission no." }),
  helper.accessor("section", { header: "Section" }),
  helper.accessor("status", { header: "Status" }),
];
const data: Row[] = [
  { id: "1", name: "Aarav Sharma", admissionNo: "ADM-001", section: "VI-A", status: "Enrolled" },
  { id: "2", name: "Diya Iyer", admissionNo: "ADM-002", section: "VI-B", status: "Provisional" },
];
const mobile = { primary: "name", secondary: ["section"] };

describe("ResponsiveDataTable", () => {
  it("renders the full table with a sticky header from md up", () => {
    render(
      <ResponsiveDataTable caption="Students" columns={columns} data={data} mobile={mobile} />,
    );
    const table = screen.getByRole("table", { name: "Students" });
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(screen.queryByRole("list", { name: "Students" })).toBeNull();
    expect(table.querySelector("thead")?.className).toContain("sticky");
  });

  it("renders stacked cards on phones: key fields visible, the rest behind Show details", async () => {
    setViewport(PHONE);
    render(
      <ResponsiveDataTable caption="Students" columns={columns} data={data} mobile={mobile} />,
    );
    expect(screen.queryByRole("table")).toBeNull();

    const list = screen.getByRole("list", { name: "Students" });
    const cards = within(list).getAllByRole("article");
    expect(cards).toHaveLength(2);
    const first = within(cards[0] as HTMLElement);
    expect(first.getByRole("link", { name: "Aarav Sharma" })).toBeTruthy();
    expect(first.getByText("Section")).toBeTruthy();
    expect(first.getByText("VI-A")).toBeTruthy();

    const toggle = first.getByRole("button", { name: "Show details" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(first.getByText("ADM-001").closest("[hidden]")).not.toBeNull();
    await userEvent.click(toggle);
    expect(first.getByRole("button", { name: "Hide details" }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(first.getByText("ADM-001").closest("[hidden]")).toBeNull();
    await expectNoA11yViolations();
  });

  it("shows skeletons, empty and error states in both presentations", () => {
    const { rerender } = render(
      <ResponsiveDataTable
        caption="Students"
        columns={columns}
        data={[]}
        mobile={mobile}
        loading
      />,
    );
    expect(document.querySelector("[aria-busy='true']")).not.toBeNull();

    rerender(
      <ResponsiveDataTable
        caption="Students"
        columns={columns}
        data={[]}
        mobile={mobile}
        empty="Nothing here"
      />,
    );
    expect(screen.getByText("Nothing here")).toBeTruthy();

    setViewport(PHONE);
    rerender(
      <ResponsiveDataTable
        caption="Students"
        columns={columns}
        data={[]}
        mobile={mobile}
        loading
      />,
    );
    expect(screen.getByRole("list", { name: "Students" }).getAttribute("aria-busy")).toBe("true");

    rerender(
      <ResponsiveDataTable
        caption="Students"
        columns={columns}
        data={[]}
        mobile={mobile}
        empty="Nothing here"
      />,
    );
    expect(screen.getByText("Nothing here")).toBeTruthy();

    rerender(
      <ResponsiveDataTable
        caption="Students"
        columns={columns}
        data={[]}
        mobile={mobile}
        error={<p>Failed</p>}
      />,
    );
    expect(screen.getByText("Failed")).toBeTruthy();
  });
});

describe("FilterSheet", () => {
  const filters = (
    <label>
      Status
      <input />
    </label>
  );

  it("shows the controls inline from md up", () => {
    render(<FilterSheet activeCount={1}>{filters}</FilterSheet>);
    expect(screen.getByLabelText("Status")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Filters/ })).toBeNull();
  });

  it("collapses into a sheet on phones with an active-filter count chip", async () => {
    setViewport(PHONE);
    const onClear = vi.fn();
    render(
      <FilterSheet activeCount={2} onClear={onClear}>
        {filters}
      </FilterSheet>,
    );
    expect(screen.queryByLabelText("Status")).toBeNull();
    const trigger = screen.getByRole("button", { name: /Filters/ });
    expect(trigger.textContent).toContain("2");
    expect(trigger.textContent).toContain("2 active");

    await userEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Filters" });
    expect(within(dialog).getByLabelText("Status")).toBeTruthy();
    await userEvent.click(within(dialog).getByRole("button", { name: "Clear filters" }));
    expect(onClear).toHaveBeenCalledOnce();
    await userEvent.click(within(dialog).getByRole("button", { name: "Show results" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});

describe("layout helpers", () => {
  it("StatCardGrid reflows 1 -> 2 -> 4 columns from its own width (container queries)", () => {
    const { container } = render(<StatCardGrid>x</StatCardGrid>);
    expect(container.firstElementChild?.className).toContain("@container");
    const grid = container.firstElementChild?.firstElementChild;
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("@md:grid-cols-2");
    expect(grid?.className).toContain("@3xl:grid-cols-4");
  });

  it("FormGrid is one column on phones, two from md and three from xl", () => {
    const { container, rerender } = render(<FormGrid>x</FormGrid>);
    expect(container.firstElementChild?.className).toContain("grid-cols-1");
    expect(container.firstElementChild?.className).toContain("md:grid-cols-2");
    rerender(<FormGrid columns={3}>x</FormGrid>);
    expect(container.firstElementChild?.className).toContain("xl:grid-cols-3");
    rerender(<FormGridFull>x</FormGridFull>);
    expect(container.firstElementChild?.className).toContain("md:col-span-full");
  });

  it("StickyActionBar pins to the bottom on phones with safe-area padding, static from md", () => {
    const { container, rerender } = render(<StickyActionBar>x</StickyActionBar>);
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.className).toContain("sticky");
    expect(bar.className).toContain("var(--sp-safe-bottom)");
    expect(bar.className).toContain("md:static");
    rerender(<StickyActionBar aboveBottomNav>x</StickyActionBar>);
    expect((container.firstElementChild as HTMLElement).className).toContain("--sp-bottom-offset");
  });

  it("PageContainer applies consistent side padding and a width limit", () => {
    const { container, rerender } = render(<PageContainer>x</PageContainer>);
    expect(container.firstElementChild?.className).toContain("px-4");
    expect(container.firstElementChild?.className).toContain("max-w-7xl");
    rerender(<PageContainer size="narrow">x</PageContainer>);
    expect(container.firstElementChild?.className).toContain("max-w-3xl");
  });
});
