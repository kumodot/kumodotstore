import { useEffect, useRef, useState, type ReactNode } from "react";

// A little 1-bit "signalbug" (the critters from the kumodot.art portfolio, public/critters) walking back and forth
// on top of its parent box. White pixels take the accent color, black pixels the page background (an outline that
// reads on any border). Put it inside a `relative` box: it walks along that box's top edge.
const BASE = `${import.meta.env.BASE_URL}critters/`;
const FRAMES: Record<number, number> = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 1, 12: 1, 13: 1, 14: 1 };
const SIZE = 25;   // the sprites are 50 px on a 2 or 4 px grid: half size keeps every pixel sharp

const hexRgb = (h: string) => { const n = parseInt(h.replace("#", ""), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };

async function framesFor(type: number, fg: string, bg: string): Promise<string[]> {
  const ims = await Promise.all(Array.from({ length: FRAMES[type] }, (_, f) => new Promise<HTMLImageElement | null>((res) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = `${BASE}signalbug_${String(type).padStart(2, "0")}_${String(f + 1).padStart(2, "0")}.png`;
  })));
  const F = hexRgb(fg), B = hexRgb(bg);
  // feet on the line: shift the sprite down so its lowest white pixel (over all frames) touches the bottom
  let low = -1;
  const datas = ims.map((im) => {
    if (!im) return null;
    const c = document.createElement("canvas"); c.width = im.width; c.height = im.height;
    const x = c.getContext("2d")!; x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < d.data.length; i += 4) if (d.data[i + 3] && d.data[i] + d.data[i + 1] + d.data[i + 2] > 382) low = Math.max(low, Math.floor(i / 4 / c.width));
    return { im, w: c.width, h: c.height };
  });
  return datas.map((e) => {
    if (!e) return "";
    const c = document.createElement("canvas"); c.width = e.w; c.height = e.h;
    const x = c.getContext("2d")!;
    x.drawImage(e.im, 0, low >= 0 ? e.h - 1 - low : 0);
    const d = x.getImageData(0, 0, e.w, e.h); const a = d.data;
    for (let i = 0; i < a.length; i += 4) {
      if (!a[i + 3]) continue;
      const col = a[i] + a[i + 1] + a[i + 2] > 382 ? F : B;
      a[i] = col[0]; a[i + 1] = col[1]; a[i + 2] = col[2]; a[i + 3] = 255;
    }
    x.putImageData(d, 0, 0);
    return c.toDataURL();
  });
}

/** say: a speech bubble over the critter while set (it stops walking to talk). */
export function CritterWalker({ color = "#FF5A1F", bg = "#0D0D0C", say = null, onBubbleHover }: {
  color?: string; bg?: string; say?: ReactNode; onBubbleHover?: (over: boolean) => void;   // the bubble can hold a link
}) {
  const lane = useRef<HTMLDivElement>(null);
  const bug = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const talking = useRef(false);
  useEffect(() => { talking.current = !!say; }, [say]);
  const [type] = useState(() => 1 + Math.floor(Math.random() * 14));
  const [frames, setFrames] = useState<string[]>([]);

  useEffect(() => { let dead = false; void framesFor(type, color, bg).then((f) => { if (!dead) setFrames(f); }); return () => { dead = true; }; }, [type, color, bg]);

  useEffect(() => {
    if (!frames.length) return;
    const el = bug.current!, ln = lane.current!;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let x = Math.random() * Math.max(0, ln.clientWidth - SIZE), dir = Math.random() < 0.5 ? -1 : 1;
    let pause = 0, tick = 0, f = 0, last = performance.now(), raf = 0;
    const step = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const max = Math.max(0, ln.clientWidth - SIZE);
      let moving = false;
      if (still) { x = Math.min(x, max); }
      else if (talking.current) { /* stands still while it talks */ }
      else if (pause > 0) pause -= dt;
      else {
        x += dir * 16 * dt; moving = true;
        if (x <= 0) { x = 0; dir = 1; } else if (x >= max) { x = max; dir = -1; }
        if (Math.random() < dt * 0.25) pause = 0.8 + Math.random() * 1.8;   // stop now and then, look around
      }
      tick += dt;
      if (moving && tick > 0.22) { tick = 0; f = (f + 1) % 2; }
      const two = frames.length > 1;
      const img = frames[two && moving ? f : 0];
      if (el.dataset.src !== img) { el.style.backgroundImage = `url(${img})`; el.dataset.src = img; }
      const bob = !two && moving && f === 1 ? -1 : 0;   // one-frame critters bob a pixel while walking
      el.style.transform = `translate(${x}px, ${bob}px) scaleX(${dir})`;
      const bb = bubble.current;
      if (bb) {   // the bubble follows the critter, kept from running past the right edge (the page edge is there)
        const bw = bb.offsetWidth, lw = ln.clientWidth;
        const left = Math.min(x + SIZE / 2 - bw / 2, lw - bw);
        bb.style.transform = `translateX(${left}px)`;
        bb.style.setProperty("--tail", `${Math.max(10, Math.min(bw - 10, x + SIZE / 2 - left))}px`);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [frames]);

  return (
    <div ref={lane} aria-hidden="true" className="absolute left-0 right-0 bottom-full pointer-events-none" style={{ height: SIZE }}>
      <div ref={bug} className="absolute left-0 bottom-0" style={{ width: SIZE, height: SIZE, backgroundSize: "100% 100%", imageRendering: "pixelated", transformOrigin: "50% 100%" }} />
      {say && (
        <div ref={bubble} role="status" onPointerEnter={() => onBubbleHover?.(true)} onPointerLeave={() => onBubbleHover?.(false)}
          className="critter-bubble pointer-events-auto absolute z-20 left-0 bottom-full mb-1.5 w-56 px-2.5 py-1.5 bg-[#F4F1EA] text-[#0D0D0C] text-[11px] leading-snug normal-case tracking-normal shadow-lg">
          {say}
        </div>
      )}
    </div>
  );
}
