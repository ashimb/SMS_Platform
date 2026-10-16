import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus, Settings } from "lucide-react";

import { Button } from "./Button.tsx";

const meta = {
  title: "Actions/Button",
  component: Button,
  args: { children: "Save changes" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary", "ghost", "danger", "link"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg", "icon"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Danger: Story = { args: { variant: "danger", children: "Cancel receipt" } };
export const Loading: Story = { args: { loading: true, children: "Paying ₹18,500" } };
export const Disabled: Story = { args: { disabled: true } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Plus aria-hidden="true" /> Add student
      </Button>
      <Button variant="secondary">Export</Button>
      <Button variant="ghost">Skip</Button>
      <Button variant="danger">Delete</Button>
      <Button variant="link">View all</Button>
      <Button size="icon" variant="secondary" aria-label="Settings">
        <Settings aria-hidden="true" />
      </Button>
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
