// Order code checks for the Studio's Order Decoder: which ready theme a code is, and whether it asks for something
// the PUBLIC Kustomizer never lets a buyer pick (a code edited by hand to get colors or parts that are not offered).
// The code's checksum only catches typos: anyone who knows the format can recompute it, so this is the real check.
//
// Rule of thumb: a value is fine if the public Kustomizer offers it, OR if a released (enabled) theme has that same
// value in that same place (a buyer who starts from a theme and edits other parts keeps the theme's extras).
import { offeredColors } from "../../data/colorAvailability.ts";
import { encodeFm1, SLOTS, SLOT_NAME, type Fm1Build } from "./fm1Code.ts";
import { FIXED_THEMES, type FixedTheme } from "./fm1Data.ts";

interface Color { id: string; name: string; available: boolean; knobsOnly?: boolean }

export interface Fm1Check {
  theme: FixedTheme | null;            // exact match with a ready theme
  closest: { theme: FixedTheme; diffs: number } | null;   // nearest ready theme (how many fields differ)
  problems: string[];                  // things the public Kustomizer cannot produce: likely edited by hand
  notes: string[];                     // worth knowing, not a problem (secret theme, disabled theme ...)
}

const strip = (code: string) => code.replace(/\|[0-9A-Z]{2}$/, "");   // without the checksum
const fields = (b: Fm1Build): string[] => [
  b.body, b.accent, b.side ?? "", b.bezel ?? "", b.badge ?? "", b.logo ?? "",
  ...SLOTS.flatMap((s) => [b.knobs[s].style, b.knobs[s].height, b.knobs[s].body, b.knobs[s].cap]),
];

export function checkFm1(b: Fm1Build, colors: Color[]): Fm1Check {
  const problems: string[] = [], notes: string[] = [];
  const name = (id: string) => colors.find((c) => c.id === id)?.name ?? id;
  const code = strip(encodeFm1(b));

  const theme = FIXED_THEMES.find((t) => strip(encodeFm1({ ...t.build, mode: b.mode })) === code) ?? null;
  let closest: Fm1Check["closest"] = null;
  if (!theme) {
    const mine = fields(b);
    for (const t of FIXED_THEMES) {
      const theirs = fields({ ...t.build, mode: b.mode });
      const diffs = (b.mode === "knobs" ? mine.slice(6) : mine).filter((v, i) => v !== (b.mode === "knobs" ? theirs.slice(6) : theirs)[i]).length;
      if (!closest || diffs < closest.diffs) closest = { theme: t, diffs };
    }
  }
  if (theme) {
    if (!theme.enabled) problems.push(`It is the theme "${theme.name}", which is DISABLED (not released): the public site does not show it.`);
    else if (theme.lock) notes.push(`Secret theme (unlock code): "${theme.name}".`);
    return { theme, closest, problems, notes };
  }

  const released = FIXED_THEMES.filter((t) => t.enabled);
  const fromTheme = (pick: (x: Fm1Build) => unknown, v: unknown) => released.some((t) => pick(t.build) === v);
  const caseOk = new Set(offeredColors("fm1-case", colors).filter((c) => !c.knobsOnly).map((c) => c.id));
  const knobOk = new Set(offeredColors("fm1-knobs", colors).map((c) => c.id));

  if (b.mode === "case") {
    const fp: [string, (x: Fm1Build) => string | null][] = [
      ["faceplate", (x) => x.body], ["labels (accent)", (x) => x.accent], ["sides", (x) => x.side], ["bezel", (x) => x.bezel], ["firmware logo", (x) => x.logo],
    ];
    for (const [label, pick] of fp) {
      const v = pick(b);
      if (!v || v === "-") continue;
      if (!caseOk.has(v) && !fromTheme(pick, v)) problems.push(`${label}: ${name(v)} is not offered for the case.`);
    }
    // parts the public Kustomizer never lets a buyer change: they can only come from a ready theme
    if (b.side !== null && b.side !== b.body && !fromTheme((x) => x.side, b.side)) problems.push(`Sides in their own color (${name(b.side)}): the public site does not offer this.`);
    if (b.badge !== null && !fromTheme((x) => x.badge, b.badge)) problems.push(`Firmware badge "${b.badge}": not in any released theme, the public site does not offer badges.`);
    if (b.logo !== null && !fromTheme((x) => x.logo, b.logo)) problems.push(`Custom logo color (${name(b.logo)}): only the Studio can set this.`);
  }
  for (const s of SLOTS) {
    const k = b.knobs[s];
    for (const part of ["body", "cap"] as const) {
      const v = k[part];
      if (!knobOk.has(v) && !fromTheme((x) => x.knobs[s][part], v)) problems.push(`${SLOT_NAME[s]} ${part}: ${name(v)} is not offered for knobs.`);
    }
  }
  return { theme: null, closest, problems, notes };
}
