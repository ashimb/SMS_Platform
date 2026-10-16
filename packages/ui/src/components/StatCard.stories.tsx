import type { Meta, StoryObj } from "@storybook/react-vite";
import { IndianRupee, UserCheck, UserPlus } from "lucide-react";

import { StatCard } from "./StatCard.tsx";

const meta = {
  title: "Data display/StatCard",
  component: StatCard,
  args: {
    label: "Attendance today",
    value: "94%",
    icon: <UserCheck />,
    delta: { value: "+2.1%", trend: "up", sentiment: "positive", label: "vs last week" },
  },
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Loading: Story = { args: { loading: true } };

export const PrincipalDashboard: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Attendance today"
        value="94%"
        icon={<UserCheck />}
        delta={{ value: "+2.1%", trend: "up", sentiment: "positive", label: "vs last week" }}
        footer="2 sections not marked yet"
      />
      <StatCard
        label="Fees collected (October)"
        value="₹42,18,500"
        icon={<IndianRupee />}
        delta={{ value: "-6%", trend: "down", sentiment: "negative", label: "vs target" }}
      />
      <StatCard
        label="New enquiries"
        value="38"
        icon={<UserPlus />}
        delta={{ value: "0", trend: "neutral", label: "vs last week" }}
      />
    </div>
  ),
};
