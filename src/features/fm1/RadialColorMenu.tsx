import { useEffect, useRef, useState } from "react";
import { swatchStyle } from "@/utils/swatch.ts";

// Color menu docked in the bottom-right corner of the 3D view: always the same place, never over the part being
// edited. The swatches sit on a ring (a second ring only if one does not fit), tap one to apply it, the menu stays
// open to try several. Drag the center to move it. Tapping outside closes it, except on the 3D and 2D views
// (marked data-keep-radial), where a tap just selects another part.
export function ringLayout(n: number, sw: number, gap: number): { r: number; a: number }[] {
  const out: { r: number; a: number }[] = [];
  const step = sw + 12;
  let r0 = Math.max(sw * 1.7, Math.ceil((n * (sw + gap)) / (2 * Math.PI)));
  r0 = Math.min(r0, sw * 2.6);   // beyond this a second ring is neater than one huge ring
  let left = n;
  for (let k = 0; left > 0; k++) {
    const r = r0 + k * step;
    const take = Math.min(left, Math.max(1, Math.floor((2 * Math.PI * r) / (sw + gap))));
    for (let i = 0; i < take; i++) out.push({ r, a: -Math.PI / 2 + (2 * Math.PI * (i + (k % 2) * 0.5)) / take });
    left -= take;
  }
  return out;
}

export function RadialColorMenu({ colors, currentId, title, onPick, onPreview, onClose, children }: {
  colors: { id: string; name: string; hex: string; translucent?: boolean }[];
  currentId: string | null;
  title: string;
  onPick: (id: string) => void;
  onPreview?: (id: string | null) => void;   // hovering a swatch previews the color, only a tap keeps it
  onClose: () => void;
  children?: React.ReactNode;   // buttons under the ring (Body / Cap / Apply to all)
}) {
  const phone = typeof window !== "undefined" && window.innerWidth < 640;
  const SW = phone ? 34 : 40;
  const spots = ringLayout(colors.length, SW, phone ? 6 : 8);
  const reach = Math.max(...spots.map((s) => s.r)) + SW / 2 + 4;
  const center = Math.min(100, Math.round(reach * 0.78));   // the middle disc leaves the swatches a clear gap
  const [hover, setHover] = useState<string | null>(null);
  const [off, setOff] = useState({ x: 0, y: 0 });   // where the buyer dragged the menu to
  const [out, setOut] = useState(false);              // fan out from the center, fast
  const root = useRef<HTMLDivElement>(null);
  const keep = useRef(onClose);
  keep.current = onClose;

  useEffect(() => { const id = requestAnimationFrame(() => setOut(true)); return () => cancelAnimationFrame(id); }, []);
  useEffect(() => {
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!root.current?.contains(t) && !t.closest?.("[data-keep-radial]")) keep.current();
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") keep.current(); };
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("pointerdown", down, true); window.removeEventListener("keydown", key); };
  }, []);

  const shown = colors.find((c) => c.id === (hover ?? currentId));
  return (
    <div
      ref={root}
      role="dialog"
      aria-label={title}
      className="absolute right-2 bottom-2 z-20 pointer-events-none"
      style={{ width: reach * 2, height: reach * 2 + (children ? 46 : 0), transform: `translate(${off.x}px, ${off.y}px)` }}
    >
      <div className="absolute" style={{ left: reach, top: reach }}>
        <div
          title="Drag to move"
          onPointerDown={(e) => {
            const el = e.currentTarget;
            const start = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
            el.setPointerCapture(e.pointerId);
            const move = (m: PointerEvent) => setOff({ x: start.ox + m.clientX - start.x, y: start.oy + m.clientY - start.y });
            const up = () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); };
            el.addEventListener("pointermove", move);
            el.addEventListener("pointerup", up);
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0d0d0c]/90 border border-border-light flex flex-col items-center
                     justify-center text-center px-2 pointer-events-auto cursor-grab active:cursor-grabbing touch-none select-none"
          style={{ width: center * 2, height: center * 2 }}
        >
          <span className="mono text-[9px] leading-tight text-text-muted break-words">{title}</span>
          <span className="text-xs leading-tight text-text-primary mt-1 break-words">{shown?.name ?? ""}</span>
        </div>
        {colors.map((c, i) => {
          const s = spots[i];
          return (
            <button
              key={c.id}
              title={c.name}
              aria-label={c.name}
              onPointerEnter={() => { setHover(c.id); onPreview?.(c.id); }}
              onPointerLeave={() => { setHover(null); onPreview?.(null); }}
              onClick={() => onPick(c.id)}
              className={`absolute pointer-events-auto rounded-full border-2 cursor-pointer ${currentId === c.id ? "border-accent" : "border-[#6b6a66]"}`}
              style={{
                width: SW, height: SW, ...swatchStyle(c),
                left: out ? Math.cos(s.a) * s.r : 0, top: out ? Math.sin(s.a) * s.r : 0,
                opacity: out ? 1 : 0, transform: `translate(-50%, -50%) scale(${out ? 1 : 0.4})`,
                transition: `left 130ms cubic-bezier(.2,.9,.3,1.25) ${i * 8}ms, top 130ms cubic-bezier(.2,.9,.3,1.25) ${i * 8}ms, opacity 90ms ${i * 8}ms, transform 130ms ${i * 8}ms`,
              }}
            />
          );
        })}
      </div>
      {children && (
        <div className="absolute right-0 flex gap-1.5 whitespace-nowrap pointer-events-auto" style={{ bottom: 0 }}>{children}</div>
      )}
    </div>
  );
}
