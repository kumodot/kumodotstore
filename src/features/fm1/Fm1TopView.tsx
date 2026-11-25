import { useId, type ReactNode } from "react";
import { bezelId, GROUPS, NO_BEZEL, SLOT_LABEL, type Fm1Build, type Slot } from "./fm1Code.ts";
import { FM1_TOP } from "./fm1TopShapes.ts";
import { logoColor } from "./fm1Color.ts";
import { fitLogo, useLogo } from "./fm1Logo.ts";
import { JIANT_BEZEL } from "./jiantBezel.ts";
import { firmwareById } from "../../data/firmwares.ts";
import { hasCap } from "../../data/knobAvailability.ts";

// Top view of the FM1 built from the vectorized reference (fm1TopShapes.ts). One component draws both
// the filmstrip thumbnails (no handlers) and the big click-to-customize panel (handlers + group frames).
// Layers, bottom to top: device body, rubber keys, screen, faceplate (with real cutouts), bezel, knobs.
// With no faceplate (knobs-only mode) the device itself shows.
type FpPart = "body" | "accent" | "side" | "bezel" | "logo";

export interface TopViewInteraction {
  selKnob: Slot | null;
  selFp: FpPart | null;                         // highlight on the faceplate or the bezel
  selGroup: { g: "L" | "R"; part: "body" | "cap" } | null;
  groupVal: (g: "L" | "R", part: "body" | "cap") => string | null;   // null = mixed
  onKnob: (s: Slot, part: "body" | "cap") => void;
  onFaceplate: () => void;
  onBezel: () => void;
  onLogo: () => void;
  onGroup: (g: "L" | "R", part: "body" | "cap") => void;
  hover: { slot?: Slot; part?: "body" | "cap"; fp?: FpPart; group?: { g: "L" | "R"; part: "body" | "cap" } } | null;           // what the mouse is over (2D or 3D)
  onHover: (h: { slot?: Slot; part?: "body" | "cap"; fp?: FpPart; group?: { g: "L" | "R"; part: "body" | "cap" } } | null) => void;
  label?: string;                                       // name of the part being edited, shown on the empty key area
}

const ORANGE = "#FF5A1F";

/** Bounding box of an "M x y L x y ... Z" path. */
function bbox(d: string) {
  const n = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2 === 1);
  const x = Math.min(...xs), y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}
const BEZEL_BOX = bbox(FM1_TOP.bezelOuter);
// Badge bezel: the same ring plus a strip below the screen for the firmware name (same numbers as GLB v0.6).
const BADGE_EXTRA = 98;   // the extended bezel's strip runs down to the top line of the keyboard
const rrect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
// The logo area on the strip: from just under the screen hole down to the bezel edge, as wide as the hole.
const SCREEN_BOX = bbox(FM1_TOP.screen);
const LOGO_TOP = SCREEN_BOX.y + SCREEN_BOX.h + 4;
/** The badge bezel and its logo area. `grow` stretches the strip down over the keys (JIANT's own bezel is taller). */
const JIANT_BOX = bbox(JIANT_BEZEL.outer);
const stripGeom = (grow: number, jiant = false) => {
  if (jiant) return { extra: JIANT_BOX.y + JIANT_BOX.h - (BEZEL_BOX.y + BEZEL_BOX.h), outer: JIANT_BEZEL.outer, logo: JIANT_BEZEL.logo, box: JIANT_BOX };   // JIANT: its own bezel outline (from the studio model)
  const extra = BADGE_EXTRA + grow;
  return {
    extra,
    box: { ...BEZEL_BOX, h: BEZEL_BOX.h + extra },
    outer: rrect(BEZEL_BOX.x, BEZEL_BOX.y, BEZEL_BOX.w, BEZEL_BOX.h + extra, 46),
    logo: { x: SCREEN_BOX.x, y: LOGO_TOP, w: SCREEN_BOX.w, h: BEZEL_BOX.y + BEZEL_BOX.h + extra - 14 - LOGO_TOP },
  };
};

