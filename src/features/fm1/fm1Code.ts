// FM1_Kz order code, v2 (kustomizer v0.1.0).
//
//   Case:  FM1v2|F=<body>,<accent>,<side>,<bezel>,<badge>,<logo>|L=<k>,<k>,<k>,<k>|R=<k>,<k>,<k>,<k>|<check>
//   Knobs: FM1k1|L=<k>,<k>,<k>,<k>|R=<k>,<k>,<k>,<k>|<check>          (no F= block)
//
// <k> = one knob, 6 chars: <style C|G><height S|L><body color id><cap color id>
//   L = vol,nav1,nav2,nav3   R = p1,p2,p3,p4   (UI labels V S P A / K1-K4)
// side is "-" when the sides follow the faceplate color, else a color id (the faceplate wraps the
// sides, some themes color them). bezel is "=" when it follows the accent. badge is "-" for the basic bezel,
// or a firmware code (SL JI SH BG BL) for the badge bezel with a strip for the firmware name. A 4 field F
// (no badge) still decodes as the basic bezel. logo is the color of the firmware logo on the badge bezel:
// "-" = automatic (accent if it reads on the bezel, else black or white), or a color id. F may have 4, 5 or 6 fields.
// check = 2 chars, base 36 uppercase. Different prefixes on purpose: a knobs
// code can never load as a full build. The FM1 factory color is NOT in the
// code (it only changes how the buyer previews the build).
//
// Changed from the alpha's v1 (one style/height/cap per group) because the
// handoff UX needs per-knob style, height and cap color. v1 never went public.
import { FIRMWARE_LIST, type FirmwareId } from "../../data/firmwares.ts";

import { COLORS_BY_ID } from "../../data/colors.ts";

export type Style = "classic" | "groove";
export type Height = "short" | "long";
export const SLOTS = ["vol", "nav1", "nav2", "nav3", "p1", "p2", "p3", "p4"] as const;
export type Slot = (typeof SLOTS)[number];
export const GROUPS = { L: SLOTS.slice(0, 4), R: SLOTS.slice(4) } as const;
/** Readable names for the buyer (the short SLOT_LABEL stays on the 2D top view circles). */
export const SLOT_NAME: Record<Slot, string> = {
  vol: "VOL", nav1: "SEL.", nav2: "PRESET", nav3: "ALG.", p1: "K1", p2: "K2", p3: "K3", p4: "K4",
};
export const SLOT_LABEL: Record<Slot, string> = {
  vol: "V", nav1: "S", nav2: "P", nav3: "A", p1: "K1", p2: "K2", p3: "K3", p4: "K4",
};

export interface Knob { style: Style; height: Height; body: string; cap: string }
export interface Fm1Build {
  mode: "case" | "knobs";
  body: string;            // faceplate color
  accent: string;          // labels (and the bezel while bezel === null)
  side: string | null;     // faceplate sides, null = same as body
  bezel: string | null;    // null = follows accent
  badge: Firmware | null;  // null = basic bezel, else the badge bezel with this firmware
  logo: string | null;     // firmware logo color on the badge bezel, null = automatic
  knobs: Record<Slot, Knob>;
}

// The firmware list (names, codes, logos, which bezel each one needs) lives in src/data/firmwares.ts.
export const FIRMWARES = FIRMWARE_LIST.map((f) => f.id) as FirmwareId[];
export type Firmware = FirmwareId;
const FW_CODE = Object.fromEntries(FIRMWARE_LIST.map((f) => [f.id, f.code])) as Record<Firmware, string>;

// every style comes in short and long now (classic long was added with the v0.7 parts)
/** bezel value meaning "the bezel is deleted" (code field "-"); null = follows the accent, else a color id */
export const NO_BEZEL = "-";
/** the color the bezel is drawn with */
export const bezelId = (b: { bezel: string | null; accent: string }) => (b.bezel && b.bezel !== NO_BEZEL ? b.bezel : b.accent);

export const variantOk = (_s: Style, _h: Height) => true;

