import type { Meta, StoryObj } from "@storybook/react-vite";

import { VIEWPORTS } from "../../.storybook/viewports.ts";
import { createDataTableColumnHelper } from "./DataTable.tsx";
import { ResponsiveDataTable } from "./ResponsiveDataTable.tsx";

interface Row {
  id: string;
  name: string;
  admissionNo: string;
  section: string;
  status: string;
}

const helper = createDataTableColumnHelper<Row>();
const columns = [
  helper.accessor("name", { header: "Name" }),
  helper.accessor("admissionNo", { header: "Admission no." }),
  helper.accessor("section", { header: "Section" }),
  helper.accessor("status", { header: "Status" }),
];
const data: Row[] = Array.from({ length: 12 }, (_, index) => ({
  id: String(index),
  name: ["Aarav Sharma", "Diya Iyer", "Kabir Singh", "Meera Nair"][index % 4] ?? "Student",
  admissionNo: `ADM-${String(index + 1).padStart(3, "0")}`,
  section: index % 2 === 0 ? "VI-A" : "VI-B",
  status: index % 3 === 0 ? "Provisional" : "Enrolled",
}));

const meta = {
  title: "Responsive/ResponsiveDataTable",
  component: ResponsiveDataTable<Row>,
  parameters: { viewport: { options: VIEWPORTS } },
  args: {
    caption: "Students",
    columns,
    data,
    mobile: { primary: "name", secondary: ["section", "status"] },
  },
} satisfies Meta<typeof ResponsiveDataTable<Row>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stacked cards: key fields visible, the rest behind "Show details". */
export const Mobile: Story = {
  globals: { viewport: { value: "iphoneSe", isRotated: false } },
};

export const Desktop: Story = {
  globals: { viewport: { value: "desktop1440", isRotated: false } },
};

export const LoadingMobile: Story = {
  args: { data: [], loading: true },
  globals: { viewport: { value: "iphoneSe", isRotated: false } },
};

export const LoadingDesktop: Story = {
  args: { data: [], loading: true },
  globals: { viewport: { value: "desktop1440", isRotated: false } },
};

export const Empty: Story = {
  args: { data: [], empty: "No students match these filters." },
  globals: { viewport: { value: "iphoneSe", isRotated: false } },
};
