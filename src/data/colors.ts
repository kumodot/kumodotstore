import type { FilamentColor } from "@/types/index.ts";

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
  );
}

export const FILAMENT_COLORS: FilamentColor[] = [
  { id: "RD", name: "Red", rgb: [255, 0, 0], hex: rgbToHex(255, 0, 0), available: true },
  { id: "OR", name: "Orange", rgb: [255, 153, 102], hex: rgbToHex(255, 153, 102), available: true },
  { id: "YE", name: "Yellow", rgb: [249, 231, 96], hex: rgbToHex(249, 231, 96), available: true },
  { id: "GR", name: "Green", rgb: [136, 196, 73], hex: rgbToHex(136, 196, 73), available: true },
  { id: "IB", name: "Ice Blue", rgb: [178, 240, 229], hex: rgbToHex(178, 240, 229), available: true },
  { id: "BL", name: "Blue", rgb: [69, 204, 245], hex: rgbToHex(69, 204, 245), available: true },
  { id: "PU", name: "Purple", rgb: [162, 145, 205], hex: rgbToHex(162, 145, 205), available: true },
  { id: "LG", name: "Light Gray", rgb: [224, 224, 224], hex: rgbToHex(224, 224, 224), available: true },
  { id: "MG", name: "Medium Gray", rgb: [160, 160, 160], hex: rgbToHex(160, 160, 160), available: true },
  { id: "DG", name: "Dark Gray", rgb: [96, 96, 96], hex: rgbToHex(96, 96, 96), available: true },
  { id: "WH", name: "White", rgb: [255, 255, 255], hex: rgbToHex(255, 255, 255), available: true },
  { id: "BK", name: "Black", rgb: [0, 0, 0], hex: rgbToHex(0, 0, 0), available: true },
];

export const COLORS_BY_ID: Record<string, FilamentColor> = Object.fromEntries(
  FILAMENT_COLORS.map((c) => [c.id, c])
);
