import { useEffect, useRef, useState } from "react";
import { hasCap } from "../../data/knobAvailability.ts";
import { EXTRA_KNOBS } from "../../data/fm1Knobs.ts";

// High quality knob preview made ONLY from images, so the real model never reaches the browser.
// public/renders/manifest.json (see public/renders/README.md) has one shared "base" (the faceplate with its
// hole), caps shared by height (short / long, plus the volume knob's own cap) and a body per set. The picture is
// stacked base, body, cap; body and cap are tinted with the buyer's colors (multiply keeps the shading) and each
// picture's own alpha is its mask. The volume knob is the one different knob of a set: body vol_<style>_<height>.
// Anything missing for a knob = nothing is drawn.
interface Manifest { base?: string; caps: Record<string, string>; knobs: Record<string, { body: string; cap?: string; inner?: string }> }

const BASE = `${import.meta.env.BASE_URL}renders/`;
/** Knob models added in the Studio bring their own picture layers (src/data/fm1Knobs.ts, files in public/renders). */
function withExtras(m: Manifest): Manifest {
  for (const k of EXTRA_KNOBS) {
    const id = `${k.style}_${k.height}`, r = k.render;
    if (r?.body) m.knobs[id] = { body: r.body, ...(r.cap ? { cap: r.cap } : {}) };
    if (r?.volBody) m.knobs[`vol_${id}`] = { body: r.volBody, ...(r.volCap ? { cap: r.volCap } : {}) };
  }
  return m;
}
let manifest: Promise<Manifest> | null = null;
const loadManifest = () =>
  (manifest ??= fetch(`${BASE}manifest.json`)
    .then((r): Promise<Partial<Manifest>> => (r.ok ? r.json() : Promise.resolve({})))
    .then((j) => withExtras({ base: j.base, caps: j.caps ?? {}, knobs: j.knobs ?? {} } as Manifest))
    .catch(() => ({ caps: {}, knobs: {} }) as Manifest));

const images = new Map<string, Promise<HTMLImageElement>>();
const loadImg = (file: string) => {
  let p = images.get(file);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = BASE + file;
    });
    images.set(file, p);
  }
  return p;
};

/** Loads every knob picture in the background, so switching models over the 3D view never flashes. */
export function preloadKnobRenders() {
  void loadManifest().then((m) => {
    const files = [m.base, ...Object.values(m.caps), ...Object.values(m.knobs).flatMap((k) => [k.body, k.cap, k.inner])];
    files.forEach((f) => { if (f) void loadImg(f).catch(() => {}); });
  });
}

/** Multiplying by a very dark color kills all the shading (black x anything = black), so dark colors are lifted
 *  to a floor: black stays clearly black but its volume, grooves and highlights stay visible. */
const FLOOR = 56;
function lifted(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(v, FLOOR));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** For a model that takes no cap: red diagonal stripes inside the cap's mask, with "NO CAP" in white on two lines. */
function noCapLayer(mask: HTMLImageElement, W: number, H: number) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;
  // the stripes (same idea as the translucent-color stripes, in red), then keep only the cap's shape
  x.save();
  x.translate(W / 2, H / 2);
  x.rotate(Math.PI / 4);
  const step = Math.max(6, Math.round(W / 28));
  x.fillStyle = "rgba(220, 38, 38, 0.55)";
  for (let i = -W * 1.5; i < W * 1.5; i += step * 2) x.fillRect(i, -H * 1.5, step, H * 3);
  x.restore();
  x.globalCompositeOperation = "destination-in";
  x.drawImage(mask, 0, 0, W, H);
  x.globalCompositeOperation = "source-over";
  // center and size of the cap from its mask
  const d = x.getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y += 2) for (let xx = 0; xx < W; xx += 2) {
    if (d[(y * W + xx) * 4 + 3] > 8) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 <= x0) return c;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const fs = Math.max(8, Math.round((x1 - x0) * 0.2));
  x.font = `600 ${fs}px "Martian Mono", ui-monospace, monospace`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#ffffff";
  x.shadowColor = "rgba(0, 0, 0, 0.6)";
  x.shadowBlur = fs * 0.25;
  x.fillText("NO", cx, cy - fs * 0.6);
  x.fillText("CAP", cx, cy + fs * 0.6);
  return c;
}

/** The render multiplied by a color, kept inside its own alpha. */
function tinted(img: HTMLImageElement, color: string, W: number, H: number, alpha = 1) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const x = c.getContext("2d")!;
  x.drawImage(img, 0, 0, W, H);
  x.globalCompositeOperation = "multiply";
  x.fillStyle = lifted(color);
  x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = "destination-in";
  x.drawImage(img, 0, 0, W, H);
  if (alpha < 1) { x.globalCompositeOperation = "source-over"; x.globalAlpha = 1; }
  return c;
}

export function KnobRender({ style, height, slot, body, cap, bodyT = false, capT = false, size = 120, fluid = false, className = "" }: {
  slot?: string;   // knob slot, only used to find a volume-knob specific render
  style: string;
  height: string;
  body: string;   // hex
  cap: string;    // hex
  bodyT?: boolean;   // the body / cap color is translucent: drawn with transparency
  capT?: boolean;
  size?: number;
  fluid?: boolean;   // fill the parent width (size only sets the canvas resolution)
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let dead = false;
    (async () => {
      const m = await loadManifest();
      const vol = slot === "vol";
      const body_ = m.knobs[`${vol ? "vol_" : ""}${style}_${height}`]?.body;
      const own = m.knobs[`${vol ? "vol_" : ""}${style}_${height}`]?.cap;   // a set can bring its own cap picture
      const cap_ = own ?? (vol ? (m.caps[`vol_${height}`] ?? m.caps.vol) : m.caps[height]);
      const capped = hasCap(style, height);   // a model that takes no cap: no cap layer
      if (!body_ || (capped && !cap_)) { if (!dead) setMissing(true); return; }
      const innerFile = m.knobs[`${vol ? "vol_" : ""}${style}_${height}`]?.inner;   // the black core: seen through translucent colors
      const [b, c, base, inner] = await Promise.all([loadImg(body_), cap_ ? loadImg(cap_) : Promise.resolve(null), m.base ? loadImg(m.base) : Promise.resolve(null), innerFile ? loadImg(innerFile) : Promise.resolve(null)]);
      if (dead || !ref.current) return;
      setMissing(false);
      const canvas = ref.current;
      const { width: W, height: H } = canvas;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);
      if (base) ctx.drawImage(base, 0, 0, W, H);
      if (inner) ctx.drawImage(tinted(inner, "#000000", W, H), 0, 0);
      ctx.globalAlpha = bodyT ? 0.6 : 1;
      ctx.drawImage(tinted(b, body, W, H), 0, 0);
      ctx.globalAlpha = capT ? 0.6 : 1;
      if (c && capped) ctx.drawImage(tinted(c, cap, W, H), 0, 0);
      else if (c) ctx.drawImage(noCapLayer(c, W, H), 0, 0);   // a model that takes no cap: red hatch in the cap's place
      ctx.globalAlpha = 1;
    })().catch(() => { if (!dead) setMissing(true); });
    return () => { dead = true; };
  }, [style, height, slot, body, cap, bodyT, capT]);

  // always rendered (hidden when there is no picture): the effect needs the canvas to draw the next variant
  return <canvas ref={ref} hidden={missing} width={size * 2} height={size * 2} style={fluid ? { width: "100%", height: "auto" } : { width: size, height: size }} className={className} aria-label="Knob preview" />;
}
