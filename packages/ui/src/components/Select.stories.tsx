import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormField } from "./FormField.tsx";
import { Select } from "./Select.tsx";

const classes = [
  { value: "vi", label: "Class VI" },
  { value: "vii", label: "Class VII" },
  { value: "viii", label: "Class VIII" },
  { value: "ix", label: "Class IX", disabled: true },
];

const meta = {
  title: "Forms/Select",
  component: Select,
  args: { options: classes, placeholder: "Choose a class" },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="max-w-xs">
      <FormField label="Class" hint="Academic year 2026-27">
        <Select {...args} />
      </FormField>
    </div>
  ),
};

export const Invalid: Story = {
  render: (args) => (
    <div className="max-w-xs">
      <FormField label="Section" error="Choose a section." required>
        <Select {...args} />
      </FormField>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, "aria-label": "Class", defaultValue: "vii" },
};
