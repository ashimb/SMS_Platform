import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "./Badge.tsx";
import { Button } from "./Button.tsx";
import { createDataTableColumnHelper, DataTable } from "./DataTable.tsx";

interface Row {
  id: string;
  name: string;
  admissionNo: string;
  section: string;
  attendance: number;
  status: "enrolled" | "provisional";
}

const helper = createDataTableColumnHelper<Row>();
const columns = [
  helper.accessor("name", {
    header: "Name",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  helper.accessor("admissionNo", { header: "Admission no." }),
  helper.accessor("section", { header: "Section" }),
  helper.accessor("attendance", {
    header: "Attendance",
    cell: (info) => <span className="tabular-nums">{info.getValue()}%</span>,
  }),
  helper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <Badge tone={info.getValue() === "enrolled" ? "success" : "warning"} dot>
        {info.getValue() === "enrolled" ? "Enrolled" : "Provisional"}
      </Badge>
    ),
  }),
];

const data: Row[] = [
  {
    id: "1",
    name: "Aarav Sharma",
    admissionNo: "ADM/2024/0142",
    section: "VII-B",
    attendance: 96,
    status: "enrolled",
  },
  {
    id: "2",
    name: "Diya Iyer",
    admissionNo: "ADM/2024/0155",
    section: "VII-B",
    attendance: 88,
    status: "enrolled",
  },
  {
    id: "3",
    name: "Kabir Khan",
    admissionNo: "ADM/2026/0007",
    section: "VII-B",
    attendance: 71,
    status: "provisional",
  },
];

const meta = {
  title: "Data display/DataTable",
  component: DataTable<Row>,
  args: { caption: "Students in VII-B", data, columns, getRowId: (row: Row) => row.id },
} satisfies Meta<typeof DataTable<Row>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Loading: Story = { args: { loading: true } };
export const Empty: Story = { args: { data: [], empty: "No students match these filters." } };
export const Error: Story = {
  args: {
    error: (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-fg-muted">Couldn't load students.</p>
        <Button variant="secondary" size="sm">
          Retry
        </Button>
      </div>
    ),
  },
};
