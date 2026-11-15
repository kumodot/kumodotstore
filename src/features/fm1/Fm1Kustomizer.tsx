import { useEffect, useMemo, useRef, useState } from "react";
import { colorsStore } from "@/data/colorsStore.ts";
import { SITE } from "@/config/site.ts";
import { NotifyModal } from "@/components/ui/NotifyModal.tsx";
import { OrderCopiedModal } from "@/components/ui/OrderCopiedModal.tsx";
import { exportFm1Image } from "./fm1Image.ts";
import { KnobRender } from "./KnobRender.tsx";
import { KUSTOMIZER_PRODUCTS } from "@/data/kustomizerProducts.ts";
import {
  decodeFm1, encodeFm1, FIRMWARES, GROUPS, SLOT_LABEL, variantOk,
  type Fm1Build, type Knob, type Slot,
} from "./fm1Code.ts";
import { ThemeFilmstrip } from "@/components/ui/ThemeFilmstrip.tsx";
import { Fm1Thumb } from "./Fm1Thumb.tsx";
import { Fm1TopView } from "./Fm1TopView.tsx";
import { Fm1Scene, type Pick as ScenePick } from "./fm1Scene.ts";
import {
  FACTORY_COLORS, FIXED_THEMES, FM1_VERSION, loadSaved, storeSaved, type FactoryId,
} from "./fm1Data.ts";

type Target =
  | { k: "fp"; part: "body" | "accent" | "side" | "bezel" | "logo" }
  | { k: "group"; g: "L" | "R"; part: "body" | "cap" }
  | { k: "knob"; slot: Slot; part: "body" | "cap" };

const GLB = `${import.meta.env.BASE_URL}models/FM1_Kz_preview_ALLVARIANTS_v0.6.glb`;
const cloneBuild = (b: Fm1Build): Fm1Build => JSON.parse(JSON.stringify(b));

