import { useMemo, useState } from "react";
import { FM1_THEMES, type Fm1ThemeData } from "@/data/fm1Themes.ts";
import { COLOR_LIMITS, offeredColors } from "@/data/colorAvailability.ts";
import { colorsStore } from "@/data/colorsStore.ts";
import { decodeFm1, SLOTS, type Fm1Build } from "@/features/fm1/fm1Code.ts";
import { FACTORY_COLORS, KNOB_SPECS } from "@/features/fm1/fm1Data.ts";
import { KNOBS_NO_CAP, KNOBS_OFF } from "@/data/knobAvailability.ts";
import { Fm1Thumb } from "@/features/fm1/Fm1Thumb.tsx";
import { usePersistedState } from "./usePersistedState.ts";
import { exportFm1ThemesTs, exportKnobAvailabilityTs } from "./exportUtils.ts";
import { hashCode } from "@/features/fm1/themeLock.ts";

type Check = { build: Fm1Build; notOffered: string[]; offKnobs: string[] } | { error: string };

const uniq = (ids: (string | null | undefined)[]) => [...new Set(ids.filter((x): x is string => !!x))];
const caseColors = (b: Fm1Build) => uniq([b.body, b.accent, b.side, b.bezel, b.logo]);
const knobColors = (b: Fm1Build) => uniq(SLOTS.flatMap((s) => [b.knobs[s].body, b.knobs[s].cap]));
/** names of the knob models a build uses that are switched off */
const offModels = (b: Fm1Build, off: string[]) =>
  uniq(SLOTS.map((s) => `${b.knobs[s].style}_${b.knobs[s].height}`).filter((v) => off.includes(v))).map((v) => KNOB_SPECS[v]?.name ?? v);

