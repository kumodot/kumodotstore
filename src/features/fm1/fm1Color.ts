// Color of the firmware logo plate (and later its text) on the badge bezel.
// The bezel follows the accent color by default, so a plate in the accent color would vanish: the plate
// is drawn in the accent color only when it contrasts with the bezel, otherwise black or white,
// whichever reads on the bezel.
const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
/** WCAG relative luminance of a #rrggbb color. */
export function luminance(hex: string): number {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return 0.2126 * channel(n >> 16) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
export function logoColor(accentHex: string, bezelHex: string): string {
  if (contrast(accentHex, bezelHex) >= 2.2) return accentHex;
  return luminance(bezelHex) > 0.4 ? "#0D0D0C" : "#F8F6F0";
}
