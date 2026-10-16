import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormField } from "./FormField.tsx";
import { Input } from "./Input.tsx";

const meta = {
  title: "Forms/FormField",
  component: FormField,
  args: { label: "Mobile number", hint: "10-digit Indian mobile number", children: null },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

const renderField: NonNullable<Story["render"]> = (args) => (
  <div className="max-w-sm">
    <FormField {...args}>
      <Input inputMode="tel" autoComplete="tel" placeholder="98765 43210" />
    </FormField>
  </div>
);

export const WithHint: Story = { render: renderField };

export const RequiredWithError: Story = {
  args: { required: true, error: "Enter a 10-digit mobile number." },
  render: renderField,
};

export const Disabled: Story = { args: { disabled: true }, render: renderField };
