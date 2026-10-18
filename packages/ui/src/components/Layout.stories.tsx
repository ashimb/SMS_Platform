import type { Meta, StoryObj } from "@storybook/react-vite";

import { VIEWPORTS } from "../../.storybook/viewports.ts";
import { Button } from "./Button.tsx";
import { FilterSheet } from "./FilterSheet.tsx";
import { FormField } from "./FormField.tsx";
import { FormGrid, FormGridFull } from "./FormGrid.tsx";
import { Input } from "./Input.tsx";
import { PageContainer } from "./PageContainer.tsx";
import { StatCard } from "./StatCard.tsx";
import { StatCardGrid } from "./StatCardGrid.tsx";
import { StickyActionBar } from "./StickyActionBar.tsx";

function Page() {
  return (
    <PageContainer className="space-y-6 pb-6">
      <StatCardGrid>
        <StatCard label="Enrolled" value="1,248" />
        <StatCard label="Present today" value="94%" />
        <StatCard label="Fees collected" value="₹ 42.8 L" />
        <StatCard label="Open enquiries" value="37" />
      </StatCardGrid>

      <FilterSheet activeCount={1} onClear={() => undefined}>
        <FormField label="Search">
          <Input placeholder="Name or admission no." enterKeyHint="search" />
        </FormField>
      </FilterSheet>

      <form className="space-y-4" aria-label="New student">
        <FormGrid>
          <FormField label="First name">
            <Input autoComplete="given-name" enterKeyHint="next" />
          </FormField>
          <FormField label="Last name">
            <Input autoComplete="family-name" enterKeyHint="next" />
          </FormField>
          <FormGridFull>
            <FormField label="Guardian phone">
              <Input type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="done" />
            </FormField>
          </FormGridFull>
        </FormGrid>
        <StickyActionBar>
          <Button variant="secondary" type="button">
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </StickyActionBar>
      </form>
    </PageContainer>
  );
}

const meta = {
  title: "Responsive/Page layout",
  component: Page,
  parameters: { viewport: { options: VIEWPORTS } },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Phone320: Story = { globals: { viewport: { value: "se320", isRotated: false } } };
export const Phone375: Story = { globals: { viewport: { value: "iphoneSe", isRotated: false } } };
export const Tablet: Story = { globals: { viewport: { value: "ipadPortrait", isRotated: false } } };
export const Desktop: Story = {
  globals: { viewport: { value: "desktop1440", isRotated: false } },
};
