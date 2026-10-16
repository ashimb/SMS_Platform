import type { Meta, StoryObj } from "@storybook/react-vite";
import { BookOpen, CloudOff } from "lucide-react";

import { Button } from "./Button.tsx";
import { EmptyState } from "./EmptyState.tsx";

const meta = {
  title: "Feedback/EmptyState",
  component: EmptyState,
  args: {
    icon: <BookOpen />,
    title: "No homework for 7B today",
    description: "Homework you post appears here and in the parent app.",
    action: <Button>Post homework</Button>,
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Error: Story = {
  args: {
    tone: "error",
    icon: <CloudOff />,
    title: "Couldn't load students",
    description: "Check your connection and try again. Reference: 01JABCDXYZ",
    action: <Button variant="secondary">Retry</Button>,
  },
};
