import { useCallback, useEffect, useRef, useState, type ElementType } from "react";

// Kumo Signal glitch letters for titles, ported from kumodot.art: 1-2 letters swap
// to a glitch style for 150-400ms, on hover and in short random bursts while the
// title is on screen. The sets come from the font's GSUB features (see styles.css).
const G_SETS: Record<string, string> = {
  "g-hollow": "689BDOPQRÒÓÔÕÖ",
  "g-lo": "!.689:BDMNOPQRW·–—…",
  "g-hi": "#$%&()*/0123457<>?@ACGJKSUVXYZ[]°×‘’“”",
};
const optionsFor = (ch: string) => {
  const c = ch.toUpperCase();
  if (!c.trim()) return [];
  const o = Object.keys(G_SETS).filter((k) => G_SETS[k].includes(c));
  if (/[A-Z0-9À-ÖØ-Þ]/.test(c)) o.push("g-slice");
  return o;
};
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export function GlitchTitle({ text, as: Tag = "span", className = "", auto = true }: {
  text: string;
  as?: ElementType;
  className?: string;
  auto?: boolean;
}) {
  const [hits, setHits] = useState<Record<number, string>>({});
  const busy = useRef(false);
  const ref = useRef<HTMLElement>(null);

  const glitch = useCallback(() => {
    if (busy.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const spots = Array.from(text).map((ch, i) => ({ i, o: optionsFor(ch) })).filter((s) => s.o.length);
    if (!spots.length) return;
    const next: Record<number, string> = {};
    for (let n = Math.min(spots.length, Math.random() < 0.55 ? 1 : 2); n > 0; n--) {
      const s = spots[(Math.random() * spots.length) | 0];
      next[s.i] = s.o[(Math.random() * s.o.length) | 0];
    }
    busy.current = true;
    setHits(next);
    setTimeout(() => { setHits({}); busy.current = false; }, rnd(150, 400));
  }, [text]);

  // hovering the surrounding link or button glitches the title too
  useEffect(() => {
    const host = ref.current?.closest("a, button");
    if (!host) return;
    host.addEventListener("mouseenter", glitch);
    host.addEventListener("focus", glitch);
    return () => { host.removeEventListener("mouseenter", glitch); host.removeEventListener("focus", glitch); };
  }, [glitch]);

  // short random bursts while on screen
  useEffect(() => {
    const el = ref.current;
    if (!auto || !el || !("IntersectionObserver" in window)) return;
    let timer = 0;
    let visible = false;
    const loop = () => {
      timer = window.setTimeout(() => {
        if (visible) glitch();
        loop();
      }, rnd(2500, 7000));
    };
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; });
    io.observe(el);
    loop();
    return () => { io.disconnect(); clearTimeout(timer); };
  }, [auto, glitch]);

  return (
    <Tag ref={ref} data-glitch className={className} onMouseEnter={glitch}>
      {Array.from(text).map((ch, i) =>
        hits[i] ? <span key={i} className={hits[i]} data-ch={ch}>{ch}</span> : ch
      )}
    </Tag>
  );
}
