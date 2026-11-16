import { KNOB_STAT_LABELS, KNOB_STATS } from "@/data/knobStats.ts";

/** Car-game style stat bars: five blocks per attribute, orange up to the score. */
export function KnobStats({ variant }: { variant: string }) {
  const stats = KNOB_STATS[variant];
  if (!stats) return null;
  return (
    <div className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2" aria-label="Knob stats">
      {KNOB_STAT_LABELS.map((label, i) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <span className="mono text-[10px] uppercase tracking-wider text-text-muted">{label}</span>
          <span className="flex gap-[3px] shrink-0" aria-label={`${stats[i]} of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`block w-4 h-2 ${n <= stats[i] ? "bg-accent" : "bg-[#2b2b29]"}`} />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
