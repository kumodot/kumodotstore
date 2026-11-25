import { useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EXTRA_KNOBS, type Fm1KnobModel } from "@/data/fm1Knobs.ts";
import { KNOB_STAT_LABELS } from "@/data/knobStats.ts";
import { STYLE_LETTER } from "@/features/fm1/fm1Code.ts";
import { studioAsset } from "./studioApi.ts";
import { saveFm1Knobs } from "./fm1KnobsFile.ts";
import { KnobPicturesImport } from "./KnobPicturesImport.tsx";
import { KnobPreview3D } from "./KnobPreview3D.tsx";
import { setFlash, takeFlash } from "./studioFlash.ts";

// Add a knob model to the FM1 Kustomizer without touching code: drop the GLB with the pair of bodies
// (knob_<style>_<height>_body + knob_vol_<style>_<height>_body, pivot at the base center, at the site scale),
// name it, give it its code letter, stats and 2D pictures, Save. The cap height is then tuned live in the Kustomizer.
const BUILT_IN = [
  { id: "classic_short", name: "Classic Short", letter: "CS" }, { id: "classic_long", name: "Chalice", letter: "CL" },
  { id: "groove_short", name: "Groove Short", letter: "GS" }, { id: "groove_long", name: "Groove Long", letter: "GL" },
];
const NAME_RE = /^knob_(vol_)?([a-z]+)_(short|long)_body$/;

interface Parsed { style: string; height: "short" | "long"; d: number; h: number; vol: boolean; notes: string[]; problems: string[]; fnObj: THREE.Object3D; volObj?: THREE.Object3D }

/** Reads a knob GLB in the browser: finds the pair, measures it and checks scale and pivots. */
async function parseKnobGlb(buf: ArrayBuffer): Promise<Parsed> {
  const g = await new GLTFLoader().parseAsync(buf, "");
  g.scene.updateMatrixWorld(true);
  const found: Record<string, THREE.Object3D> = {};
  g.scene.traverse((o) => { if (NAME_RE.test(o.name)) found[o.name] = o; });
  const names = Object.keys(found);
  const problems: string[] = [], notes: string[] = [];
  const fnName = names.find((n) => !n.startsWith("knob_vol_"));
  if (!fnName) throw new Error("No knob_<style>_<height>_body node found (for example knob_tower_long_body).");
  const [, , style, height] = NAME_RE.exec(fnName)!;
  const volName = `knob_vol_${style}_${height}_body`;
  const vol = !!found[volName];
  if (!vol) problems.push(`No ${volName}: the volume slot will use the function knob.`);
  const measure = (n: string) => {
    const box = new THREE.Box3().setFromObject(found[n]);
    const size = box.getSize(new THREE.Vector3());
    const piv = found[n].getWorldPosition(new THREE.Vector3());
    const d = Math.max(size.x, size.z);
    const unit = d > 5 ? 0.001 : d > 0.2 ? 0.01 : 1;
    if (unit !== 1) notes.push(`${n}: exported in ${unit === 0.01 ? "cm" : "mm"}, scaled to meters.`);
    const c = box.getCenter(new THREE.Vector3());
    const off = Math.hypot(piv.x - c.x, piv.z - c.z) * unit * 1000, offY = Math.abs(piv.y - box.min.y) * unit * 1000;
    if (offY > 1) problems.push(`${n}: pivot is ${offY.toFixed(1)} mm from the base (it must be at the base).`);
    if (off > 3) problems.push(`${n}: pivot is ${off.toFixed(1)} mm from the center (it must be at the base center).`);
    return { d: d * unit * 100, h: size.y * unit * 100 };   // cm
  };
  const m = measure(fnName);
  if (vol) measure(volName);
  if (m.d < 0.8 || m.d > 1.8) problems.push(`Diameter ${m.d.toFixed(2)} cm: outside 0.8 to 1.8 cm, check the scale.`);
  return { style, height: height as "short" | "long", d: Math.round(m.d * 100) / 100, h: Math.round(m.h * 100) / 100, vol, notes, problems,
    fnObj: found[fnName], ...(vol ? { volObj: found[volName] } : {}) };
}


