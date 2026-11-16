import { useEffect, useMemo, useRef, useState } from "react";
import { colorsStore } from "@/data/colorsStore.ts";
import { SITE } from "@/config/site.ts";
import { offeredColors } from "@/data/colorAvailability.ts";
import { NotifyModal } from "@/components/ui/NotifyModal.tsx";
import { OrderCopiedModal } from "@/components/ui/OrderCopiedModal.tsx";
import { exportFm1Image } from "./fm1Image.ts";
import { KnobRender } from "./KnobRender.tsx";
import { firmwareById } from "@/data/firmwares.ts";
import { KnobStats } from "./KnobStats.tsx";
import { RadialColorMenu } from "./RadialColorMenu.tsx";
import { GlitchSwap } from "@/components/ui/GlitchSwap.tsx";
import { SaveThemeModal } from "@/components/ui/SaveThemeModal.tsx";
import { ConfirmModal } from "@/components/ui/ConfirmModal.tsx";
import { KUSTOMIZER_PRODUCTS } from "@/data/kustomizerProducts.ts";
import {
  decodeFm1, encodeFm1, FIRMWARES, GROUPS, SLOTS, SLOT_NAME, variantOk,
  type Fm1Build, type Knob, type Slot,
} from "./fm1Code.ts";
import { ThemeFilmstrip } from "@/components/ui/ThemeFilmstrip.tsx";
import { Fm1Thumb } from "./Fm1Thumb.tsx";
import { Fm1TopView } from "./Fm1TopView.tsx";
import { Fm1Scene, type Pick as ScenePick } from "./fm1Scene.ts";
import {
  FACTORY_COLORS, FIXED_THEMES, FM1_VERSION, KNOB_SPECS, loadSaved, storeSaved, type FactoryId,
} from "./fm1Data.ts";

type Target =
  | { k: "fp"; part: "body" | "accent" | "side" | "bezel" | "logo" }
  | { k: "group"; g: "L" | "R"; part: "body" | "cap" }
  | { k: "knob"; slot: Slot; part: "body" | "cap" };

const GLB = `${import.meta.env.BASE_URL}models/FM1_Kz_preview_ALLVARIANTS_v0.6.glb`;
const cloneBuild = (b: Fm1Build): Fm1Build => JSON.parse(JSON.stringify(b));

