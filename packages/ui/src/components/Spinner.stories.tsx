import type { Meta, StoryObj } from "@storybook/react-vite";

import { Spinner } from "./Spinner.tsx";

const meta = {
  title: "Feedback/Spinner",
  component: Spinner,
  args: { label: "Loading students" },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4 text-primary">
      <Spinner {...args} size="sm" />
      <Spinner {...args} size="md" />
      <Spinner {...args} size="lg" />
    </div>
  ),
};
