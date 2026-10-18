/**
 * Viewport presets for Storybook's built-in viewport tool: the device set the RESPONSIVE standard
 * is verified on (320 up to 1440, phones in portrait; iPad in both orientations).
 */
export const VIEWPORTS = {
  se320: {
    name: "Small phone · 320",
    styles: { width: "320px", height: "568px" },
    type: "mobile",
  },
  iphoneSe: {
    name: "iPhone SE · 375",
    styles: { width: "375px", height: "667px" },
    type: "mobile",
  },
  iphone14: {
    name: "iPhone 14 · 390",
    styles: { width: "390px", height: "844px" },
    type: "mobile",
  },
  pixel7: {
    name: "Pixel 7 · 412",
    styles: { width: "412px", height: "915px" },
    type: "mobile",
  },
  ipadPortrait: {
    name: "iPad portrait · 768",
    styles: { width: "768px", height: "1024px" },
    type: "tablet",
  },
  ipadLandscape: {
    name: "iPad landscape · 1024",
    styles: { width: "1024px", height: "768px" },
    type: "tablet",
  },
  desktop1440: {
    name: "Desktop · 1440",
    styles: { width: "1440px", height: "900px" },
    type: "desktop",
  },
} as const;

export type ViewportKey = keyof typeof VIEWPORTS;
