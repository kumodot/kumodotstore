import type { FilamentColor } from "@/types/index.ts";

export const FILAMENT_COLORS: FilamentColor[] = [
  { id: "RD", name: "Red", rgb: [255, 0, 0], hex: "#ff0000", available: true },
  { id: "OR", name: "Orange", rgb: [255, 153, 102], hex: "#ff9966", available: true },
  { id: "YE", name: "Yellow", rgb: [249, 231, 96], hex: "#f9e760", available: true },
  { id: "GR", name: "Green", rgb: [136, 196, 73], hex: "#88c449", available: true },
  { id: "IB", name: "Ice Blue", rgb: [178, 240, 229], hex: "#b2f0e5", available: true },
  { id: "BL", name: "Blue", rgb: [69, 204, 245], hex: "#45ccf5", available: true },
  { id: "PU", name: "Purple", rgb: [162, 145, 205], hex: "#a291cd", available: true },
  { id: "LG", name: "Light Gray", rgb: [224, 224, 224], hex: "#e0e0e0", available: true },
  { id: "MG", name: "Medium Gray", rgb: [160, 160, 160], hex: "#a0a0a0", available: true },
  { id: "DG", name: "Dark Gray", rgb: [96, 96, 96], hex: "#606060", available: true },
  { id: "WH", name: "White", rgb: [255, 255, 255], hex: "#ffffff", available: true },
  { id: "BK", name: "Black", rgb: [0, 0, 0], hex: "#000000", available: true },
  { id: "GD", name: "GOLD", rgb: [210, 148, 15], hex: "#d2940f", available: true },
];

export const COLORS_BY_ID: Record<string, FilamentColor> = Object.fromEntries(
  FILAMENT_COLORS.map((c) => [c.id, c])
);