export function Fm1KnobsAdmin() {
  const [list, setList] = useState<Fm1KnobModel[]>(() => EXTRA_KNOBS.map((k) => ({ ...k })));
  const [glb, setGlb] = useState<File | null>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [letter, setLetter] = useState("");
  const [stats, setStats] = useState<number[]>([3, 3, 3, 3, 3, 3]);
  const [busy, setBusy] = useState("");
  const [saved, setSaved] = useState(takeFlash);

  const used = new Set(Object.values(STYLE_LETTER));
  const id = parsed ? `${parsed.style}_${parsed.height}` : "";
  const exists = !!parsed && (BUILT_IN.some((b) => b.id === id) || list.some((k) => `${k.style}_${k.height}` === id));
  const sameStyle = parsed ? list.find((k) => k.style === parsed.style) : undefined;   // a short + long of one style share the letter
  const letterOk = /^[A-Z]$/.test(letter) && (sameStyle ? sameStyle.letter === letter : !used.has(letter) || STYLE_LETTER[parsed?.style ?? ""] === letter);

  const pick = async (f: File | null) => {
    setGlb(f); setParsed(null); setErr(""); setSaved("");
    if (!f) return;
    try {
      const p = await parseKnobGlb(await f.arrayBuffer());
      setParsed(p);
      setName((n) => n.trim() || p.style.charAt(0).toUpperCase() + p.style.slice(1) + (p.height === "long" ? " Long" : " Short"));
      const own = list.find((k) => k.style === p.style)?.letter;
      const first = p.style.charAt(0).toUpperCase();
      setLetter(own ?? (!used.has(first) ? first : "ABDEFHIJKMNOPQRTUVWXYZ".split("").find((c) => !used.has(c)) ?? ""));
    } catch (e) { setErr((e as Error).message); }
  };

  const save = async () => {
    if (!parsed || !glb || !letterOk || exists) return;
    setBusy("Saving the model...");
    const file = `${id}.glb`;
    if (!(await studioAsset(`models/knobs/${file}`, await glb.arrayBuffer()))) { setBusy(""); setErr("Could not save: is the Studio server running?"); return; }
    const k: Fm1KnobModel = {
      style: parsed.style, height: parsed.height, letter, name: name.trim() || id, glb: file,
      d: parsed.d, h: parsed.h, capY: 0, volCapY: 0, stats,
    };
    const next = [...list, k];
    setBusy("Writing fm1Knobs.ts...");
    const ok = await saveFm1Knobs(next);
    setBusy("");
    if (!ok) { setErr("Could not write fm1Knobs.ts."); return; }
    setList(next); setGlb(null); setParsed(null);
    const msg = `✓ ${k.name} saved as a knob model (code ${k.letter}${k.height === "short" ? "S" : "L"}). Next: its pictures in step 2 (if not done yet), then in the FM1 Kustomizer pick it on a knob and set the cap height with the Studio slider under the knob. Then Publish.`;
    setFlash(msg);
    setSaved(msg);
  };

  const update = async (i: number, patch: Partial<Fm1KnobModel>) => {
    const next = list.map((k, j) => (j === i ? { ...k, ...patch } : k));
    setList(next);
    await saveFm1Knobs(next);
  };
  const remove = async (i: number) => {
    if (!confirm(`Remove ${list[i].name}? Orders that use it will no longer decode on the site (its letter ${list[i].letter} must never be reused).`)) return;
    const next = list.filter((_, j) => j !== i);
    setList(next);
    await saveFm1Knobs(next);
  };

  const fileBtn = "text-xs file:mr-3 file:px-3 file:py-1.5 file:border file:border-border-light file:bg-transparent file:text-text-primary file:cursor-pointer";
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h3 className="ks text-2xl text-text-primary">FM1 KNOBS</h3>
        <p className="text-sm text-text-secondary mt-1">
          Knob models of the FM1 Kustomizer. Add one by dropping its GLB: one file with the function knob and the volume knob
          (<code>knob_tower_long_body</code> + <code>knob_vol_tower_long_body</code>), pivots at the base center, exported from the master scene
          (site scale, meters). Stock and caps are set in the FM1 Themes tab. Publish puts it live.
        </p>
      </div>

      <section className="border border-border bg-surface-card p-4">
        <h4 className="mono mb-2">MODELS <span className="normal-case tracking-normal text-text-muted">(orange = its code in the order: style letter + S short / L long)</span></h4>
        <ul className="space-y-1.5 text-sm">
          {BUILT_IN.map((b) => (
            <li key={b.id} className="flex gap-3 text-text-secondary"><span className="font-mono text-accent w-6">{b.letter}</span>{b.name}<span className="text-text-muted text-xs">built in</span></li>
          ))}
          {list.map((k, i) => (
            <li key={`${k.style}_${k.height}`} className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-accent w-6">{k.letter}{k.height === "short" ? "S" : "L"}</span>
              <input value={k.name} onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                onBlur={(e) => void update(i, { name: e.target.value.trim() })}
                className="bg-surface border border-border px-2 py-1 text-sm text-text-primary w-48 focus:border-accent focus:outline-none" />
              <span className="text-xs text-text-muted">{k.d} x {k.h} cm · cap {k.capY} mm · vol cap {k.volCapY} mm · {k.glb}</span>
              <button onClick={() => void remove(i)} className="text-xs text-red-400 underline cursor-pointer">remove</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-border bg-surface-card p-4 space-y-3">
        <h4 className="mono">1. ADD A KNOB MODEL</h4>
        <p className="text-xs text-text-secondary">Start with the GLB: the model id (style and height) comes from its node names, so name, letter and size fill in from it.</p>
        <label className="block text-sm text-text-primary">GLB with the pair of bodies
          <input type="file" accept=".glb" onChange={(e) => void pick(e.target.files?.[0] ?? null)} className={`block mt-1 ${fileBtn}`} />
        </label>
        {err && <p className="text-xs text-red-400">{err}</p>}
        {(
          <div className={`space-y-3 ${parsed ? "" : "opacity-50 pointer-events-none"}`}>
            {!parsed && <p className="text-xs text-text-muted">Pick the GLB first.</p>}
            {parsed && (
              <div className="flex flex-wrap gap-3">
                <KnobPreview3D object={parsed.fnObj} label={`${id} (x7)`} />
                {parsed.volObj && <KnobPreview3D object={parsed.volObj} label={`vol_${id} (V)`} />}
              </div>
            )}
            {parsed && <p className="text-sm">Found <b>{id}</b>{parsed.vol ? " + volume version" : ""}: {parsed.d} x {parsed.h} cm (diameter x height).</p>}
            {parsed?.notes.map((n) => <p key={n} className="text-xs text-text-muted">{n}</p>)}
            {parsed?.problems.map((p) => <p key={p} className="text-xs text-amber-400">{p}</p>)}
            {exists && <p className="text-xs text-red-400">{id} already exists. Remove it first to replace it.</p>}
            <div className="flex flex-wrap gap-4">
              <label className="text-sm">Name
                <input value={name} onChange={(e) => setName(e.target.value)} className="block mt-1 bg-surface border border-border px-2 py-1 text-sm w-56 focus:border-accent focus:outline-none" />
              </label>
              <label className="text-sm">Code letter
                <input value={letter} maxLength={1} onChange={(e) => setLetter(e.target.value.toUpperCase())} disabled={!!sameStyle}
                  className="block mt-1 bg-surface border border-border px-2 py-1 text-sm w-14 font-mono text-accent focus:border-accent focus:outline-none" />
              </label>
            </div>
            {parsed && !letterOk && <p className="text-xs text-red-400">Pick one letter A-Z that no other knob style uses ({[...used].join(", ")} are taken).</p>}
            <div>
              <p className="text-sm mb-1">Stats (0 to 5)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
                {KNOB_STAT_LABELS.map((l, i) => (
                  <label key={l} className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="w-28">{l}</span>
                    <input type="range" min={0} max={5} step={1} value={stats[i]} onChange={(e) => setStats(stats.map((v, j) => (j === i ? +e.target.value : v)))} className="accent-[#FF5A1F]" />
                    <span className="font-mono w-3">{stats[i]}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-text-muted">The 2D pictures (body and cap, plain and volume) go in step 2 below, all at once.</p>
            <button onClick={() => void save()} disabled={!letterOk || exists || !!busy}
              className="text-sm px-4 py-2 bg-accent text-[#0D0D0C] font-medium hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              {busy || "Save knob model"}
            </button>
          </div>
        )}
        {saved && <p className="text-sm text-green-400">{saved}</p>}
      </section>

      <KnobPicturesImport />
    </div>
  );
}
