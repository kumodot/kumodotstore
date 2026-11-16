import { decodeFm1, encodeFm1, type Fm1Build } from "./fm1Code.ts";
import { FM1_THEMES } from "@/data/fm1Themes.ts";

export const FM1_VERSION = "0.1.0";

/** FM1 comes from the factory in these colors (plastic body + rubber keys). Preview only, never in the code. */
export const FACTORY_COLORS = [
  { id: "rosa", name: "Pink", body: "#DD98C5", keys: "#A775BE" },
  { id: "beige1", name: "Beige", body: "#E1D8CF", keys: "#3F4249" },
  { id: "beige2", name: "Cream", body: "#F3ECE4", keys: "#537294" },
  { id: "orange", name: "Orange", body: "#FD5B15", keys: "#AC4124" },
  { id: "greygreen", name: "Grey / Green", body: "#4A4A4C", keys: "#6BC4C3" },
  { id: "black", name: "Black", body: "#2D2D2F", keys: "#2D2D2F" },
  { id: "white", name: "White / Purple", body: "#F7F3F2", keys: "#A052C7" },
  { id: "blush", name: "Blush / Brick", body: "#EDE6E6", keys: "#83433C" },
] as const;
export type FactoryId = (typeof FACTORY_COLORS)[number]["id"];

// Ready themes come from src/data/fm1Themes.ts (edited in the Store Studio). A theme is a name plus an order code;
// a code that no longer decodes is skipped with a console warning, and there is always at least one theme.
const FALLBACK_CODE = "FM1v2|F=LG,BK,-,=,-,-|L=CSORWH,CSMGWH,CSMGWH,CSMGWH|R=CSBLWH,CSGRWH,CSYEWH,CSRDWH|AB";
const decoded: { id: string; name: string; build: Fm1Build }[] = FM1_THEMES.flatMap((t, i) => {
  try {
    return [{ id: t.id || `theme-${i + 1}`, name: t.name, build: decodeFm1(t.code) }];
  } catch (e) {
    console.warn(`FM1 theme "${t.name}" skipped: ${(e as Error).message}`);
    return [];
  }
});
export const FIXED_THEMES: { id: string; name: string; build: Fm1Build }[] =
  decoded.length > 0 ? decoded : [{ id: "classic-theme", name: "Classic", build: decodeFm1(FALLBACK_CODE) }];

/** Real knob sizes in cm (diameter x height). From Marcelo. Classic short height is with the cap. */
export const KNOB_SPECS: Record<string, { name: string; d: number; h: number }> = {
  classic_short: { name: "Classic Short", d: 1.19, h: 1.01 },
  classic_long: { name: "Chalice", d: 1.23, h: 1.44 },
  groove_short: { name: "Groove Short", d: 1.2, h: 0.81 },
  groove_long: { name: "Groove Long", d: 1.2, h: 1.1 },
};

export const SAVED_KEY = "kumodot_fm1_saved_v1";
export function loadSaved(): { id: string; name: string; code: string }[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]"); } catch { return []; }
}
export function storeSaved(list: { id: string; name: string; code: string }[]) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch { /* private mode */ }
}
export const codeOf = (b: Fm1Build) => encodeFm1(b);
