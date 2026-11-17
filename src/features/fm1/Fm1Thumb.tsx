import { Fm1TopView } from "./Fm1TopView.tsx";
import { GROUPS, type Fm1Build, type Slot } from "./fm1Code.ts";

// Knobs-only thumbnails show just the 8 knobs in their two groups (V S / P A and K1 K2 / K3 K4),
// with no case, because that product is only the knobs. The 3D view still shows the whole device.
const BARE: Record<Slot, [number, number]> = {
  vol: [230, 190], nav1: [410, 190], nav2: [230, 370], nav3: [410, 370],
  p1: [590, 190], p2: [770, 190], p3: [590, 370], p4: [770, 370],
};

/** Filmstrip thumbnail: the same top view as the big panel, without interaction. */
export function Fm1Thumb({ build, hex, tr, factory, bare = false }: {
  build: Fm1Build;
  hex: (id: string) => string;
  tr?: (id: string) => boolean;   // translucent colors (knobs are drawn striped and see-through)
  factory: { body: string; keys: string };
  bare?: boolean;   // no dark backdrop (the card behind it shows through)
}) {
  if (build.mode === "knobs") {
    return (
      <svg viewBox="0 0 1000 560" className="w-full h-full" role="img" aria-label="Knob set">
        {!bare && <rect width="1000" height="560" fill="#0D0D0C" />}
        {([...GROUPS.L, ...GROUPS.R] as Slot[]).map((s) => {
          const k = build.knobs[s];
          const [cx, cy] = BARE[s];
          return (
            <g key={s}>
              <circle cx={cx} cy={cy} r="80" fill={hex(k.body)} fillOpacity={tr?.(k.body) ? 0.55 : 1} stroke="#3B3A36" strokeWidth="6" />
              <circle cx={cx} cy={cy} r="44" fill={hex(k.cap)} fillOpacity={tr?.(k.cap) ? 0.55 : 1} stroke="#0D0D0C" strokeWidth="4" />
            </g>
          );
        })}
      </svg>
    );
  }
  return <Fm1TopView build={build} hex={hex} tr={tr} factory={factory} bare={bare} />;
}