export function Fm1ThemesAdmin() {
  // unlockCode: the plain code typed here (kept only in this browser); the file only gets its hash (lock)
  const [themes, setThemes] = usePersistedState<(Fm1ThemeData & { unlockCode?: string })[]>("fm1_themes", () => FM1_THEMES.map((t) => ({ ...t })));
  const exportThemes = async () => {
    const ok = themes.filter((_, i) => !("error" in checks[i]));
    const out = await Promise.all(ok.map(async ({ unlockCode, ...t }) => {
      if (unlockCode === undefined) return t;                       // untouched: keep the lock the file already has
      return { ...t, lock: unlockCode.trim() ? await hashCode(unlockCode) : undefined };
    }));
    await exportFm1ThemesTs(out);
  };
  const all = colorsStore.getColors();
  const offeredCase = useMemo(() => new Set(offeredColors("fm1-case", all).map((c) => c.id)), [all, COLOR_LIMITS]);
  const offeredKnobs = useMemo(() => new Set(offeredColors("fm1-knobs", all).map((c) => c.id)), [all, COLOR_LIMITS]);
  const [off, setOff] = usePersistedState<string[]>("fm1_knobs_off", () => [...KNOBS_OFF]);
  const [offSaved, setOffSaved] = useState(false);
  const toggleOff = (v: string) => { setOffSaved(false); setOff((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v])); };
  const [noCap, setNoCap] = usePersistedState<string[]>("fm1_knobs_no_cap", () => [...KNOBS_NO_CAP]);
  const toggleCap = (v: string) => { setOffSaved(false); setNoCap((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v])); };
  const hex = (id: string) => all.find((c) => c.id === id)?.hex ?? "#888888";
  const factory = FACTORY_COLORS[1];

  const check = (code: string): Check => {
    try {
      const build = decodeFm1(code);
      if (build.mode !== "case") return { error: "This is a knobs-only code. A theme needs a full case code (FM1v2|...)." };
      return {
        build,
        notOffered: uniq([...caseColors(build).filter((id) => !offeredCase.has(id)), ...knobColors(build).filter((id) => !offeredKnobs.has(id))]),
        offKnobs: offModels(build, off),
      };
    } catch (e) {
      return { error: (e as Error).message };
    }
  };
  const checks = themes.map((t) => check(t.code));
  const validCount = checks.filter((c) => !("error" in c)).length;

  const update = (i: number, patch: Partial<Fm1ThemeData & { unlockCode?: string }>) => setThemes((prev) => prev.map((t, k) => (k === i ? { ...t, ...patch } : t)));
  const move = (i: number, d: -1 | 1) =>
    setThemes((prev) => {
      const j = i + d;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = (i: number) => setThemes((prev) => prev.filter((_, k) => k !== i));
  const add = () => setThemes((prev) => [...prev, { id: "", name: `New theme ${prev.length + 1}`, code: "" }]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="max-w-2xl">
          <h3 className="ks text-2xl text-text-primary">FM1 THEMES</h3>
          <p className="text-sm text-text-secondary mt-1">
            The ready themes in the strip on the FM1 Kustomizer. Design one in the Kustomizer, press <b>Copy</b>, then paste the code here
            and give it a name. The first theme is the one the page opens on.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`${window.location.origin}/#/kustomize?kit=fm1-kz-case`} target="_blank" rel="noopener noreferrer"
            className="mono px-3 py-2 border border-border-light text-text-primary hover:border-accent hover:text-accent transition-colors">
            Open the FM1 Kustomizer ↗
          </a>
          <button
            disabled={validCount === 0}
            onClick={() => void exportThemes()}
            className="text-sm px-4 py-2 bg-accent text-[#0D0D0C] font-medium hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            Export fm1Themes.ts ↓
          </button>
        </div>
      </div>

      <div className="border border-border bg-surface-card p-3 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <h4 className="ks text-xl text-text-primary">KNOB MODELS</h4>
            <p className="text-xs text-text-secondary mt-1">
              <b>In stock:</b> untick a model that is out of stock. The public site stops offering it; a theme or code that uses it
              still loads, with a short out-of-stock note for the buyer. <b>Cap:</b> untick a model that takes no cap (the cap is
              hidden everywhere). Save, then Publish.
            </p>
          </div>
          <button onClick={async () => { await exportKnobAvailabilityTs(off, noCap); setOffSaved(true); }}
            className="text-sm px-4 py-2 bg-accent text-[#0D0D0C] font-medium hover:bg-accent-hover transition-colors cursor-pointer">
            {offSaved ? "Saved ✓" : "Save knob models"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(KNOB_SPECS).map(([v, sp]) => (
            <div key={v} className={`inline-flex items-center gap-3 px-3 min-h-9 text-xs border ${off.includes(v) ? "border-red-500/50 text-red-400" : "border-border-light text-text-primary"}`}>
              <span className="font-medium">{sp.name}{off.includes(v) && " · out of stock"}</span>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={!off.includes(v)} onChange={() => toggleOff(v)} className="w-4 h-4 accent-[#FF5A1F] cursor-pointer" />in stock
              </label>
              <label className="inline-flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={!noCap.includes(v)} onChange={() => toggleCap(v)} className="w-4 h-4 accent-[#FF5A1F] cursor-pointer" />cap
              </label>
            </div>
          ))}
        </div>
      </div>

      {validCount < themes.length && (
        <p className="text-xs text-red-400 mb-3">{themes.length - validCount} theme(s) have a code that does not work and will be left out of the export.</p>
      )}

      <div className="space-y-3">
        {themes.map((t, i) => {
          const c = checks[i];
          return (
            <div key={i} className="border border-border bg-surface-card p-3 flex flex-wrap gap-3 items-start">
              <div className="w-40 shrink-0 bg-[#050505] aspect-[8/5]">
                {"build" in c ? <Fm1Thumb build={c.build} hex={hex} factory={factory} /> : (
                  <div className="h-full flex items-center justify-center mono text-red-400">invalid code</div>
                )}
              </div>
              <div className="flex-1 min-w-64 space-y-2">
                <input
                  value={t.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                  placeholder="Theme name"
                  className="w-full bg-surface border border-border px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
                <input
                  value={t.code}
                  onChange={(e) => update(i, { code: e.target.value.trim() })}
                  placeholder="FM1v2|F=...|L=...|R=...|XX"
                  className="w-full bg-surface border border-border px-3 py-2 text-xs font-mono text-accent focus:border-accent focus:outline-none"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-xs text-text-primary cursor-pointer">
                    <input type="checkbox" checked={t.enabled !== false} onChange={(e) => update(i, { enabled: e.target.checked })}
                      className="w-4 h-4 accent-[#FF5A1F] cursor-pointer" />
                    Enabled {t.enabled === false && <span className="text-red-400">(hidden on the site)</span>}
                  </label>
                  <input
                    value={t.unlockCode ?? ""}
                    onChange={(e) => update(i, { unlockCode: e.target.value })}
                    placeholder={t.lock && t.unlockCode === undefined ? "Unlock code set (type to change)" : "Unlock code (empty = open to all)"}
                    className="flex-1 min-w-48 bg-surface border border-border px-3 py-1.5 text-xs font-mono text-text-primary focus:border-accent focus:outline-none"
                  />
                  {(t.lock || t.unlockCode) && (
                    <button onClick={() => update(i, { unlockCode: "" })} className="text-xs underline text-text-muted cursor-pointer">remove lock</button>
                  )}
                </div>
                {(t.unlockCode?.trim() || (t.lock && t.unlockCode === undefined)) && (
                  <p className="text-xs text-accent">Locked: only buyers who type the code see this theme.</p>
                )}
                {"error" in c && <p className="text-xs text-red-400">{c.error}</p>}
                {"build" in c && c.offKnobs.length > 0 && (
                  <p className="text-xs text-amber-400">Out of stock knobs: {c.offKnobs.join(", ")}. Buyers see a short note on this theme.</p>
                )}
                {"build" in c && c.notOffered.length > 0 && (
                  <p className="text-xs text-amber-400">
                    Uses {c.notOffered.join(", ")}, which the FM1 Kustomizer no longer offers (it still draws, but nobody can pick it).
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"
                  className="w-9 h-9 border border-border-light text-text-primary cursor-pointer disabled:opacity-30">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === themes.length - 1} aria-label="Move down"
                  className="w-9 h-9 border border-border-light text-text-primary cursor-pointer disabled:opacity-30">↓</button>
                <button onClick={() => remove(i)} aria-label="Delete theme"
                  className="w-9 h-9 border border-red-500/40 text-red-400 cursor-pointer hover:bg-red-500/20">×</button>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={add} className="mt-3 px-4 min-h-11 border border-dashed border-border-light text-text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer">
        + Add theme
      </button>
    </div>
  );
}