const checksum = (str: string) => {
  let a = 0;
  for (let i = 0; i < str.length; i++) a = (a * 31 + str.charCodeAt(i)) % 1296;
  return a.toString(36).toUpperCase().padStart(2, "0");
};

const knobTok = (k: Knob) =>
  `${k.style === "classic" ? "C" : "G"}${k.height === "short" ? "S" : "L"}${k.body}${k.cap}`;

export function encodeFm1(b: Fm1Build): string {
  const grp = (g: "L" | "R") => GROUPS[g].map((s) => knobTok(b.knobs[s])).join(",");
  const head = b.mode === "case"
    ? `FM1v2|F=${b.body},${b.accent},${b.side ?? "-"},${b.bezel ?? "="},${b.badge ? FW_CODE[b.badge] : "-"},${b.logo ?? "-"}|`
    : "FM1k1|";
  const body = `${head}L=${grp("L")}|R=${grp("R")}`;
  return `${body}|${checksum(body)}`;
}

/** Throws Error with a buyer-readable message. */
export function decodeFm1(raw: string): Fm1Build {
  const str = String(raw ?? "").trim().replace(/\s+/g, "");
  const parts = str.split("|");
  const mode = parts[0] === "FM1v2" ? "case" : parts[0] === "FM1k1" ? "knobs" : null;
  if (!mode) throw new Error("Not an FM1_Kz code (it should start with FM1v2 or FM1k1).");
  const blocks = mode === "case" ? 3 : 2;
  const ck = parts[parts.length - 1];
  if (parts.length !== blocks + 2 || !/^[0-9A-Z]{2}$/.test(ck)) {
    throw new Error("Code is incomplete, copy it again from the order card.");
  }
  if (checksum(parts.slice(0, -1).join("|")) !== ck) {
    throw new Error("Code check failed, a character is probably wrong.");
  }
  const get = (p: string) => {
    const x = parts.find((s) => s.startsWith(p + "="));
    if (!x) throw new Error(`Missing ${p} block.`);
    return x.slice(2).split(",");
  };
  const col = (id: string) => {
    if (!COLORS_BY_ID[id]) throw new Error(`Unknown color id: ${id}`);
    return id;
  };
  const knobs = {} as Record<Slot, Knob>;
  (["L", "R"] as const).forEach((g) => {
    const toks = get(g);
    if (toks.length !== 4) throw new Error("Code has the wrong number of knobs.");
    GROUPS[g].forEach((slot, i) => {
      const t = toks[i];
      if (t.length !== 6) throw new Error("Bad knob entry: " + t);
      const style = t[0] === "C" ? "classic" : t[0] === "G" ? "groove" : null;
      const height = t[1] === "S" ? "short" : t[1] === "L" ? "long" : null;
      if (!style || !height) throw new Error("Bad knob style or height.");
      if (!variantOk(style, height)) throw new Error("Classic long knobs do not exist.");
      knobs[slot] = { style, height, body: col(t.slice(2, 4)), cap: col(t.slice(4, 6)) };
    });
  });
  if (mode === "knobs") return { mode, body: "WH", accent: "WH", side: null, bezel: null, badge: null, logo: null, knobs };
  const F = get("F");
  if (F.length < 4 || F.length > 6) throw new Error("Code has the wrong number of faceplate fields.");
  const fwCode = F[4] ?? "-";
  const badge = fwCode === "-" ? null : FIRMWARES.find((f) => FW_CODE[f] === fwCode);
  if (badge === undefined) throw new Error("Unknown bezel badge: " + fwCode);
  return {
    mode, knobs, body: col(F[0]), accent: col(F[1]),
    side: F[2] === "-" ? null : col(F[2]),
    bezel: F[3] === "=" ? null : F[3] === "-" ? NO_BEZEL : col(F[3]),
    badge,
    logo: F[5] === undefined || F[5] === "-" ? null : col(F[5]),
  };
}

/** Old POKZ grid codes look like RD_BL_GN_WH/...; FM1 codes carry a prefix. */
export const isFm1Code = (raw: string) => /^\s*FM1(v2|k1)\|/.test(raw);
