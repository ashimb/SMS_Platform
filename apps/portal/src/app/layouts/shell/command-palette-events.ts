/** Open the command palette from anywhere (kept separate so callers don't load the palette). */
export const OPEN_PALETTE_EVENT = "sp:open-command-palette";

export function openCommandPalette(): void {
  window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT));
}
