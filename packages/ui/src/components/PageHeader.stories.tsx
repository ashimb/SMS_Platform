import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus, Upload } from "lucide-react";

import { Button } from "./Button.tsx";
import { PageHeader } from "./PageHeader.tsx";

const meta = {
  title: "Layout/PageHeader",
  component: PageHeader,
  args: {
    title: "Students",
    description: "1,742 students enrolled in 2026-27 across 48 sections.",
    breadcrumbs: (
      <nav aria-label="Breadcrumb">
        <ol className="flex gap-2">
          <li>People</li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">Students</li>
        </ol>
      </nav>
    ),
    actions: (
      <>
        <Button variant="secondary">
          <Upload aria-hidden="true" /> Import
        </Button>
        <Button>
          <Plus aria-hidden="true" /> Add student
        </Button>
      </>
    ),
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TitleOnly: Story = {
  args: { description: undefined, breadcrumbs: undefined, actions: undefined },
};
