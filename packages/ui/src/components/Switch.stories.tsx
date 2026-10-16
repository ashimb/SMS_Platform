import type { Meta, StoryObj } from "@storybook/react-vite";

import { Switch } from "./Switch.tsx";

const meta = {
  title: "Forms/Switch",
  component: Switch,
  args: { label: "Quiet hours", description: "No non-urgent notifications between 9 pm and 7 am." },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
