// Colors offered per product line.
//
// Every color marked `available` in colors.ts (the admin "Colors" tab) is offered by default.
// To LIMIT a line, list the ids it may offer below. To grow it later, add an id to the list. That is all:
// the tools only ever show these colors, and a code or saved theme that already uses another color
// still loads and still draws correctly.
//
// Written by the admin (Colors tab, "Colors per product"). Keys: "fm1-case" (FM1_Kz faceplate and bezel),
// "fm1-knobs" (FM1_Kz knob bodies and caps) and "pokz" (Pocket Operator cases). Ids: RD Red, OR Orange, YE Yellow, GR Green, IB Ice Blue, BL Blue,
// PU Purple, LG Light Gray, MG Medium Gray, DG Dark Gray, WH White, BK Black, GD Gold.
export const COLOR_LIMITS: Record<string, string[] | undefined> = {
  "fm1-kz": ["RD", "OR", "YE", "GR", "IB", "BL", "PU", "LG", "DG", "WH", "BK", "TW", "TO"],
  "pokz": ["RD", "OR", "YE", "GR", "IB", "BL", "PU", "LG", "MG", "DG", "WH", "BK", "TW", "TO"],
  "fm1-case": ["RD", "OR", "YE", "GR", "BL", "PU", "LG", "DG", "WH", "BK", "DP"],
  "fm1-knobs": ["RD", "OR", "YE", "GR", "BL", "PU", "LG", "DG", "WH", "BK", "TW", "TO"],
};

export function offeredColors<T extends { id: string; available: boolean }>(line: string, all: T[]): T[] {
  const limit = COLOR_LIMITS[line];
  return all.filter((c) => c.available && (!limit || limit.includes(c.id)));
}
