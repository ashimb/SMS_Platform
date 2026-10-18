import "../src/styles/index.css";

import type { Decorator, Preview } from "@storybook/react-vite";
import { type ReactNode, useEffect } from "react";

import { Toaster } from "../src/components/Toast.tsx";
import { TooltipProvider } from "../src/components/Tooltip.tsx";
import { applyTenantTheme, clearTenantTheme } from "../src/theme/tenant-theme.ts";
import { VIEWPORTS } from "./viewports.ts";

const BRANDS: Record<string, string | undefined> = {
  default: undefined,
  teal: "#0f766e",
  maroon: "#9f1239",
  "yellow (auto-corrected)": "#ffe600",
};

function ThemeFrame({
  theme,
  brand,
  children,
}: {
  theme: "light" | "dark";
  brand: string | undefined;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
    clearTenantTheme();
    if (brand) applyTenantTheme({ primaryColor: brand });
  }, [theme, brand]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-32 bg-bg p-6 font-sans text-fg">{children}</div>
      <Toaster theme={theme} />
    </TooltipProvider>
  );
}

/** Applies the light/dark theme and an optional tenant brand from the toolbar. */
const withTheme: Decorator = (Story, context) => (
  <ThemeFrame
    theme={context.globals["theme"] === "dark" ? "dark" : "light"}
    brand={BRANDS[String(context.globals["brand"] ?? "default")]}
  >
    <Story />
  </ThemeFrame>
);

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "Colour theme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
    brand: {
      description: "Tenant brand colour (applyTenantTheme)",
      toolbar: {
        title: "Brand",
        icon: "paintbrush",
        items: Object.keys(BRANDS).map((value) => ({ value, title: value })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light", brand: "default" },
  parameters: {
    layout: "fullscreen",
    controls: { expanded: true },
    // axe runs on every story in the Accessibility panel; violations are reported as errors.
    a11y: { test: "error" },
    // Phones, tablets and desktop from the RESPONSIVE standard (toolbar: Viewport).
    viewport: { options: VIEWPORTS },
  },
};

export default preview;
