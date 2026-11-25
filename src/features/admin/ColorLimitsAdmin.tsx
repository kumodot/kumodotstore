import { swatchStyle } from "@/utils/swatch.ts";
import { useState } from "react";
import { COLOR_LIMITS } from "@/data/colorAvailability.ts";
import type { FilamentColor } from "@/types/index.ts";
import { usePersistedState } from "./usePersistedState.ts";
import { exportColorAvailabilityTs } from "./exportUtils.ts";

// Which colors each product line offers. Tick = offered. Every color that is Active in the table
// below is listed; a product with every Active color ticked simply offers them all (new colors you
// add later show up there on their own).
export const COLOR_LINES = [
  { key: "fm1-case", label: "FM1_Kz case" },
  { key: "fm1-knobs", label: "FM1_Kz knobs" },
  { key: "pokz", label: "Pocket Operator" },
] as const;

type Limits = Record<string, string[]>;

export function ColorLimitsAdmin({ colors }: { colors: FilamentColor[] }) {
  const active = colors.filter((c) => c.available);
  const [limits, setLimits] = usePersistedState<Limits>("color_limits", () =>
    Object.fromEntries(COLOR_LINES.map((l) => [l.key, COLOR_LIMITS[l.key] ?? active.map((c) => c.id)])),
  );
  const [saved, setSaved] = useState(false);

  const isOn = (line: string, id: string) => (limits[line] ?? COLOR_LIMITS[line] ?? active.map((c) => c.id)).includes(id);
  const toggle = (line: string, id: string) => {
    setSaved(false);
    setLimits((prev) => {
      const cur = prev[line] ?? COLOR_LIMITS[line] ?? active.map((c) => c.id);
      return { ...prev, [line]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });
  };
  const setAll = (line: string, on: boolean) => {
    setSaved(false);
    setLimits((prev) => ({ ...prev, [line]: on ? active.map((c) => c.id) : [] }));
  };
  const count = (line: string) => active.filter((c) => isOn(line, c.id)).length;

  return (
    <div className="bg-surface-card border border-border p-4 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="ks text-2xl text-text-primary">COLORS PER PRODUCT</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-xl">
            Untick a color to stop offering it in that product. Buyers who already have a code or a saved theme with
            it still see it drawn correctly. Then Export, save over <code>src\data\colorAvailability.ts</code> and run publish.bat.
          </p>
        </div>
        <button
          onClick={async () => {
            await exportColorAvailabilityTs(limits, active.map((c) => c.id));
            setSaved(true);
          }}
          className="text-sm px-4 py-2 bg-accent text-[#0D0D0C] font-medium hover:bg-accent-hover transition-colors cursor-pointer"
        >
          {saved ? "Exported ✓" : "Export colorAvailability.ts ↓"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-2 px-2">Color</th>
              {COLOR_LINES.map((l) => (
                <th key={l.key} className="text-left text-xs font-semibold text-text-primary uppercase tracking-wider py-2 px-2">
                  {l.label}
                  <div className="font-normal text-text-muted normal-case tracking-normal">
                    {count(l.key)} of {active.length} ·{" "}
                    <button className="underline cursor-pointer" onClick={() => setAll(l.key, true)}>all</button>{" "}
                    <button className="underline cursor-pointer" onClick={() => setAll(l.key, false)}>none</button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {active.map((c) => (
              <tr key={c.id} className="border-b border-border">
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 border border-border shrink-0" style={swatchStyle(c)} />
                    <span className="font-mono text-xs text-accent w-7">{c.id}</span>
                    <span className="text-sm text-text-primary">{c.name}</span>
                  </div>
                </td>
                {COLOR_LINES.map((l) => (
                  <td key={l.key} className="py-2 px-2">
                    <input
                      type="checkbox"
                      checked={isOn(l.key, c.id)}
                      onChange={() => toggle(l.key, c.id)}
                      className="w-5 h-5 accent-[#FF5A1F] cursor-pointer"
                      aria-label={`${c.name} in ${l.label}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
