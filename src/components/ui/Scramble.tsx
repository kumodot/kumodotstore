import { useEffect, useRef } from "react";

// Hover scramble for mono labels, ported from kumodot.art: letters shuffle and
// settle left to right. Time scales with word length (22ms/letter, 140-450ms).
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/-";

export function Scramble({ text }: { text: string }) {
  const el = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = el.current!;
    const host = (node.closest("a, button") as HTMLElement | null) ?? node;
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // quick: names must be readable at once (the site's 60ms/letter felt slow on long theme names)
      const total = Math.min(450, Math.max(140, text.replace(/\s/g, "").length * 22));
      const start = performance.now();
      let last = 0;
      let noise: string[] = [];
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / total);
        if (now - last > 40 || !noise.length) {
          noise = Array.from(text, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]);
          last = now;
        }
        let out = "";
        for (let i = 0; i < text.length; i++) {
          const settle = 0.2 + 0.8 * ((i + 1) / text.length);
          out += text[i] === " " || t >= settle ? text[i] : noise[i];
        }
        node.textContent = out;
        if (t < 1) raf = requestAnimationFrame(tick);
        else node.textContent = text;
      };
      raf = requestAnimationFrame(tick);
    };
    host.addEventListener("mouseenter", run);
    host.addEventListener("focus", run);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("mouseenter", run);
      host.removeEventListener("focus", run);
    };
  }, [text]);

  return <span ref={el}>{text}</span>;
}