export function Fm1Kustomizer({ mode }: { mode: "case" | "knobs" }) {
  const info = KUSTOMIZER_PRODUCTS.find((p) => p.kind === (mode === "case" ? "fm1-case" : "fm1-knobs"))!;
  const colors = colorsStore.getColors().filter((c) => c.available);
  const hex = (id: string) => colors.find((c) => c.id === id)?.hex ?? "#888888";

  const start = (): Fm1Build => ({ ...cloneBuild(FIXED_THEMES[0].build), mode });
  const [build, setBuild] = useState<Fm1Build>(start);
  const [factory, setFactory] = useState<FactoryId>("beige1");
  const [target, setTarget] = useState<Target>({ k: "fp", part: "body" });
  const [selKnob, setSelKnob] = useState<Slot | null>(null);
  const [themeId, setThemeId] = useState<string>(FIXED_THEMES[0].id);
  const [saved, setSaved] = useState(loadSaved);
  const [codeIn, setCodeIn] = useState("");
  const [msg, setMsg] = useState("");
  const [waitOpen, setWaitOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [copyOk, setCopyOk] = useState(true);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<Fm1Scene | null>(null);
  type Hover = { names: string[]; slot?: Slot; fp?: "body" | "accent" | "side" | "bezel" | "logo"; part?: "body" | "cap" };
  const [hover, setHover] = useState<Hover | null>(null);
  const buildRef = useRef(build);
  buildRef.current = build;

  // the code is the build; derived, never stored
  const code = useMemo(() => encodeFm1(build), [build]);
  const fac = FACTORY_COLORS.find((f) => f.id === factory)!;

  useEffect(() => {
    const s = new Fm1Scene(host.current!);
    scene.current = s;
    s.colorOf = { hex };
    const fpNames = (part: "body" | "accent" | "side" | "bezel" | "logo") =>
      part === "body" ? ["mat_faceplate_body", ...(buildRef.current.side === null ? ["mat_faceplate_side"] : [])]
        : part === "accent" ? ["mat_faceplate_accent"] : part === "side" ? ["mat_faceplate_side"] : part === "logo" ? ["mat_bezel_logo"] : ["mat_bezel_simple", "mat_bezel_ext"];
    s.onPick = (p: ScenePick | null) => {
      if (!p) return clearSel();
      if (p.k === "knob") return pickKnob(p.slot, p.part);
      pickFp(p.part);
    };
    s.onHover = (p: ScenePick | null) => {
      if (!p) return setHover(null);
      if (p.k === "knob") return setHover({ names: [`mat_knob_${p.slot}_${p.part}`], slot: p.slot, part: p.part });
      setHover({ names: fpNames(p.part), fp: p.part });
    };
    s.load(GLB).then(() => { s.apply(buildRef.current, fac); }).catch(() => setMsg("Could not load the 3D model."));
    return () => { s.dispose(); scene.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { scene.current?.apply(build, fac); }, [build, fac]);

  // pulse the part being edited in the 3D view
  const hlNames = useMemo(() => {
    if (target.k === "fp") {
      if (target.part === "body") return ["mat_faceplate_body", ...(build.side === null ? ["mat_faceplate_side"] : [])];
      if (target.part === "accent") return ["mat_faceplate_accent"];
      if (target.part === "side") return ["mat_faceplate_side"];
      if (target.part === "logo") return ["mat_bezel_logo"];
      return ["mat_bezel_simple", "mat_bezel_ext"];
    }
    const slots = target.k === "group" ? GROUPS[target.g] : [target.slot];
    return slots.map((s) => `mat_knob_${s}_${target.part}`);
  }, [target, build.side]);
  // name of the part being customized, shown in a corner of the 3D view
  const partLabel = useMemo(() => {
    const fpName = { body: "FACEPLATE", accent: "ACCENT COLOR", side: "SIDES", bezel: "BEZEL", logo: "FIRMWARE LOGO" };
    if (hover?.fp) return fpName[hover.fp];
    if (hover?.slot) return `KNOB ${SLOT_LABEL[hover.slot]}${hover.part ? ` · ${hover.part === "body" ? "BODY" : "CAP"}` : ""}`;
    if (target.k === "fp") return fpName[target.part];
    const which = target.part === "body" ? "BODY" : "CAP";
    if (target.k === "group") {
      return `KNOBS ${GROUPS[target.g].map((s) => SLOT_LABEL[s]).join(" ")} · ${which}S`;
    }
    return `KNOB ${SLOT_LABEL[target.slot]} · ${which}`;
  }, [target, hover]);
  useEffect(() => { scene.current?.setHover(hover?.names ?? []); }, [hover]);
  useEffect(() => { scene.current?.highlight(hlNames); }, [hlNames]);


  function pickFp(part: "body" | "accent" | "side" | "bezel" | "logo") { setSelKnob(null); setTarget({ k: "fp", part }); scene.current?.focus("faceplate"); }
  function pickFaceplate() { pickFp("body"); }
  function pickKnob(s: Slot, part: "body" | "cap" = "body") { setSelKnob(s); setTarget({ k: "knob", slot: s, part }); scene.current?.focus(s); }
  function clearSel() { setSelKnob(null); scene.current?.focus(null); scene.current?.clearHighlight(); }

  const edit = (fn: (b: Fm1Build) => void) => { const b = cloneBuild(build); fn(b); setBuild(b); setThemeId(""); };
  const setColor = (id: string) => edit((b) => {
    if (target.k === "fp") {
      if (target.part === "bezel") b.bezel = id;
      else if (target.part === "logo") b.logo = id;
      else if (target.part === "side") b.side = id;
      else b[target.part] = id;
    } else if (target.k === "group") {
      GROUPS[target.g].forEach((s) => { b.knobs[s][target.part] = id; });
    } else b.knobs[target.slot][target.part] = id;
  });
  const setVariant = (slot: Slot, patch: Partial<Pick<Knob, "style" | "height">>) => edit((b) => {
    const k = { ...b.knobs[slot], ...patch };
    if (!variantOk(k.style, k.height)) k.height = "short";
    b.knobs[slot] = k;
  });

  const loadBuild = (b: Fm1Build, id: string) => { setBuild({ ...cloneBuild(b), mode }); setThemeId(id); setSelKnob(null); scene.current?.focus(null); scene.current?.clearHighlight(); };
  const applyCode = () => {
    try { loadBuild(decodeFm1(codeIn), ""); setMsg(""); setCodeIn(""); }
    catch (e) { setMsg((e as Error).message); }
  };
  const saveCustom = () => {
    const n = Math.max(0, ...saved.map((t) => Number(/^Custom (\d+)$/.exec(t.name)?.[1] ?? 0))) + 1;
    const list = [...saved, { id: "c" + Date.now(), name: `Custom ${n}`, code }];
    setSaved(list); storeSaved(list);
  };
  const copy = async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(code); ok = true; } catch { /* blocked: the dialog shows the code */ }
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 1500);
    setCopyOk(ok);
    setThanks(true);   // always open the dialog, it shows the code for a manual copy
  };
  const saveImage = async () => {
    const snap = scene.current?.snapshot();
    if (!snap) return;
    await exportFm1Image({ build, hex, factory: fac, snapshot: snap, code });
  };

  const groupVal = (g: "L" | "R", part: "body" | "cap") => {
    const ids = GROUPS[g].map((s) => build.knobs[s][part]);
    return ids.every((i) => i === ids[0]) ? ids[0] : null; // null = mixed
  };
  const isTarget = (t: Target) => JSON.stringify(t) === JSON.stringify(target);
  const curId = target.k === "fp" ? (target.part === "bezel" ? build.bezel ?? build.accent : target.part === "side" ? build.side ?? build.body : target.part === "logo" ? build.logo : build[target.part])
    : target.k === "group" ? groupVal(target.g, target.part)
    : build.knobs[target.slot][target.part];

  const sel = selKnob ? build.knobs[selKnob] : null;
  const live = info.launched;
  const waitBlurb = `The FM1_Kz cases and knobs are almost here. Join the list and get ${SITE.waitlist.discountPercent}% off at launch, we will email you when the listing goes live.`;

  return (
    <div>
      {/* themes */}
      <div className="mb-5">
        <ThemeFilmstrip
          aspect="aspect-[8/5]"
          items={[
            ...FIXED_THEMES.map((t) => ({ id: t.id, name: t.name, build: t.build })),
            ...(saved.map((t) => { try { return { id: t.id, name: t.name, build: decodeFm1(t.code) }; } catch { return null; } })
              .filter(Boolean) as { id: string; name: string; build: Fm1Build }[]),
          ].map((t) => ({
            id: t.id, name: t.name, removable: !FIXED_THEMES.some((f) => f.id === t.id),
            thumb: <Fm1Thumb build={{ ...t.build, mode }} hex={hex} factory={fac} />,
          }))}
          onRemove={(id) => { const list = saved.filter((x) => x.id !== id); setSaved(list); storeSaved(list); }}
          activeId={themeId || null}
          onSelect={(id) => {
            const t = FIXED_THEMES.find((x) => x.id === id);
            if (t) return loadBuild(t.build, id);
            const sv = saved.find((x) => x.id === id);
            if (sv) { try { loadBuild(decodeFm1(sv.code), id); } catch { /* bad saved code */ } }
          }}
          onSave={saveCustom}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 3D */}
        <div className="lg:sticky lg:top-4 self-start">
          <div className="relative">
            <div ref={host} className="w-full aspect-[4/3] max-h-[55vh] lg:max-h-none rounded-xl overflow-hidden border border-border bg-[#1f2125]" />
            <div className="pointer-events-none absolute left-3 top-3 bg-black/60 px-2.5 py-1.5">
              <span className="ks block text-xl leading-none text-white">{partLabel}</span>
            </div>
          </div>
          <p className="text-[11px] text-text-muted mt-1">Drag to orbit, scroll to zoom, tap a part to edit it. Preview only.</p>
        </div>

        {/* controls */}
        <div className="space-y-4">
          <section>
            <h3 className="font-mono text-[11px] font-medium tracking-wider text-text-muted mb-2">YOUR DEVICE COLOR</h3>
            <div className="flex flex-wrap gap-2">
              {FACTORY_COLORS.map((f) => (
                <button
                  key={f.id}
                  title={f.name}
                  aria-label={f.name}
                  onClick={() => setFactory(f.id)}
                  className={`w-11 h-11 rounded-lg border-2 cursor-pointer p-1 ${factory === f.id ? "border-accent" : "border-border"}`}
                >
                  <span className="block w-full h-full rounded" style={{ background: `linear-gradient(135deg, ${f.body} 55%, ${f.keys} 55%)` }} />
                </button>
              ))}
            </div>
            <p className="text-[11px] text-text-muted mt-1">Only for your preview, it is not part of the order code.</p>
          </section>

          <section className="bg-surface-card border border-border p-2">
            <Fm1TopView
              build={build}
              hex={hex}
              factory={fac}
              ix={{
                selKnob,
                selFp: target.k === "fp" && !selKnob ? target.part : null,
                selGroup: target.k === "group" ? { g: target.g, part: target.part } : null,
                groupVal,
                onKnob: (s) => pickKnob(s),
                hover,
                onHover: (h) => {
                  if (!h) return setHover(null);
                  if (h.slot) return setHover({ names: [`mat_knob_${h.slot}_body`, `mat_knob_${h.slot}_cap`], slot: h.slot });
                  const part = h.fp ?? "body";
                  setHover({
                    names: part === "logo" ? ["mat_bezel_logo"] : part === "bezel" ? ["mat_bezel_simple", "mat_bezel_ext"] : part === "accent" ? ["mat_faceplate_accent"] : ["mat_faceplate_body", ...(build.side === null ? ["mat_faceplate_side"] : [])],
                    fp: part,
                  });
                },
                onFaceplate: pickFaceplate,
                onBezel: () => pickFp("bezel"),
                onLogo: () => pickFp("logo"),
                onGroup: (g, part) => { setSelKnob(null); setTarget({ k: "group", g, part }); },
              }}
            />
          </section>

          {/* knob card */}
          {sel && selKnob && (
            <section className="rounded-xl border border-border bg-surface-card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-text-primary">Knob {SLOT_LABEL[selKnob]}</span>
                <button className="text-xs text-text-muted cursor-pointer" onClick={clearSel}>Done</button>
              </div>
              <div className="flex gap-3">
                {/* high quality picture, only when renders exist for this variant (see public/renders/README.md) */}
                <KnobRender style={sel.style} height={sel.height} body={hex(sel.body)} cap={hex(sel.cap)} size={112} className="shrink-0 self-center" />
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 mb-2">
                    {(["body", "cap"] as const).map((part) => (
                      <button key={part} onClick={() => setTarget({ k: "knob", slot: selKnob, part })}
                        className={`flex-1 py-2 text-sm border cursor-pointer min-h-11 ${isTarget({ k: "knob", slot: selKnob, part }) ? "border-accent text-accent" : "border-border text-text-muted"}`}>
                        {part === "body" ? "Body" : "Cap"}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {([["classic", "short", "Classic"], ["groove", "short", "Groove"], ["groove", "long", "Groove long"]] as const).map(([st, h, label]) => (
                      <button key={label} onClick={() => setVariant(selKnob, { style: st, height: h })}
                        className={`px-3 py-2 text-sm border cursor-pointer min-h-11 flex flex-col items-center gap-1 ${sel.style === st && sel.height === h ? "border-accent text-accent" : "border-border text-text-muted"}`}>
                        <KnobRender style={st} height={h} body={hex(sel.body)} cap={hex(sel.cap)} size={44} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* bezel type: the basic ring, or the badge bezel with a strip for the firmware name */}
          {mode === "case" && (
            <section>
              <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-text-muted">
                <span className="font-semibold tracking-wider">BEZEL TYPE:</span>
                {([["Basic", false], ["Badge (firmware)", true]] as const).map(([label, isBadge]) => (
                  <button key={label}
                    onClick={() => { edit((b) => { b.badge = isBadge ? (b.badge ?? "blank") : null; }); pickFp("bezel"); }}
                    className={`px-2 py-1 border cursor-pointer ${(build.badge !== null) === isBadge ? "border-accent text-accent" : "border-border"}`}>
                    {label}
                  </button>
                ))}
              </div>
              {build.badge !== null && (
                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-text-muted">
                  <span className="font-semibold tracking-wider">FIRMWARE:</span>
                  {FIRMWARES.map((fw) => (
                    <button key={fw} onClick={() => edit((b) => { b.badge = fw; })}
                      className={`px-2 py-1 border cursor-pointer ${build.badge === fw ? "border-accent text-accent" : "border-border"}`}>
                      {fw}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* color tray */}
          <section>
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-text-muted">
              <span className="font-semibold tracking-wider">COLOR FOR:</span>
              {mode === "case" && ((build.badge !== null ? ["body", "accent", "side", "bezel", "logo"] : ["body", "accent", "side", "bezel"]) as ("body" | "accent" | "side" | "bezel" | "logo")[]).map((part) => (
                <button key={part} onClick={() => { setSelKnob(null); setTarget({ k: "fp", part }); }}
                  className={`px-2 py-1 rounded border cursor-pointer ${isTarget({ k: "fp", part }) ? "border-accent text-accent" : "border-border"}`}>
                  {part === "body" ? "Faceplate" : part === "accent" ? "Accent color" : part === "side" ? "Sides" : part === "logo" ? "Firmware" : "Bezel"}
                </button>
              ))}
              {mode === "case" && build.side !== null && target.k === "fp" && target.part === "side" && (
                <button className="underline cursor-pointer" onClick={() => edit((b) => { b.side = null; })}>follow faceplate</button>
              )}
              {mode === "case" && build.logo !== null && target.k === "fp" && target.part === "logo" && (
                <button className="underline cursor-pointer" onClick={() => edit((b) => { b.logo = null; })}>auto (black or white)</button>
              )}
              {mode === "case" && build.bezel !== null && target.k === "fp" && target.part === "bezel" && (
                <button className="underline cursor-pointer" onClick={() => edit((b) => { b.bezel = null; })}>follow labels</button>
              )}
              {target.k === "group" && <span>Group {target.g === "L" ? "V S P A" : "K1-K4"} {target.part}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button key={c.id} title={c.name} aria-label={c.name} onClick={() => setColor(c.id)}
                  className={`w-11 h-11 rounded-full border-2 cursor-pointer ${curId === c.id ? "border-accent" : "border-border"}`}
                  style={{ background: c.hex }} />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* code + waitlist */}
      <section className="mt-4 rounded-xl border border-border bg-surface-card p-4 space-y-3">
        <div>
          <div className="font-mono text-[11px] font-medium tracking-wider text-text-muted mb-1">YOUR ORDER CODE</div>
          <code className="block break-all text-sm text-text-primary bg-surface rounded-lg p-2 border border-border">{code}</code>
          <div className="flex flex-wrap gap-2 mt-2">
            <button onClick={copy} className="px-3 py-2 text-sm rounded-lg border border-border cursor-pointer min-h-11 hover:bg-surface-hover">{copied ? "Copied ✓" : "Copy code"}</button>
            {live && info.etsyUrl && (
              <a href={info.etsyUrl} target="_blank" rel="noreferrer" className="px-3 py-2 text-sm rounded-lg bg-accent text-[#0f0f0f] font-semibold min-h-11 inline-flex items-center">Buy on Etsy ↗</a>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <input value={codeIn} onChange={(e) => setCodeIn(e.target.value)} placeholder="Paste a code to load it"
            className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-accent" />
          <button onClick={applyCode} disabled={!codeIn.trim()} className="px-3 py-2 text-sm rounded-lg border border-border cursor-pointer min-h-11 disabled:opacity-40">Load</button>
        </div>
        {msg && <p className="text-xs text-red-400">{msg}</p>}

        {!live && (
          <div className="rounded-lg bg-accent/10 border border-accent/40 p-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-text-primary flex-1 min-w-48">
              The FM1_Kz line is almost here. Design yours now and join the waiting list for {SITE.waitlist.discountPercent}% off at launch, we will email you the moment the listing goes live.
            </p>
            <button onClick={() => setWaitOpen(true)} className="px-4 py-2 text-sm rounded-lg bg-accent text-[#0f0f0f] font-semibold cursor-pointer min-h-11">
              {SITE.waitlist.name} Waiting List
            </button>
          </div>
        )}
      </section>

      <p className="text-[11px] text-text-muted mt-3 text-center">FM1 Kustomizer v{FM1_VERSION}</p>
      {thanks && <OrderCopiedModal code={code} copied={copyOk} onSaveImage={saveImage} onClose={() => setThanks(false)} />}
      {waitOpen && <NotifyModal productId={SITE.waitlist.id} productName={SITE.waitlist.name} type="launch" title={`${SITE.waitlist.name} waiting list`} blurb={waitBlurb} discountCode={SITE.waitlist.discountCode} discountPercent={SITE.waitlist.discountPercent} onClose={() => setWaitOpen(false)} />}
    </div>
  );
}
