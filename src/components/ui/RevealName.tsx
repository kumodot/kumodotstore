import { useEffect, useRef, useState } from "react";

// A name that arrives with a show: first `from` in orange (e.g. "UNLOCKED !!!"), then the letters scramble with
// little 8-bit ticks and settle on `to`. Plays once, when it mounts.
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/-!";

export function RevealName({ from, to, hold = 1500, scramble = 900 }: { from: string; to: string; hold?: number; scramble?: number }) {
  const el = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const node = el.current!;
    let raf = 0, timer = 0;
    let ctx: AudioContext | null = null;
    const blip = () => {   // a very short square "tick"
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctx ??= new AC();
        const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
        o.type = "square";
        o.frequency.value = 900 + Math.random() * 900;
        g.gain.setValueAtTime(0.035, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
        o.connect(g).connect(ctx.destination);
        o.start(t); o.stop(t + 0.035);
      } catch { /* no audio */ }
    };
    const len = Math.max(from.length, to.length);
    node.textContent = from;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      timer = window.setTimeout(() => { node.textContent = to; setDone(true); }, hold);
      return () => clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      const start = performance.now();
      let last = 0;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / scramble);
        if (now - last > 45) {
          last = now;
          let out = "";
          for (let i = 0; i < len; i++) {
            const settle = 0.25 + 0.75 * ((i + 1) / len);
            const ch = to[i] ?? "";
            out += t >= settle ? ch : ch === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
          node.textContent = out.trimEnd();
          blip();
        }
        if (t < 1) raf = requestAnimationFrame(tick);
        else { node.textContent = to; setDone(true); window.setTimeout(() => void ctx?.close(), 300); }
      };
      raf = requestAnimationFrame(tick);
    }, hold);
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, [from, to, hold, scramble]);

  return <span ref={el} className={done ? "" : "!text-accent"}>{from}</span>;
}
