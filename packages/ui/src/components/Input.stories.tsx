import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search } from "lucide-react";

import { FormField } from "./FormField.tsx";
import { Input } from "./Input.tsx";

const meta = {
  title: "Forms/Input",
  component: Input,
  args: { placeholder: "Priya Sharma" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="max-w-sm">
      <FormField label="Full name">
        <Input {...args} />
      </FormField>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="max-w-sm">
      <Input
        aria-label="Search students"
        leading={<Search />}
        placeholder="Search by name or admission no."
      />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="max-w-sm">
      <FormField label="Email" error="Enter a valid email address.">
        <Input type="email" defaultValue="priya@" />
      </FormField>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, "aria-label": "Admission number", defaultValue: "ADM/2026/0142" },
};
