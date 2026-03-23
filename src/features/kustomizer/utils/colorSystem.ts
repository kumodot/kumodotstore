import { colorsStore } from "@/data/colorsStore.ts";
import type { CaseModel } from "@/types/index.ts";

export function getRgbStyle(colorId: string): string {
  const color = colorsStore.getColorById(colorId);
  if (color) {
    const [r, g, b] = color.rgb;
    return `rgb(${r}, ${g}, ${b})`;
  }
  return "rgb(128, 128, 128)";
}

export function formatOrderCode(
  colors: string[],
  model: CaseModel
): string {
  const groups: string[] = [];
  for (let i = 0; i < colors.length; i += model.groupSize) {
    groups.push(colors.slice(i, i + model.groupSize).join("_"));
  }
  return groups.join("/");
}

export function parseFormattedCode(formattedCode: string): string[] {
  const clean = formattedCode.replace(/_/g, "").replace(/\//g, "");
  const codes: string[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    codes.push(clean.substring(i, i + 2));
  }
  return codes;
}
