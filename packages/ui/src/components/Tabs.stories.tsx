import type { Meta, StoryObj } from "@storybook/react-vite";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs.tsx";

const meta = {
  title: "Navigation/Tabs",
  component: Tabs,
  args: { defaultValue: "overview" },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StudentProfile: Story = {
  render: (args) => (
    <Tabs {...args}>
      <TabsList aria-label="Student profile sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
        <TabsTrigger value="academics">Academics</TabsTrigger>
        <TabsTrigger value="fees" disabled>
          Fees
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Class VII-B · Roll 12 · Admission ADM/2024/0142</TabsContent>
      <TabsContent value="attendance">94% present this term</TabsContent>
      <TabsContent value="academics">Term 1 report card published</TabsContent>
    </Tabs>
  ),
};
