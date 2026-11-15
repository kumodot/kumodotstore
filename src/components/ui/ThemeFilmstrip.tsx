import { useRef, type ReactNode } from "react";
import { Scramble } from "./Scramble.tsx";

// One theme picker for every Kustomizer: a horizontal filmstrip of thumbnails.
// The thumbnail is passed in as a node, so each product draws its own (POKZ grid,
// FM1 top view). When the case silhouettes are ready only the thumb components change.
export interface FilmItem {
  id: string;
  name: string;
  thumb: ReactNode;
  removable?: boolean;   // a theme the buyer saved on this device: shows a small x to delete it
}

export function ThemeFilmstrip({ items, activeId, onSelect, onSave, onRemove, label = "PICK A THEME", aspect = "aspect-[4/3]" }: {
  items: FilmItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onSave?: () => void;
  onRemove?: (id: string) => void;
  label?: string;
  aspect?: string;   // tailwind aspect class of the thumbnail frame, portrait cases use aspect-[3/4]
}) {
  const rail = useRef<HTMLDivElement>(null);
  // Touch screens swipe the rail natively. Mouse gets drag-to-scroll too (it ignores snap while dragging).
  const drag = useRef<{ x: number; left: number } | null>(null);
  const dragged = useRef(false);
  const endDrag = () => {
    drag.current = null;
    const r = rail.current;
    if (r) { r.style.scrollSnapType = ""; r.style.scrollBehavior = ""; }
  };
  const nudge = (dir: number) =>
    rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section aria-label={label}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="mono">{label}</h3>
        <div className="flex gap-1">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              onClick={() => nudge(d)}
              aria-label={d < 0 ? "Scroll left" : "Scroll right"}
              className="w-9 h-9 border border-border-light text-text-primary cursor-pointer
                         hover:bg-accent hover:border-accent hover:text-[#0D0D0C] transition-colors"
            >
              {d < 0 ? "‹" : "›"}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={rail}
        className="flex items-start gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || !rail.current) return;
          dragged.current = false;
          drag.current = { x: e.clientX, left: rail.current.scrollLeft };
        }}
        onPointerMove={(e) => {
          const d = drag.current, r = rail.current;
          if (!d || !r) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 5) {
            dragged.current = true;
            r.style.scrollSnapType = "none";
            r.style.scrollBehavior = "auto";
            r.scrollLeft = d.left - dx;
          }
        }}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={(e) => { if (dragged.current) { e.stopPropagation(); e.preventDefault(); dragged.current = false; } }}
      >
        {items.map((it) => {
          // The card itself widens sideways to fit the full name on hover or when active and
          // pushes the neighbours. The thumbnail keeps a fixed size (centered), so height never changes.
          const open = activeId === it.id;
          return (
            <div key={it.id} className="relative snap-start shrink-0">
              <button
                onClick={() => onSelect(it.id)}
                aria-pressed={open}
                className={`group min-w-32 p-1.5 border text-left cursor-pointer
                            transition-colors duration-[450ms] ${open ? "w-auto" : "w-32 hover:w-auto"}
                            ${open ? "border-accent bg-surface-card" : "border-border hover:border-accent"}`}
              >
                <span className="flex justify-center overflow-hidden bg-[#050505]">
                  <span className={`block w-[116px] ${aspect} transition-transform duration-[450ms] ease-[cubic-bezier(.4,0,.2,1)] group-hover:scale-[1.15]`}>
                    {it.thumb}
                  </span>
                </span>
                <span className={`block mono mt-1.5 h-5 leading-5 text-text-primary whitespace-nowrap
                                  ${open ? "" : "max-w-[116px] truncate group-hover:max-w-none group-hover:overflow-visible"}`}>
                  <Scramble text={it.name} />
                </span>
              </button>
              {it.removable && onRemove && (
                <button
                  onClick={() => onRemove(it.id)}
                  aria-label={`Delete ${it.name}`}
                  title="Delete this saved theme"
                  className="absolute right-1 top-1 z-10 w-6 h-6 flex items-center justify-center bg-black/70
                             text-text-primary hover:bg-accent hover:text-[#0D0D0C] transition-colors cursor-pointer"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.6"><path d="M1 1l8 8M9 1l-8 8" /></svg>
                </button>
              )}
            </div>
          );
        })}
        {onSave && (
          <button
            onClick={onSave}
            title="Saved in this browser only. Nobody else sees it."
            className="shrink-0 w-32 min-h-24 border border-dashed border-border-light flex flex-col items-center justify-center gap-1
                       text-text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer"
          >
            <span className="text-xs whitespace-nowrap">+ SAVE LOCAL</span>
            <span className="mono text-[9px] whitespace-nowrap opacity-70">this device only</span>
          </button>
        )}
      </div>
    </section>
  );
}
