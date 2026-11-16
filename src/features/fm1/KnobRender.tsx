import { useEffect, useRef, useState } from "react";

// High quality knob preview made ONLY from images, so the real model never reaches the browser.
// public/renders/manifest.json (see public/renders/README.md) has one shared "base" (the faceplate with its
// hole), caps shared by height (short / long, plus the volume knob's own cap) and a body per set. The picture is
// stacked base, body, cap; body and cap are tinted with the buyer's colors (multiply keeps the shading) and each
// picture's own alpha is its mask. The volume knob is the one different knob of a set: body vol_<style>_<height>.
// Anything missing for a knob = nothing is drawn.
interface Manifest { base?: string; caps: Record<string, string>; knobs: Record<string, { body: string; cap?: string }> }

const BASE = `${import.meta.env.BASE_URL}renders/`;
let manifest: Promise<Manifest> | null = null;
const loadManifest = () =>
  (manifest ??= fetch(`${BASE}manifest.json`)
    .then((r): Promise<Partial<Manifest>> => (r.ok ? r.json() : Promise.resolve({})))
    .then((j) => ({ base: j.base, caps: j.caps ?? {}, knobs: j.knobs ?? {} }) as Manifest)
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

/** Multiplying by a very dark color kills all the shading (black x anything = black), so dark colors are lifted
 *  to a floor: black stays clearly black but its volume, grooves and highlights stay visible. */
const FLOOR = 56;
function lifted(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(v, FLOOR));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** The render multiplied by a color, kept inside its own alpha. */
function tinted(img: HTMLImageElement, color: string, W: number, H: number) {
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
  return c;
}

export function KnobRender({ style, height, slot, body, cap, size = 120, fluid = false, className = "" }: {
  slot?: string;   // knob slot, only used to find a volume-knob specific render
  style: string;
  height: string;
  body: string;   // hex
  cap: string;    // hex
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
      if (!body_ || !cap_) { if (!dead) setMissing(true); return; }
      const [b, c, base] = await Promise.all([loadImg(body_), loadImg(cap_), m.base ? loadImg(m.base) : Promise.resolve(null)]);
      if (dead || !ref.current) return;
      setMissing(false);
      const canvas = ref.current;
      const { width: W, height: H } = canvas;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);
      if (base) ctx.drawImage(base, 0, 0, W, H);
      ctx.drawImage(tinted(b, body, W, H), 0, 0);
      ctx.drawImage(tinted(c, cap, W, H), 0, 0);
    })().catch(() => { if (!dead) setMissing(true); });
    return () => { dead = true; };
  }, [style, height, slot, body, cap]);

  // always rendered (hidden when there is no picture): the effect needs the canvas to draw the next variant
  return <canvas ref={ref} hidden={missing} width={size * 2} height={size * 2} style={fluid ? { width: "100%", height: "auto" } : { width: size, height: size }} className={className} aria-label="Knob preview" />;
}
