import { useState } from "react";
import { colorsStore } from "@/data/colorsStore.ts";
import { fm1PartsList } from "@/features/fm1/fm1Parts.ts";
import { decodeFm1, type Fm1Build } from "@/features/fm1/fm1Code.ts";
import { FACTORY_COLORS } from "@/features/fm1/fm1Data.ts";
import { Fm1Thumb } from "@/features/fm1/Fm1Thumb.tsx";
import { checkFm1, type Fm1Check } from "@/features/fm1/fm1Validate.ts";

/** Paste an FM1_Kz order code (from the Etsy personalization box): get the list of parts to pick for packing. */
export function OrderDecoderAdmin() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  let lines: string[] = [], error = "", build: Fm1Build | null = null;
  const all = colorsStore.getColors();
  if (code.trim()) {
    try { lines = fm1PartsList(code.trim(), all); build = decodeFm1(code.trim()); } catch (e) { error = (e as Error).message; }
  }
  let check: Fm1Check | null = null;
  if (build) {
    try { check = checkFm1(build, all); } catch { check = null; }
  }
  const hex = (id: string) => all.find((c) => c.id === id)?.hex ?? "#888888";
  const tr = (id: string) => !!all.find((c) => c.id === id)?.translucent;
  const text = lines.join("\n");
  return (
    <div className="max-w-5xl">
      <h3 className="ks text-2xl text-text-primary">ORDER DECODER</h3>
      <p className="text-sm text-text-secondary mt-1 mb-3">
        Paste the code from the Etsy order (the Personalization box). You get the list of what to take from the shelf.
      </p>
      <textarea
        value={code}
        onChange={(e) => { setCode(e.target.value); setCopied(false); }}
        rows={3}
        placeholder="FM1v2|F=...|L=...|R=...|XX"
        className="w-full bg-surface border border-border px-3 py-2 text-xs font-mono text-accent focus:border-accent focus:outline-none"
      />
      {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      {lines.length > 0 && (
        <div className="mt-3 border border-border bg-surface-card p-4 flex flex-wrap gap-4 items-start">
          {build && (
            <div className="w-full sm:w-80 shrink-0 bg-[#050505] aspect-[8/5]">
              <Fm1Thumb build={build} hex={hex} tr={tr} factory={FACTORY_COLORS[1]} />
            </div>
          )}
          <div className="flex-1 min-w-64">
          {check && (
            <div className="mb-3 space-y-1.5">
              {check.theme ? (
                <p className="text-sm"><span className="mono text-text-muted">THEME</span> <b className="text-accent">{check.theme.name}</b></p>
              ) : (
                <p className="text-sm text-text-secondary">
                  <span className="mono text-text-muted">CUSTOM</span> {check.closest && <>closest theme: <b>{check.closest.theme.name}</b> ({check.closest.diffs} {check.closest.diffs === 1 ? "change" : "changes"})</>}
                </p>
              )}
              {check.notes.map((n) => <p key={n} className="text-xs text-accent">{n}</p>)}
              {check.problems.length > 0 ? (
                <div className="border border-red-500/60 bg-red-500/10 p-2">
                  <p className="text-xs font-semibold text-red-400">LOOKS EDITED BY HAND: the public Kustomizer cannot make this code.</p>
                  <ul className="mt-1 text-xs text-red-300 list-disc pl-4">{check.problems.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
              ) : (
                <p className="text-xs text-green-400">✓ Valid: everything in it can be picked on the public site.</p>
              )}
            </div>
          )}
          <pre className="text-sm text-text-primary whitespace-pre-wrap font-mono leading-relaxed">{text}</pre>
          <button
            onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); } catch { /* blocked */ } }}
            className="mt-3 text-sm px-4 py-2 bg-accent text-[#0D0D0C] font-medium hover:bg-accent-hover transition-colors cursor-pointer">
            {copied ? "Copied ✓" : "Copy the list"}
          </button>
          </div>
        </div>
      )}
    </div>
  );
}
