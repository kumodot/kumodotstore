import type { CSSProperties } from "react";
import { colorsStore } from "@/data/colorsStore.ts";
import { swatchStyle } from "@/utils/swatch.ts";
import type { CaseModel } from "@/types/index.ts";

export function getRgbStyle(colorId: string): string {
  const color = colorsStore.getColorById(colorId);
  if (color) {
    const [r, g, b] = color.rgb;
    return `rgb(${r}, ${g}, ${b})`;
  }
  return "rgb(128, 128, 128)";
}

/** A pad or swatch drawn like in the FM1 Kustomizer: solid, or striped and faded when the filament is translucent. */
export function getSwatchStyle(colorId: string): CSSProperties {
  const c = colorsStore.getColorById(colorId);
  return c ? swatchStyle(c) : { background: "rgb(128, 128, 128)" };
}

export const isTranslucent = (colorId: string) => !!colorsStore.getColorById(colorId)?.translucent;

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
  // Normalize: remove newlines and spaces, then split by / and _
  return formattedCode
    .replace(/[\s]/g, "")   // strip whitespace and newlines
    .split(/[/_]/)           // split on / or _
    .filter((s) => s.length > 0);
}
