import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "./Checkbox.tsx";

const meta = {
  title: "Forms/Checkbox",
  component: Checkbox,
  args: {
    label: "Send absence alerts to guardians",
    description: "By WhatsApp, with SMS fallback.",
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Indeterminate: Story = {
  args: { checked: "indeterminate", label: "Select all students" },
};
export const Disabled: Story = { args: { disabled: true } };
