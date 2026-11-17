import { useEffect, useState, type ReactNode } from "react";

/** The picture of a product card in the top picker: it cycles through theme thumbnails with a real crossfade (the old one fades out
 *  while the next fades in). Two fixed layers swap roles, so the picture that is leaving is never rebuilt (a rebuilt canvas would
 *  flash empty). `offset` (ms) staggers the cards. The frame (4:3 with a soft blue-gray light) is the same for every card. Stands still for people who asked for reduced motion. */
export function PickerCycle({ items, offset = 0, every = 1900 }: { items: ReactNode[]; offset?: number; every?: number }) {
  const n = items.length;
  // slots: what each of the two layers shows; top: the layer in front; fading: a crossfade is running
  const [st, setSt] = useState<{ slots: [number, number | null]; top: 0 | 1; fading: boolean }>({ slots: [0, null], top: 0, fading: false });

  useEffect(() => {
    if (n < 2 || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let iv = 0;
    const t = window.setTimeout(() => {
      iv = window.setInterval(() => setSt((x) => {
        const nextTop = (x.top === 0 ? 1 : 0) as 0 | 1;
        const slots: [number, number | null] = [x.slots[0], x.slots[1]];
        slots[nextTop] = ((x.slots[x.top] ?? 0) + 1) % n;
        return { slots, top: nextTop, fading: true };
      }), every);
    }, offset);
    return () => { window.clearTimeout(t); window.clearInterval(iv); };
  }, [n, offset, every]);

  const cell = "absolute inset-0 flex items-center justify-center";
  return (
    <span className="relative block w-full aspect-[4/3] overflow-hidden" style={{ background: "radial-gradient(ellipse 62% 66% at 50% 48%, #3d4854 0%, #1a2028 50%, #050505 100%)" }}>
      {([0, 1] as const).map((slot) => {
        const idx = st.slots[slot];
        if (idx === null || idx >= n) return null;
        const front = st.top === slot;
        const style = st.fading
          ? { animation: `${front ? "pickFade" : "pickOut"} 600ms linear both` }
          : { opacity: front ? 1 : 0 };
        return (
          <span key={slot} className={cell} style={style}
            onAnimationEnd={front ? () => setSt((x) => (x.fading ? { ...x, fading: false } : x)) : undefined}>
            <span key={idx} className={cell}>{items[idx]}</span>
          </span>
        );
      })}
    </span>
  );
}
