import { useEffect, useRef, useState } from "react";

// High quality knob preview made ONLY from images, so the real model never reaches the browser.
// For each variant (public/renders/manifest.json) there are three images, see public/renders/README.md:
//   render  neutral clay render (gray shading, light background removed),
//   body    mask of the body (alpha), cap  mask of the cap (alpha).
// The volume knob has its own cap shape: an entry named vol_<style>_<height> is used for it first.
// The picture is composed on a canvas: body and cap are tinted with the buyer's colors, then the
// render is multiplied on top for the shading. No manifest entry for a variant = renders nothing.
interface Entry { render: string; body: string; cap: string }

const BASE = `${import.meta.env.BASE_URL}renders/`;
let manifest: Promise<Record<string, Entry>> | null = null;
const loadManifest = () =>
  (manifest ??= fetch(`${BASE}manifest.json`)
    .then((r) => (r.ok ? r.json() : { knobs: {} }))
    .then((j) => (j.knobs ?? {}) as Record<string, Entry>)
    .catch(() => ({} as Record<string, Entry>)));

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

function layer(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function compose(canvas: HTMLCanvasElement, render: HTMLImageElement, body: HTMLImageElement, cap: HTMLImageElement, bodyHex: string, capHex: string) {
  const { width: W, height: H } = canvas;
  const ctx = canvas.getContext("2d")!;
  const tint = (mask: HTMLImageElement, color: string) => {
    const c = layer(W, H);
    const x = c.getContext("2d")!;
    x.drawImage(mask, 0, 0, W, H);
    x.globalCompositeOperation = "source-in";
    x.fillStyle = color;
    x.fillRect(0, 0, W, H);
    return c;
  };
  const shape = layer(W, H);
  const sx = shape.getContext("2d")!;
  sx.drawImage(body, 0, 0, W, H);
  sx.drawImage(cap, 0, 0, W, H);

  ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(tint(body, bodyHex), 0, 0);
  ctx.drawImage(tint(cap, capHex), 0, 0);
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(render, 0, 0, W, H);
  ctx.globalCompositeOperation = "destination-in";   // keep only the knob shape
  ctx.drawImage(shape, 0, 0);
  ctx.globalCompositeOperation = "source-over";
}

export function KnobRender({ style, height, slot, body, cap, size = 120, className = "" }: {
  slot?: string;   // knob slot, only used to find a volume-knob specific render
  style: string;
  height: string;
  body: string;   // hex
  cap: string;    // hex
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let dead = false;
    (async () => {
      const m = await loadManifest();
      const e = (slot === "vol" ? m[`vol_${style}_${height}`] : undefined) ?? m[`${style}_${height}`];
      if (!e) { if (!dead) setMissing(true); return; }
      const [r, b, c] = await Promise.all([loadImg(e.render), loadImg(e.body), loadImg(e.cap)]);
      if (dead || !ref.current) return;
      setMissing(false);
      compose(ref.current, r, b, c, body, cap);
    })().catch(() => { if (!dead) setMissing(true); });
    return () => { dead = true; };
  }, [style, height, slot, body, cap]);

  if (missing) return null;
  return <canvas ref={ref} width={size * 2} height={size * 2} style={{ width: size, height: size }} className={className} aria-label="Knob preview" />;
}
