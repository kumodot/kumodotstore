import { useEffect, useRef } from "react";

// Cycles through a few labels, each one arriving with the same letter shuffle as Scramble.
// Driven by the clock, so several buttons on one page always show the same label at the same time.
// The box keeps the width of the longest label, so the button never jumps.
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/-%";

export function GlitchSwap({ texts, every = 3200 }: { texts: string[]; every?: number }) {
  const el = useRef<HTMLSpanElement>(null);
  const key = texts.join("|");

  useEffect(() => {
    const node = el.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0, timer = 0;
    const at = () => Math.floor(Date.now() / every) % texts.length;
    node.textContent = texts[at()];
    const show = (text: string) => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 420);
        let out = "";
        for (let k = 0; k < text.length; k++) {
          out += text[k] === " " || t >= 0.2 + 0.8 * ((k + 1) / text.length) ? text[k] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        node.textContent = t < 1 ? out : text;
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const next = () => { timer = window.setTimeout(() => { show(texts[at()]); next(); }, every - (Date.now() % every)); };
    next();
    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, every]);

  const longest = texts.reduce((a, b) => (b.length > a.length ? b : a), "");
  return (
    <span className="inline-grid">
      <span aria-hidden className="invisible col-start-1 row-start-1">{longest}</span>
      <span ref={el} className="col-start-1 row-start-1">{texts[0]}</span>
    </span>
  );
}
