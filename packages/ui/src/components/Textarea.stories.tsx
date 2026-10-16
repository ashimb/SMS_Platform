import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormField } from "./FormField.tsx";
import { Textarea } from "./Textarea.tsx";

const meta = {
  title: "Forms/Textarea",
  component: Textarea,
  args: {
    maxLength: 300,
    showCount: true,
    placeholder: "Write a short remark for the report card",
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCounter: Story = {
  render: (args) => (
    <div className="max-w-md">
      <FormField label="Class teacher remarks" hint="Shown on the report card.">
        <Textarea {...args} />
      </FormField>
    </div>
  ),
};

export const Invalid: Story = {
  render: (args) => (
    <div className="max-w-md">
      <FormField label="Reason" error="Give a reason of at least 15 characters." required>
        <Textarea {...args} defaultValue="Late" />
      </FormField>
    </div>
  ),
};
