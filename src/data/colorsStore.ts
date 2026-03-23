/**
 * Colors store with localStorage persistence.
 * Default colors come from colors.ts. Admin overrides are saved in localStorage.
 * On load, saved colors are merged over defaults.
 */
import { FILAMENT_COLORS } from "./colors.ts";
import type { FilamentColor } from "@/types/index.ts";

const STORAGE_KEY = "kumodot_colors_v1";

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function loadFromStorage(): FilamentColor[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FilamentColor[];
  } catch {
    return null;
  }
}

function saveToStorage(colors: FilamentColor[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
}

// Reactive store using a simple event emitter pattern
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

let _colors: FilamentColor[] = loadFromStorage() ?? [...FILAMENT_COLORS];

export const colorsStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getColors(): FilamentColor[] {
    return _colors;
  },

  getColorById(id: string): FilamentColor | undefined {
    return _colors.find((c) => c.id === id);
  },

  getColorsById(): Record<string, FilamentColor> {
    return Object.fromEntries(_colors.map((c) => [c.id, c]));
  },

  updateColor(id: string, updates: Partial<Omit<FilamentColor, "id">>) {
    _colors = _colors.map((c) => {
      if (c.id !== id) return c;
      const next = { ...c, ...updates };
      // Keep hex and rgb in sync
      if (updates.hex && !updates.rgb) {
        next.rgb = hexToRgb(updates.hex);
      } else if (updates.rgb && !updates.hex) {
        next.hex = rgbToHex(...updates.rgb);
      }
      return next;
    });
    saveToStorage(_colors);
    notify();
  },

  addColor(color: Omit<FilamentColor, "hex"> & { hex?: string }) {
    const hex =
      color.hex ?? rgbToHex(color.rgb[0], color.rgb[1], color.rgb[2]);
    const rgb = color.rgb ?? hexToRgb(hex);
    const newColor: FilamentColor = {
      ...color,
      hex,
      rgb,
      available: color.available ?? true,
    };
    _colors = [..._colors, newColor];
    saveToStorage(_colors);
    notify();
  },

  removeColor(id: string) {
    _colors = _colors.filter((c) => c.id !== id);
    saveToStorage(_colors);
    notify();
  },

  toggleAvailable(id: string) {
    _colors = _colors.map((c) =>
      c.id === id ? { ...c, available: !c.available } : c
    );
    saveToStorage(_colors);
    notify();
  },

  resetToDefaults() {
    clearStorage();
    _colors = [...FILAMENT_COLORS];
    notify();
  },

  rgbToHex,
  hexToRgb,
};