export function Fm1Kustomizer({ mode }: { mode: "case" | "knobs" }) {
  const info = KUSTOMIZER_PRODUCTS.find((p) => p.kind === (mode === "case" ? "fm1-case" : "fm1-knobs"))!;
  const allColors = colorsStore.getColors();
  const colors = offeredColors("fm1-kz", allColors);   // what the tray offers (see src/data/colorAvailability.ts)
  const hex = (id: string) => allColors.find((c) => c.id === id)?.hex ?? "#888888";   // any color still draws, even if no longer offered

  const start = (): Fm1Build => ({ ...cloneBuild(FIXED_THEMES[0].build), mode });
  const [build, setBuild] = useState<Fm1Build>(start);
  const [factory, setFactory] = useState<FactoryId>("beige1");
  // knobs-only has no faceplate: start on the left knob group so a color click does something
  const [target, setTarget] = useState<Target>(mode === "case" ? { k: "fp", part: "body" } : { k: "group", g: "L", part: "body" });
  const [selKnob, setSelKnob] = useState<Slot | null>(null);
  const [themeId, setThemeId] = useState<string>(FIXED_THEMES[0].id);
  const [saved, setSaved] = useState(loadSaved);
  const [codeIn, setCodeIn] = useState("");
  const [msg, setMsg] = useState("");
  const [waitOpen, setWaitOpen] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);
  const [allDone, setAllDone] = useState(false);
  const [naming, setNaming] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [peek, setPeek] = useState<string | null>(null);   // a shape button under the mouse: its stats are shown to compare
  const [origin, setOrigin] = useState<string | null>(null);   // the saved theme the buyer is editing, if any
  // color menu docked on the 3D view, opened by tapping a part (3D or 2D view)
  const [radial, setRadial] = useState(false);
  const openRadial = () => setRadial(true);
  const [thanks, setThanks] = useState(false);
  const [copyOk, setCopyOk] = useState(true);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<Fm1Scene | null>(null);
  type Hover = { names: string[]; slot?: Slot; fp?: "body" | "accent" | "side" | "bezel" | "logo"; part?: "body" | "cap"; group?: { g: "L" | "R"; part: "body" | "cap" } };
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
      if (p.k === "knob") pickKnob(p.slot, p.part);
      else pickFp(p.part);
      openRadial();
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

  // hovering a color in the menu shows it on the part (3D and 2D) without committing; only a click keeps it
  const [preview, setPreview] = useState<string | null>(null);
  const shown = useMemo(() => {
    if (!preview) return build;
    const b = cloneBuild(build);
    paint(b, preview);
    return b;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, build, target]);
  useEffect(() => { scene.current?.apply(shown, fac); }, [shown, fac]);

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
  const fpName = { body: "FACEPLATE", accent: "ACCENT COLOR", side: "SIDES", bezel: "BEZEL", logo: "FIRMWARE LOGO" };
  const targetLabel = useMemo(() => {
    if (target.k === "fp") return fpName[target.part];
    const which = target.part === "body" ? "BODY" : "CAP";
    if (target.k === "group") return `KNOBS ${GROUPS[target.g].map((s) => SLOT_NAME[s]).join(" ")} · ${target.part === "body" ? "BODIES" : "CAPS"}`;
    return `KNOB ${SLOT_NAME[target.slot]} · ${which}`;
  }, [target]);
  const partLabel = useMemo(() => {
    if (hover?.group) return `KNOBS ${GROUPS[hover.group.g].map((x) => SLOT_NAME[x]).join(" ")} · ${hover.group.part === "body" ? "BODIES" : "CAPS"}`;
    if (hover?.fp) return fpName[hover.fp];
    if (hover?.slot) return `KNOB ${SLOT_NAME[hover.slot]}${hover.part ? ` · ${hover.part === "body" ? "BODY" : "CAP"}` : ""}`;
    return targetLabel;
  }, [targetLabel, hover]);
  useEffect(() => { scene.current?.setHover(hover?.names ?? []); }, [hover]);
  useEffect(() => { scene.current?.highlight(hlNames); }, [hlNames]);


  function pickFp(part: "body" | "accent" | "side" | "bezel" | "logo") { setSelKnob(null); setTarget({ k: "fp", part }); scene.current?.focus("faceplate"); }
  function pickFaceplate() { pickFp("body"); }
  function pickKnob(s: Slot, part: "body" | "cap" = "body") { setSelKnob(s); setTarget({ k: "knob", slot: s, part }); scene.current?.focus(s); }
  function clearSel() { setRadial(false); setSelKnob(null); scene.current?.focus(null); scene.current?.clearHighlight(); }

  const edit = (fn: (b: Fm1Build) => void) => { const b = cloneBuild(build); fn(b); setBuild(b); setThemeId(""); };
  // paints the selected part (what `target` points at) with a color, on the build it is given
  function paint(b: Fm1Build, id: string) {
    if (target.k === "fp") {
      if (target.part === "bezel") b.bezel = id;
      else if (target.part === "logo") b.logo = id;
      else if (target.part === "side") b.side = id;
      else b[target.part] = id;
    } else if (target.k === "group") {
      GROUPS[target.g].forEach((s) => { b.knobs[s][target.part] = id; });
    } else b.knobs[target.slot][target.part] = id;
  }
  const setColor = (id: string) => { setPreview(null); edit((b) => paint(b, id)); };
  const applyAll = (slot: Slot) => edit((b) => { const k = { ...b.knobs[slot] }; SLOTS.forEach((x) => { b.knobs[x] = { ...k }; }); });
  const setVariant = (slot: Slot, patch: Partial<Pick<Knob, "style" | "height">>) => edit((b) => {
    const k = { ...b.knobs[slot], ...patch };
    if (!variantOk(k.style, k.height)) k.height = "short";
    b.knobs[slot] = k;
  });

  const loadBuild = (b: Fm1Build, id: string) => { setOrigin(saved.some((x) => x.id === id) ? id : null); setBuild({ ...cloneBuild(b), mode }); setThemeId(id); setSelKnob(null); scene.current?.focus(null); scene.current?.clearHighlight(); };
  const applyTheme = (id: string) => {
    const t = FIXED_THEMES.find((x) => x.id === id);
    if (t) return loadBuild(t.build, id);
    const sv = saved.find((x) => x.id === id);
    if (sv) { try { loadBuild(decodeFm1(sv.code), id); } catch { /* bad saved code */ } }
  };
  const applyCode = () => {
    try { loadBuild(decodeFm1(codeIn), ""); setMsg(""); setCodeIn(""); }
    catch (e) { setMsg((e as Error).message); }
  };
  const nextName = () => `Custom ${Math.max(0, ...saved.map((t) => Number(/^Custom (\d+)$/.exec(t.name)?.[1] ?? 0))) + 1}`;
  const saveCustom = (name = nextName()) => {
    const id = "c" + Date.now();
    const list = [...saved, { id, name, code }];
    setSaved(list); storeSaved(list);
    return id;
  };
  // the buyer's own, unsaved customization shows up as an extra card in the strip ("Not saved")
  const isDraft = themeId === "" && !saved.some((x) => x.code === code);
  const editingSaved = isDraft && origin && saved.some((x) => x.id === origin) ? origin : null;   // shows "Update?" on that card
  const updateSaved = (id: string) => { const list = saved.map((x) => (x.id === id ? { ...x, code } : x)); setSaved(list); storeSaved(list); setThemeId(id); setOrigin(id); };
  const copy = async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(code); ok = true; } catch { /* blocked: the dialog shows the code */ }
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

  const sel = selKnob ? shown.knobs[selKnob] : null;
  const live = info.launched;
  const waitBlurb = `The FM1_Kz cases and knobs are almost here. Join the list and get ${SITE.waitlist.discountPercent}% off at launch, we will email you when the listing goes live.`;

  const codePanel = (
    <>
    <section className="mt-4 rounded-xl border border-border bg-surface-card p-4 space-y-3">
      <div>
        <div className="flex flex-wrap gap-2">
          <button onClick={copy} className="px-6 py-2 text-sm rounded-lg bg-accent text-[#0f0f0f] font-semibold cursor-pointer min-h-11">Finish</button>
          {live && info.etsyUrl && (
            <a href={info.etsyUrl} target="_blank" rel="noreferrer" className="px-3 py-2 text-sm rounded-lg bg-accent text-[#0f0f0f] font-semibold min-h-11 inline-flex items-center">Buy on Etsy ↗</a>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <input value={codeIn} onChange={(e) => setCodeIn(e.target.value)} placeholder="Have a Theme Code? Paste it here"
          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text-primary focus:outline-none focus:border-accent" />
        <button onClick={applyCode} disabled={!codeIn.trim()} className="px-3 py-2 text-sm rounded-lg border border-border cursor-pointer min-h-11 disabled:opacity-40">Load</button>
      </div>
      {msg && <p className="text-xs text-red-400">{msg}</p>}

    </section>
    {!live && (
      <section className="mt-3">
        <button onClick={() => setWaitOpen(true)} className="w-full px-4 py-3 text-sm rounded-lg bg-accent text-[#0f0f0f] font-semibold cursor-pointer min-h-11 uppercase tracking-wide">
          <GlitchSwap texts={[`${SITE.waitlist.name} Waiting List`, `${SITE.waitlist.discountPercent}% coupon code!`]} />
        </button>
      </section>
    )}
    </>
  );

  return (
    <div>
      {/* themes */}
      <div className="mb-5">
        <ThemeFilmstrip
          aspect="aspect-[8/5]"
          items={[
            ...FIXED_THEMES.map((t) => ({ id: t.id, name: t.name, build: t.build })),
            ...(saved.map((t) => { try { return t.id === editingSaved ? { id: t.id, name: "Update?", build } : { id: t.id, name: t.name, build: decodeFm1(t.code) }; } catch { return null; } })
              .filter(Boolean) as { id: string; name: string; build: Fm1Build }[]),
            ...(isDraft && !editingSaved ? [{ id: "__draft", name: "Not saved", build }] : []),
          ].map((t) => ({
            id: t.id, name: t.name, draft: t.id === "__draft" || t.id === editingSaved, removable: t.id !== "__draft" && t.id !== editingSaved && !FIXED_THEMES.some((f) => f.id === t.id),
            thumb: <Fm1Thumb build={{ ...t.build, mode }} hex={hex} factory={fac} />,
          }))}
          onRemove={(id) => { const list = saved.filter((x) => x.id !== id); setSaved(list); storeSaved(list); }}
          activeId={isDraft ? editingSaved ?? "__draft" : themeId || null}
          onSelect={(id) => {
            if (id === "__draft") return setNaming(true);   // the unsaved card: offer to save it
            if (id === editingSaved) return setUpdating(true);   // an edited saved theme: update it or save a new one
            // own edits that are not saved as a theme would be lost: ask first
            if (isDraft) return setPendingTheme(id);
            applyTheme(id);
          }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 3D */}
        <div className="sticky top-[73px] z-30 min-w-0 self-start bg-[#0d0d0c]/95 backdrop-blur pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:bg-transparent lg:backdrop-blur-none lg:top-[88px]">
          <div className="relative" data-keep-radial>
            <div ref={host} className="w-full aspect-[4/3] max-h-[32vh] lg:max-h-none rounded-xl overflow-hidden border border-border bg-[#1f2125]" />
            <div className="pointer-events-none absolute left-3 top-3 bg-black/60 px-2.5 py-1.5">
              <span className="ks block text-xl leading-none text-white">{partLabel}</span>
            </div>
            {radial && (
        <RadialColorMenu colors={colors} currentId={curId} title={targetLabel.replace(/^KNOBS? /, "").replace(" · ", " ")}
          onPick={(id) => setColor(id)} onPreview={setPreview} onClose={() => { setPreview(null); setRadial(false); }}>
          {mode === "case" && target.k === "fp" && target.part === "side" && build.side !== null && (
            <button onClick={() => edit((b) => { b.side = null; })} className="px-3 min-h-9 text-xs border border-border-light text-text-primary cursor-pointer bg-[#0d0d0c]/90">Follow faceplate</button>
          )}
          {mode === "case" && target.k === "fp" && target.part === "logo" && build.logo !== null && (
            <button onClick={() => edit((b) => { b.logo = null; })} className="px-3 min-h-9 text-xs border border-border-light text-text-primary cursor-pointer bg-[#0d0d0c]/90">Auto (black or white)</button>
          )}
          {mode === "case" && target.k === "fp" && target.part === "bezel" && build.bezel !== null && (
            <button onClick={() => edit((b) => { b.bezel = null; })} className="px-3 min-h-9 text-xs border border-border-light text-text-primary cursor-pointer bg-[#0d0d0c]/90">Follow labels</button>
          )}
          {target.k === "knob" && selKnob && (
            <>
              {(["body", "cap"] as const).map((part) => (
                <button key={part} onClick={() => setTarget({ k: "knob", slot: selKnob, part })}
                  className={`px-3 min-h-9 text-xs border cursor-pointer bg-[#0d0d0c]/90 ${isTarget({ k: "knob", slot: selKnob, part }) ? "border-accent text-accent" : "border-border-light text-text-primary"}`}>
                  {part === "body" ? "Body" : "Cap"}
                </button>
              ))}
              <button onClick={() => applyAll(selKnob)}
                className="px-3 min-h-9 text-xs border border-border-light text-text-primary cursor-pointer bg-[#0d0d0c]/90">Apply to all</button>
            </>
          )}
        </RadialColorMenu>
      )}
            {/* high quality picture of the selected knob, over the 3D view (only when renders exist, see public/renders/README.md) */}
            {sel && selKnob && (
              <div className="pointer-events-none absolute left-2 bottom-2 w-[42%] max-w-72">
                <KnobRender style={sel.style} height={sel.height} slot={selKnob} body={hex(sel.body)} cap={hex(sel.cap)} size={256} fluid />
              </div>
            )}
          </div>
          <div className="mt-2 space-y-2">
          {/* knob card */}
          {sel && selKnob && (
            <section className="border border-border bg-surface-card p-2 sm:p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-text-primary">Knob {SLOT_NAME[selKnob]}</span>
                <button className="text-xs text-text-muted cursor-pointer" onClick={clearSel}>Done</button>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 mb-2">
                    {(["body", "cap"] as const).map((part) => (
                      <button key={part} onClick={() => setTarget({ k: "knob", slot: selKnob, part })}
                        className={`flex-1 py-2 text-sm border cursor-pointer min-h-11 ${isTarget({ k: "knob", slot: selKnob, part }) ? "border-accent text-accent" : "border-border text-text-muted"}`}>
                        {part === "body" ? "Body" : "Cap"}
                      </button>
                    ))}
                    {/* copies this knob (shape, body and cap color) to all the others */}
                    <button onClick={() => { applyAll(selKnob); setAllDone(true); setTimeout(() => setAllDone(false), 1500); }}
                      className="flex-1 py-2 text-sm border border-border text-text-muted cursor-pointer min-h-11 hover:border-accent hover:text-accent transition-colors">
                      {allDone ? "Applied ✓" : "Apply to all"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {([["classic", "short", "Classic Short"], ["classic", "long", "Chalice"], ["groove", "short", "Groove Short"], ["groove", "long", "Groove Long"]] as const).map(([st, h, label]) => (
                      <button key={label} onClick={() => setVariant(selKnob, { style: st, height: h })}
                        onPointerEnter={() => setPeek(`${st}_${h}`)} onPointerLeave={() => setPeek(null)}
                        className={`w-[72px] sm:w-[88px] aspect-square text-xs border cursor-pointer flex flex-col items-center justify-center gap-1 ${sel.style === st && sel.height === h ? "border-accent text-accent" : "border-border text-text-muted"}`}>
                        <KnobRender style={st} height={h} slot={selKnob} body={hex(sel.body)} cap={hex(sel.cap)} size={60} />
                        {label}
                      </button>
                    ))}
                  </div>
                  <KnobStats variant={peek ?? `${sel.style}_${sel.height}`} />
                  {(() => {
                    const sp = KNOB_SPECS[`${sel.style}_${sel.height}`];
                    return sp && (
                      <p className="mono mt-2 text-text-muted">
                        {sp.name}: {sp.d.toFixed(2)} cm wide, {sp.h.toFixed(2)} cm tall
                      </p>
                    );
                  })()}
                </div>
              </div>
            </section>
          )}

          {/* bezel type: the basic ring, or the badge bezel with a strip for the firmware name */}
          {mode === "case" && target.k === "fp" && (target.part === "bezel" || target.part === "logo") && (
            <section>
              <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-text-muted">
                <span className="font-semibold tracking-wider text-text-primary">BEZEL TYPE:</span>
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
                  <span className="font-semibold tracking-wider text-text-primary">FIRMWARE:</span>
                  {FIRMWARES.map((fw) => (
                    <button key={fw} onClick={() => edit((b) => { b.badge = fw; })}
                      className={`px-2 py-1 border cursor-pointer ${build.badge === fw ? "border-accent text-accent" : "border-border"}`}>
                      {firmwareById(fw)?.name ?? fw}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          
          </div>
          <p className="hidden lg:block text-[11px] text-text-muted mt-1">Drag to orbit, scroll to zoom, tap a part to edit it. Preview only.</p>
          {/* desktop: the order code sits under the 3D view, so the left column is never empty */}
          <div className="hidden lg:block">{codePanel}</div>
        </div>

        {/* controls */}
        <div className="space-y-4 min-w-0">
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

          <section className="bg-surface-card border border-border p-2" data-keep-radial>
            <Fm1TopView
              build={shown}
              hex={hex}
              factory={fac}
              ix={{
                selKnob,
                selFp: target.k === "fp" && !selKnob ? target.part : null,
                selGroup: target.k === "group" ? { g: target.g, part: target.part } : null,
                groupVal,
                onKnob: (s, part) => { pickKnob(s, part); openRadial(); },
                hover,
                label: partLabel,
                onHover: (h) => {
                  if (!h) return setHover(null);
                  if (h.group) return setHover({ names: GROUPS[h.group.g].map((x) => `mat_knob_${x}_${h.group!.part}`), group: h.group });
                  if (h.slot) return setHover({ names: h.part ? [`mat_knob_${h.slot}_${h.part}`] : [`mat_knob_${h.slot}_body`, `mat_knob_${h.slot}_cap`], slot: h.slot, part: h.part });
                  const part = h.fp ?? "body";
                  setHover({
                    names: part === "logo" ? ["mat_bezel_logo"] : part === "bezel" ? ["mat_bezel_simple", "mat_bezel_ext"] : part === "accent" ? ["mat_faceplate_accent"] : ["mat_faceplate_body", ...(build.side === null ? ["mat_faceplate_side"] : [])],
                    fp: part,
                  });
                },
                onFaceplate: () => { pickFaceplate(); openRadial(); },
                onBezel: () => { pickFp("bezel"); openRadial(); },
                onLogo: () => { pickFp("logo"); openRadial(); },
                onGroup: (g, part) => { setSelKnob(null); setTarget({ k: "group", g, part }); openRadial(); },
              }}
            />
          </section>

        </div>
      </div>


      {/* phone and tablet: after the controls */}
      <div className="lg:hidden">{codePanel}</div>

      <p className="text-[11px] text-text-muted mt-3 text-center">FM1 Kustomizer v{FM1_VERSION}</p>
      {updating && editingSaved && (
        <ConfirmModal title="Update this theme?" text={`You changed "${saved.find((x) => x.id === editingSaved)?.name}". Update it, or keep it as it was and save your version as a new theme.`}
          yes="Save as new" no="Cancel" alt={{ label: "Update", onClick: () => { updateSaved(editingSaved); setUpdating(false); } }}
          onYes={() => { setUpdating(false); setNaming(true); }} onNo={() => setUpdating(false)} />
      )}
      {naming && (
        <SaveThemeModal defaultName={nextName()} onClose={() => setNaming(false)}
          onSave={(name) => { setThemeId(saveCustom(name)); setNaming(false); }} />
      )}
      {pendingTheme && (
        <ConfirmModal title="Change theme?" text="Your current customization will be lost. Save it as a new theme first to keep it."
          yes="Load without saving" alt={{ label: "Save mine, then load", onClick: () => { saveCustom(); applyTheme(pendingTheme); setPendingTheme(null); } }} onYes={() => { applyTheme(pendingTheme); setPendingTheme(null); }} onNo={() => setPendingTheme(null)} />
      )}
      {thanks && <OrderCopiedModal code={code} copied={copyOk} onSaveImage={saveImage} onClose={() => setThanks(false)} />}
      {waitOpen && <NotifyModal productId={SITE.waitlist.id} productName={SITE.waitlist.name} type="launch" title={`${SITE.waitlist.name} waiting list`} blurb={waitBlurb} discountCode={SITE.waitlist.discountCode} discountPercent={SITE.waitlist.discountPercent} discountUntil={SITE.waitlist.discountUntil} onClose={() => setWaitOpen(false)} />}
    </div>
  );
}