/** Four corner marks around a box (a "this is selected" hint), near-white, no outline. */
function Brackets({ x, y, w, h, pad, len, soft }: { x: number; y: number; w: number; h: number; pad: number; len: number; soft?: boolean }) {
  const x0 = x - pad, y0 = y - pad, x1 = x + w + pad, y1 = y + h + pad;
  const d = `M${x0} ${y0 + len}V${y0}H${x0 + len}M${x1 - len} ${y0}H${x1}V${y0 + len}M${x1} ${y1 - len}V${y1}H${x1 - len}M${x0 + len} ${y1}H${x0}V${y1 - len}`;
  // a thin dark halo under the light stroke keeps the marks readable on light and dark faceplates
  return (
    <g fill="none" strokeLinecap="square" pointerEvents="none" opacity={soft ? 0.75 : 1}>
      <path d={d} stroke="#0D0D0C" strokeOpacity=".7" strokeWidth={soft ? 12 : 16} />
      <path d={d} stroke="#F8F6F0" strokeWidth={soft ? 5 : 8} />
    </g>
  );
}
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const lum = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

export function Fm1TopView({ build, hex, tr, factory, ix, className = "w-full h-full", bare = false }: {
  build: Fm1Build;
  hex: (id: string) => string;
  tr?: (id: string) => boolean;   // translucent colors: the knob is drawn faded with diagonal stripes
  factory: { body: string; keys: string };
  ix?: TopViewInteraction;
  className?: string;
  bare?: boolean;   // no dark backdrop of its own (a card behind it shows through)
}): ReactNode {
  const hatch = useId();
  const stripes = useId();
  const { w, h, outline, keys, bezelOuter, screen, holes } = FM1_TOP;
  const plate = build.mode === "case";
  const slots = Object.keys(holes) as Slot[];
  const pad = 40;
  const hoverable = ix ? "cursor-pointer" : "";

  const noBezel = build.bezel === NO_BEZEL;           // deleted: only the screen window is left
  const badge = plate && build.badge !== null && !noBezel;
  const fw = build.badge ? firmwareById(build.badge) : undefined;
  const G = stripGeom(0, fw?.bezel === "jiant");
  const showLogo = badge && !!fw?.logo;   // BLANK: nothing at all on the strip
  const logo = useLogo(badge ? fw?.logo ?? null : null);
  const maskId = useId();
  // the logo area, scaled around its center by the firmware's `scale` (the mask grows with it so nothing is cut)
  const sc = fw?.bezel === "jiant" ? 1 : fw?.scale ?? 1;   // JIANT's logo area is the real logo of the model
  const LA = { x: G.logo.x + G.logo.w * (1 - sc) / 2, y: G.logo.y + G.logo.h * (1 - sc) / 2, w: G.logo.w * sc, h: G.logo.h * sc };
  const fit = logo ? fitLogo(logo, LA.x, LA.y, LA.w, LA.h) : null;
  const logoFill = build.logo ? hex(build.logo) : logoColor(hex(build.accent), hex(bezelId(build)));
  const outerBezel = badge ? G.outer : bezelOuter;
  const bezelBox = badge ? G.box : BEZEL_BOX;
  const plateD = [outline, ...slots.map((s) => circle(holes[s].cx, holes[s].cy, holes[s].r)), ...keys, noBezel ? screen : outerBezel].join("");
  const bezelD = outerBezel + (fw?.bezel === "jiant" && badge ? JIANT_BEZEL.hole : screen);   // JIANT: its own wavy window, so the waves stay
  const bezelColor = hex(bezelId(build));

  return (
    <svg viewBox={`${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}`} className={className} role="img" aria-label="FM1 top view">
      <defs>
        <pattern id={hatch} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="7" height="14" fill="#bbb" /><rect x="7" width="7" height="14" fill="#555" />
        </pattern>
        <pattern id={stripes} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="14" fill="#fff" fillOpacity=".55" />
        </pattern>
      </defs>
      {!bare && <rect x={-pad} y={-pad} width={w + 2 * pad} height={h + 2 * pad} fill="#0D0D0C" />}

      <path d={outline} fill={factory.body} />
      {keys.map((d, i) => <path key={i} d={d} fill={factory.keys} />)}
      <path d={screen} fill="#050505" />
      {/* the big unused key area shows the name of the part being edited / hovered, like the label on the 3D view */}
      {ix?.label && (() => {
        const b = bbox(keys[0]), fs = Math.min(76, (b.w - 140) / (ix.label.length * 0.66)), tw = Math.min(b.w - 40, ix.label.length * fs * 0.66 + 80);
        return (
          <g pointerEvents="none">
            <rect x={b.x + b.w / 2 - tw / 2} y={b.y + b.h / 2 - fs * 0.85} width={tw} height={fs * 1.7} fill="#0D0D0C" fillOpacity=".8" />
            <text x={b.x + b.w / 2} y={b.y + b.h / 2} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={fs} className="ks">{ix.label}</text>
          </g>
        );
      })()}

      {plate && (
        <>
          <path d={plateD} fillRule="evenodd" fill={hex(build.body)} stroke="#000" strokeOpacity=".3" strokeWidth="6"
            className={hoverable} onClick={ix?.onFaceplate}
            onPointerEnter={ix ? () => ix.onHover({ fp: "body" }) : undefined}
            onPointerLeave={ix ? () => ix.onHover(null) : undefined}
            style={ix?.hover?.fp && ix.hover.fp !== "bezel" && ix.hover.fp !== "logo" ? { filter: "brightness(1.18)" } : undefined} />
          <path d={outline} fill="none" stroke={hex(build.side ?? build.body)} strokeWidth="10" strokeLinejoin="round" pointerEvents="none" />
          {!noBezel && <path d={bezelD} fillRule="evenodd" fill={bezelColor} className={hoverable} onClick={ix?.onBezel}
            onPointerEnter={ix ? () => ix.onHover({ fp: "bezel" }) : undefined}
            onPointerLeave={ix ? () => ix.onHover(null) : undefined}
            style={ix?.hover?.fp === "bezel" ? { filter: "brightness(1.3)" } : undefined} />}
          {showLogo && (
            <>
              {/* the firmware logo (its SVG tinted with the logo color); BLANK has none, only the clickable strip */}
              {fit && logo && (
                <>
                  <mask id={maskId} maskUnits="userSpaceOnUse" x={Math.min(G.logo.x, LA.x)} y={Math.min(G.logo.y, LA.y)} width={Math.max(G.logo.w, LA.w)} height={Math.max(G.logo.h, LA.h)} style={{ maskType: "alpha" }}>
                    <image href={`${import.meta.env.BASE_URL}logos/${fw!.logo}`} x={fit.x} y={fit.y} width={fit.w} height={fit.h} />
                  </mask>
                  <rect x={Math.min(G.logo.x, LA.x)} y={Math.min(G.logo.y, LA.y)} width={Math.max(G.logo.w, LA.w)} height={Math.max(G.logo.h, LA.h)} fill={logoFill} mask={`url(#${maskId})`} pointerEvents="none" />
                </>
              )}
              <rect x={G.logo.x} y={G.logo.y} width={G.logo.w} height={G.logo.h} rx="8" fill="transparent"
                className={hoverable} onClick={ix?.onLogo}
                onPointerEnter={ix ? () => ix.onHover({ fp: "logo" }) : undefined}
                onPointerLeave={ix ? () => ix.onHover(null) : undefined} />
            </>
          )}
          {ix?.hover?.fp === "bezel" && ix.selFp !== "bezel" && <Brackets x={bezelBox.x} y={bezelBox.y} w={bezelBox.w} h={bezelBox.h} pad={30} len={60} soft />}
          {ix?.hover?.fp && ix.hover.fp !== "bezel" && ix.hover.fp !== "logo" && <Brackets x={0} y={0} w={w} h={h} pad={46} len={90} soft />}
          {showLogo && ix?.hover?.fp === "logo" && ix.selFp !== "logo" && <Brackets x={G.logo.x} y={G.logo.y} w={G.logo.w} h={G.logo.h} pad={16} len={30} soft />}
          {showLogo && ix?.selFp === "logo" && <Brackets x={G.logo.x} y={G.logo.y} w={G.logo.w} h={G.logo.h} pad={10} len={34} />}
          {/* selection hint: four corner brackets on the shape's bounding box, no outline */}
          {ix && (ix.selFp === "body" || ix.selFp === "side" || ix.selFp === "accent") && (
            <Brackets x={0} y={0} w={w} h={h} pad={26} len={110} />
          )}
          {ix?.selFp === "bezel" && <Brackets x={bezelBox.x} y={bezelBox.y} w={bezelBox.w} h={bezelBox.h} pad={16} len={70} />}
        </>
      )}

      {ix && (["L", "R"] as const).map((g) => {
        const hs = GROUPS[g].map((s) => holes[s]);
        const x0 = Math.min(...hs.map((q) => q.cx - q.r)) - 30, x1 = Math.max(...hs.map((q) => q.cx + q.r)) + 30;
        const y0 = Math.min(...hs.map((q) => q.cy - q.r)) - 44, y1 = Math.max(...hs.map((q) => q.cy + q.r)) + 30;
        return (
          <g key={g}>
            <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx="16" fill="none" stroke="#9aa0a6" strokeWidth="4" strokeDasharray="16 12" pointerEvents="none" />
            {(["body", "cap"] as const).map((part, i) => {
              const v = ix.groupVal(g, part);
              const on = ix.selGroup?.g === g && ix.selGroup.part === part;
              const cx = x0 + 52 + i * 62;
              return (
                <g key={part} className="cursor-pointer" onClick={() => ix.onGroup(g, part)}
                  onPointerEnter={() => ix.onHover({ group: { g, part } })} onPointerLeave={() => ix.onHover(null)}>
                  <circle cx={cx} cy={y0} r="26" fill={v ? hex(v) : `url(#${hatch})`} stroke={on ? ORANGE : "#0D0D0C"} strokeWidth={on ? 8 : 5} />
                  {part === "cap" && <circle cx={cx} cy={y0} r="9" fill="#0D0D0C" />}
                </g>
              );
            })}
          </g>
        );
      })}

      {slots.map((s) => {
        const { cx, cy, r } = holes[s];
        const k = build.knobs[s];
        const capped = hasCap(k.style, k.height);   // some models take no cap: the body is the whole knob
        const ink = lum(hex(capped ? k.cap : k.body)) > 0.55 ? "#0D0D0C" : "#EEECE6";
        return (
          <g key={s} className={hoverable} onPointerLeave={ix ? () => ix.onHover(null) : undefined}
            style={ix?.hover?.slot === s ? { filter: "brightness(1.25)" } : undefined}>
            {plate && !ix && <rect x={cx - r * 0.55} y={cy + r + 12} width={r * 1.1} height="9" fill={hex(build.accent)} />}
            <circle cx={cx} cy={cy} r={r * 0.9} fill={hex(k.body)} fillOpacity={tr?.(k.body) ? 0.6 : 1} stroke="#0D0D0C" strokeWidth="6" pointerEvents="none" />
            {tr?.(k.body) && <circle cx={cx} cy={cy} r={r * 0.9} fill={`url(#${stripes})`} pointerEvents="none" />}
            {capped && <circle cx={cx} cy={cy} r={r * 0.52} fill={hex(k.cap)} fillOpacity={tr?.(k.cap) ? 0.6 : 1} stroke="#0D0D0C" strokeWidth="3" pointerEvents="none" />}
            {capped && tr?.(k.cap) && <circle cx={cx} cy={cy} r={r * 0.52} fill={`url(#${stripes})`} pointerEvents="none" />}
            {ix && (
              <>
                {/* two hit areas that never overlap: the body is a ring (donut), the cap is the disc inside it */}
                <path fillRule="evenodd" fill="transparent"
                  d={`${circle(cx, cy, r * 0.9)}${circle(cx, cy, r * 0.52)}`}
                  onClick={() => ix.onKnob(s, "body")} onPointerEnter={() => ix.onHover({ slot: s, part: "body" })} />
                <circle cx={cx} cy={cy} r={r * 0.52} fill="transparent"
                  onClick={() => ix.onKnob(s, capped ? "cap" : "body")} onPointerEnter={() => ix.onHover({ slot: s, part: capped ? "cap" : "body" })} />
              </>
            )}
            {ix?.hover?.slot === s && ix.selKnob !== s && <Brackets x={cx - r * 0.9} y={cy - r * 0.9} w={r * 1.8} h={r * 1.8} pad={24} len={30} soft />}
            {ix?.selKnob === s && <Brackets x={cx - r * 0.9} y={cy - r * 0.9} w={r * 1.8} h={r * 1.8} pad={12} len={34} />}
            {ix && (
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="38" fontFamily="'Martian Mono', monospace" fill={ink} pointerEvents="none">
                {SLOT_LABEL[s]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
