import { KNOB_STAT_LABELS, KNOB_STATS } from "@/data/knobStats.ts";

/** Compact stat bars: five thin blocks per attribute, orange up to the score. A minor spec, so small and quiet. */
export function KnobStats({ variant }: { variant: string }) {
  const stats = KNOB_STATS[variant];
  if (!stats) return null;
  return (
    <div className="mt-2 grid grid-cols-[auto_auto] justify-start gap-x-6 gap-y-[3px] sm:grid-cols-[auto_auto_auto_auto] sm:gap-x-3" aria-label="Knob stats">
      {KNOB_STAT_LABELS.map((label, i) => (
        <div key={label} className="contents">
          <span className="mono text-[9px] leading-none uppercase tracking-wider text-text-muted self-center">{label}</span>
          <span className="flex gap-[2px] self-center sm:mr-4" aria-label={`${label} ${stats[i]} of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`block w-3 h-[3px] ${n <= stats[i] ? "bg-accent" : "bg-[#2b2b29]"}`} />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
