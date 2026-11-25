// Order code -> packing list (what to take from the shelf for this order). Pure function, no React.
// Mirrors LOCAL_STORE_MANAGER/app/fm1_order.py line by line: keep both in sync (docs/ORDER_CODE_GUIDE.md explains the code).
import { bezelId, decodeFm1, GROUPS, NO_BEZEL, SLOT_NAME, type Fm1Build, type Knob, type Slot } from "./fm1Code.ts";
import { firmwareById } from "../../data/firmwares.ts";
import { logoColor } from "./fm1Color.ts";
import { EXTRA_KNOBS } from "../../data/fm1Knobs.ts";
import { hasCap } from "../../data/knobAvailability.ts";

export interface PartColor { id: string; name: string; hex: string; translucent?: boolean }

const MODEL: Record<string, string> = {
  classic_short: "Classic Short", classic_long: "Chalice", groove_short: "Groove Short", groove_long: "Groove Long",
  ...Object.fromEntries(EXTRA_KNOBS.map((k) => [`${k.style}_${k.height}`, k.name])),
};

/** The packing list as text lines. Throws Error with a readable message when the code is not valid. */
export function fm1PartsList(code: string, colors: PartColor[]): string[] {
  const b: Fm1Build = decodeFm1(code);
  const byId = (id: string) => colors.find((c) => c.id === id);
  const name = (id: string) => { const c = byId(id); return c ? c.name + (c.translucent && !/translucent/i.test(c.name) ? " (TRANSLUCENT)" : "") : `UNKNOWN COLOR ${id}`; };
  const hex = (id: string) => byId(id)?.hex ?? "#888888";
  const out: string[] = [];

  if (b.mode === "case") {
    out.push("FM1_Kz CASE + KNOBS");
    out.push(`- FACEPLATE: ${name(b.body)}`);
    out.push(`- SIDES: ${b.side ? name(b.side) : "same as the faceplate"}`);
    out.push(`- ACCENT (labels): ${name(b.accent)}`);
    if (b.bezel === NO_BEZEL) out.push("- BEZEL: NONE (no bezel)");
    else if (!b.badge) out.push(`- BEZEL: simple ring, ${name(bezelId(b))}`);
    else {
      const fw = firmwareById(b.badge)!;
      out.push(`- BEZEL: ${fw.bezel === "jiant" ? "JIANT bezel (its own shape)" : "extended bezel"}, ${name(bezelId(b))}`);
      if (fw.logo) {
        const auto = logoColor(hex(b.accent), hex(bezelId(b)));
        const logo = b.logo ? name(b.logo) : auto === hex(b.accent) ? name(b.accent) : auto === "#0D0D0C" ? "Black" : "White";
        out.push(`- FIRMWARE LOGO: ${fw.name}, ${logo}${b.logo ? "" : " (automatic)"}`);
      } else out.push(`- FIRMWARE LOGO: ${fw.name} (plain strip, no logo)`);
    }
  } else out.push("FM1_Kz KNOBS ONLY (set of 8)");

  const order: Slot[] = [...GROUPS.L, ...GROUPS.R];
  const bodies = new Map<string, { n: number; at: string[] }>();
  const caps = new Map<string, { n: number; at: string[] }>();
  for (const s of order) {
    const k: Knob = b.knobs[s];
    const vol = s === "vol";
    const bk = `${vol ? "VOL " : ""}${MODEL[`${k.style}_${k.height}`]}, ${name(k.body)}`;
    const ck = `${vol ? "VOL cap" : "cap"}, ${name(k.cap)}`;
    const capped = hasCap(k.style, k.height);   // a model that takes no cap: nothing to pick for the cap
    for (const [m, key] of (capped ? [[bodies, bk], [caps, ck]] : [[bodies, bk]]) as [typeof bodies, string][]) {
      const e = m.get(key) ?? { n: 0, at: [] };
      e.n++; e.at.push(SLOT_NAME[s]); m.set(key, e);
    }
  }
  out.push("KNOB BODIES:");
  for (const [k, e] of bodies) out.push(`- ${e.n}x ${k} (${e.at.join(", ")})`);
  out.push("KNOB CAPS:");
  for (const [k, e] of caps) out.push(`- ${e.n}x ${k} (${e.at.join(", ")})`);
  if (caps.size === 0) out.push("- none (these models take no cap)");
  return out;
}
