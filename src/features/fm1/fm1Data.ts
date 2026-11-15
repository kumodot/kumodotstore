import { encodeFm1, SLOTS, type Fm1Build, type Knob, type Slot } from "./fm1Code.ts";

export const FM1_VERSION = "0.1.0";

/** FM1 comes from the factory in these colors (plastic body + rubber keys). Preview only, never in the code. */
export const FACTORY_COLORS = [
  { id: "rosa", name: "Pink", body: "#DD98C5", keys: "#A775BE" },
  { id: "beige1", name: "Beige", body: "#E1D8CF", keys: "#3F4249" },
  { id: "beige2", name: "Cream", body: "#F3ECE4", keys: "#537294" },
  { id: "orange", name: "Orange", body: "#FD5B15", keys: "#AC4124" },
  { id: "greygreen", name: "Grey / Green", body: "#4A4A4C", keys: "#6BC4C3" },
  { id: "black", name: "Black", body: "#2D2D2F", keys: "#2D2D2F" },
] as const;
export type FactoryId = (typeof FACTORY_COLORS)[number]["id"];

const knob = (body: string, cap: string, style: Knob["style"] = "classic", height: Knob["height"] = "short"): Knob =>
  ({ style, height, body, cap });
const knobs = (v: Knob[]) => Object.fromEntries(SLOTS.map((s, i) => [s, v[i]])) as Record<Slot, Knob>;

/** Placeholder looks (codenames, public names not decided). Colors are filament ids from colors.ts. */
export const FIXED_THEMES: { id: string; name: string; build: Fm1Build }[] = [
  {
    id: "classic-theme", name: "Classic",
    build: {
      mode: "case", body: "LG", accent: "BK", side: null, bezel: null, badge: null, logo: null,
      knobs: knobs([knob("OR", "WH"), knob("MG", "WH"), knob("MG", "WH"), knob("MG", "WH"),
        knob("BL", "WH"), knob("GR", "WH"), knob("YE", "WH"), knob("RD", "WH")]),
    },
  },
  {
    id: "sloop-theme", name: "Theme 2",
    build: {
      mode: "case", body: "DG", accent: "GR", side: null, bezel: null, badge: null, logo: null,
      knobs: knobs([knob("GR", "BK", "groove", "long"), knob("BK", "GR", "groove", "long"),
        knob("BK", "GR", "groove", "long"), knob("BK", "GR", "groove", "long"),
        knob("GR", "BK", "groove", "long"), knob("GR", "BK", "groove", "long"),
        knob("GR", "BK", "groove", "long"), knob("GR", "BK", "groove", "long")]),
    },
  },
  {
    id: "jiant-theme", name: "Theme 3",
    build: {
      mode: "case", body: "BK", accent: "YE", side: null, bezel: null, badge: null, logo: null,
      knobs: knobs([knob("YE", "BK", "groove"), knob("WH", "BK", "groove"), knob("WH", "BK", "groove"),
        knob("WH", "BK", "groove"), knob("YE", "BK", "groove"), knob("YE", "BK", "groove"),
        knob("YE", "BK", "groove"), knob("YE", "BK", "groove")]),
    },
  },
];

export const SAVED_KEY = "kumodot_fm1_saved_v1";
export function loadSaved(): { id: string; name: string; code: string }[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]"); } catch { return []; }
}
export function storeSaved(list: { id: string; name: string; code: string }[]) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch { /* private mode */ }
}
export const codeOf = (b: Fm1Build) => encodeFm1(b);
