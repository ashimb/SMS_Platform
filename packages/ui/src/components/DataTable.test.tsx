import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { expectNoA11yViolations } from "../test/a11y.ts";
import { Button } from "./Button.tsx";
import { createDataTableColumnHelper, DataTable } from "./DataTable.tsx";

interface StudentRow {
  id: string;
  name: string;
  className: string;
  attendance: number;
}

const helper = createDataTableColumnHelper<StudentRow>();
const columns = [
  helper.accessor("name", { header: "Name" }),
  helper.accessor("className", { header: "Class" }),
  helper.accessor("attendance", {
    header: "Attendance",
    cell: (info) => `${String(info.getValue())}%`,
  }),
];
const data: StudentRow[] = [
  { id: "s1", name: "Aarav Sharma", className: "VII-B", attendance: 96 },
  { id: "s2", name: "Diya Iyer", className: "VII-B", attendance: 88 },
];

describe("DataTable", () => {
  it("renders a captioned table with column headers and formatted cells", async () => {
    render(
      <DataTable
        caption="Students in VII-B"
        data={data}
        columns={columns}
        getRowId={(r) => r.id}
      />,
    );
    const table = screen.getByRole("table", { name: "Students in VII-B" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((h) => h.textContent),
    ).toEqual(["Name", "Class", "Attendance"]);
    expect(within(table).getByText("96%")).toBeTruthy();
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    await expectNoA11yViolations();
  });

  it("shows skeleton rows and aria-busy while loading", async () => {
    const { container } = render(
      <DataTable caption="Students" data={[]} columns={columns} loading loadingRows={3} />,
    );
    expect(container.querySelector("[aria-busy='true']")).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(4);
    await expectNoA11yViolations();
  });

  it("shows the empty state when there are no rows", async () => {
    render(
      <DataTable
        caption="Students"
        data={[]}
        columns={columns}
        empty="No students match these filters."
      />,
    );
    expect(screen.getByText("No students match these filters.")).toBeTruthy();
    await expectNoA11yViolations();
  });

  it("shows the error state instead of rows", async () => {
    render(
      <DataTable
        caption="Students"
        data={data}
        columns={columns}
        error={
          <div>
            <p>Couldn't load students.</p>
            <Button>Retry</Button>
          </div>
        }
      />,
    );
    expect(screen.queryByText("Aarav Sharma")).toBeNull();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
    await expectNoA11yViolations();
  });
});
