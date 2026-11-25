import { useEffect, useRef } from "react";

/** A short 2D confetti shower over the whole window. Mount it to play, it removes itself after `ms`. */
export function Confetti({ ms = 3200, onDone }: { ms?: number; onDone?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; });
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; };
    resize();
    addEventListener("resize", resize);
    const colors = ["#FF5A1F", "#F5C518", "#3DDC84", "#4AA3FF", "#B36BFF", "#FFFFFF", "#FF4D6D"];
    const n = Math.round(Math.min(260, innerWidth / 5));
    const bits = Array.from({ length: n }, () => ({
      x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.6,
      vx: (Math.random() - 0.5) * 2.2, vy: 1.5 + Math.random() * 3,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.25,
      w: 6 + Math.random() * 7, h: 3 + Math.random() * 5, col: colors[(Math.random() * colors.length) | 0],
      sway: Math.random() * Math.PI * 2,
    }));
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const age = t - t0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.globalAlpha = age > ms - 700 ? Math.max(0, (ms - age) / 700) : 1;
      for (const b of bits) {
        b.sway += 0.05; b.x += b.vx + Math.sin(b.sway) * 0.8; b.y += b.vy; b.vy += 0.03; b.r += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.scale(1, Math.cos(b.sway * 1.7));
        ctx.fillStyle = b.col; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
      }
      if (age < ms) raf = requestAnimationFrame(step); else done.current?.();
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, [ms]);
  return <canvas ref={ref} aria-hidden="true" className="fixed inset-0 w-screen h-screen pointer-events-none z-[100]" />;
}
