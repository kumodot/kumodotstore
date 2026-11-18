import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { colorsStore } from "@/data/colorsStore.ts";
import { SITE } from "@/config/site.ts";
import { offeredColors } from "@/data/colorAvailability.ts";
import { NotifyModal } from "@/components/ui/NotifyModal.tsx";
import { OrderCopiedModal } from "@/components/ui/OrderCopiedModal.tsx";
import { exportFm1Image } from "./fm1Image.ts";
import { KnobRender, preloadKnobRenders } from "./KnobRender.tsx";
import { firmwareById } from "@/data/firmwares.ts";
import { FM1_FEATURES, FM1_PUBLIC_VIEW } from "@/data/fm1Features.ts";
import { KnobStats } from "./KnobStats.tsx";
import { RadialColorMenu } from "./RadialColorMenu.tsx";
import { GlitchSwap } from "@/components/ui/GlitchSwap.tsx";
import { SaveThemeModal } from "@/components/ui/SaveThemeModal.tsx";
import { ConfirmModal } from "@/components/ui/ConfirmModal.tsx";
import { KUSTOMIZER_PRODUCTS } from "@/data/kustomizerProducts.ts";
import {
  bezelId, decodeFm1, encodeFm1, FIRMWARES, GROUPS, NO_BEZEL, SLOTS, SLOT_NAME, variantOk,
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

const GLB = `${import.meta.env.BASE_URL}models/FM1_Kz_site_v0.87.glb`;
// optional: a file with a few new or replaced parts, only used if it exists (see Fm1Scene.mergeOverrides)
const GLB_OVERRIDES = `${import.meta.env.BASE_URL}models/FM1_Kz_overrides.glb`;
const cloneBuild = (b: Fm1Build): Fm1Build => JSON.parse(JSON.stringify(b));

type FpPartName = "body" | "accent" | "side" | "bezel" | "logo";
/** A part that is turned off in FM1_FEATURES hands its clicks to the part that now drives it. */
/** The four knob models, in the order the arrows go through them. */
const MODELS = [
  { st: "classic", h: "short" }, { st: "classic", h: "long" }, { st: "groove", h: "short" }, { st: "groove", h: "long" },
] as const;
const effPartBase = (p: FpPartName): FpPartName => (!FM1_FEATURES.sides && p === "side" ? "body" : !FM1_FEATURES.badge && p === "logo" ? "accent" : p);
/** The materials a faceplate part controls (for the highlight and the hover glow). */
const fpMats = (p: FpPartName, sideFollows: boolean) =>
  p === "body" ? ["mat_faceplate_body", ...(sideFollows ? ["mat_faceplate_side"] : [])]
    : p === "accent" ? (FM1_FEATURES.badge ? ["mat_faceplate_accent", "mat_faceplate_accent_labels"] : ["mat_faceplate_accent", "mat_faceplate_accent_labels", "mat_bezel_simple", "mat_bezel_ext"])
    : p === "side" ? ["mat_faceplate_side"] : p === "logo" ? ["mat_bezel_logo"] : ["mat_bezel_simple", "mat_bezel_ext"];
/** Features that are off are fixed in the build, so nothing hidden can reach the code. */
const norm = (b: Fm1Build): Fm1Build => {
  if (!FM1_FEATURES.sides) b.side = null;
  if (!FM1_FEATURES.badge) { b.badge = null; b.logo = null; }   // the bezel color (or its deletion) stays as it is
  return b;
};

/** A fixed theme has a sides color of its own, and the public editor does not offer sides yet: its faceplate cannot be edited,
 *  unless the faceplate becomes one plain color (sides follow it). The badge, logo and bezel stay as the theme has them and are printed with it. */
const isLocked = (b: Fm1Build) => !FM1_FEATURES.sides && b.side !== null && b.side !== b.body;

export function Fm1Kustomizer({ mode }: { mode: "case" | "knobs" }) {
  const info = KUSTOMIZER_PRODUCTS.find((p) => p.kind === (mode === "case" ? "fm1-case" : "fm1-knobs"))!;
  const allColors = colorsStore.getColors();
  const colors = offeredColors("fm1-kz", allColors);   // what the tray offers (see src/data/colorAvailability.ts)
  const hex = (id: string) => allColors.find((c) => c.id === id)?.hex ?? "#888888";   // any color still draws, even if no longer offered
  const isT = (id: string) => !!allColors.find((c) => c.id === id)?.translucent;      // translucent filament: striped swatch, see-through in 3D

  const start = (): Fm1Build => ({ ...cloneBuild(FIXED_THEMES[0].build), mode });   // a fixed theme shows everything it has
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
  const [specsOpen, setSpecsOpen] = useState(false);   // phone: knob specs are folded away ("curtain") by default
  const [kitUp, setKitUp] = useState(false);   // "hide faceplate": the case slides up to show the bare device (view only)
  const [facOpen, setFacOpen] = useState(false);   // the device-color drawer over the 3D view
  const facRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!facOpen) return;
    const down = (e: PointerEvent) => { if (!facRef.current?.contains(e.target as Node)) setFacOpen(false); };
    window.addEventListener("pointerdown", down, true);
    return () => window.removeEventListener("pointerdown", down, true);
  }, [facOpen]);
  // bezel and accent are one color ("Accent + Bezel") until the buyer unlinks them; unlinked, each has its own color
  const [forceSplit, setForceSplit] = useState(false);
  const split = forceSplit || bezelId(build) !== build.accent;
  const effPart = (p: FpPartName): FpPartName => effPartBase(!split && p === "bezel" ? "accent" : p);
  const setLink = (on: boolean) => { setForceSplit(!on); edit((b) => { b.bezel = on ? null : b.bezel === NO_BEZEL ? NO_BEZEL : b.accent; }); };
  const [allKnobs, setAllKnobs] = useState(false);   // "Affect all" is a mode: while on, every model / color change goes to all 8 knobs (each keeps its other settings)
  const [naming, setNaming] = useState(false);
  // the buyer tried to edit a part that is not editable yet (sides color, firmware badge): a notice over the 3D view, it goes away by itself
  const [soonAsk, setSoonAsk] = useState<{ text: string } | null>(null);
  const [hist, setHist] = useState<{ b: Fm1Build; id: string }[]>([]);   // undo stack: the builds before each change
  const [updating, setUpdating] = useState(false);
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
  const themeIdRef = useRef(themeId); themeIdRef.current = themeId;

  // the code is the build; derived, never stored
  const code = useMemo(() => encodeFm1(build), [build]);
  const fac = FACTORY_COLORS.find((f) => f.id === factory)!;

  useEffect(() => {
    const s = new Fm1Scene(host.current!);
    scene.current = s;
    s.colorOf = { hex, translucent: isT };
    const fpNames = (part: FpPartName) => fpMats(effPart(part), buildRef.current.side === null);
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
    s.load(GLB, GLB_OVERRIDES).then(() => { s.apply(buildRef.current, fac); }).catch(() => setMsg("Could not load the 3D model."));
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
      return fpMats(effPart(target.part), build.side === null);
    }
    const slots = target.k === "group" ? GROUPS[target.g] : [target.slot];
    return slots.map((s) => `mat_knob_${s}_${target.part}`);
  }, [target, build.side]);
  // name of the part being customized, shown in a corner of the 3D view
  const fpName: Record<FpPartName, string> = { body: "FACEPLATE", accent: FM1_FEATURES.badge ? "ACCENT COLOR" : "ACCENT + BEZEL", side: "SIDES", bezel: "BEZEL", logo: "FIRMWARE LOGO" };
  const targetLabel = useMemo(() => {
    if (target.k === "fp") return fpName[effPart(target.part)];
    const which = target.part === "body" ? "BODY" : "CAP";
    if (target.k === "group") return `KNOBS ${GROUPS[target.g].map((s) => SLOT_NAME[s]).join(" ")} · ${target.part === "body" ? "BODIES" : "CAPS"}`;
    return `KNOB ${SLOT_NAME[target.slot]} · ${which}`;
  }, [target]);
  const partLabel = useMemo(() => {
    if (hover?.group) return `KNOBS ${GROUPS[hover.group.g].map((x) => SLOT_NAME[x]).join(" ")} · ${hover.group.part === "body" ? "BODIES" : "CAPS"}`;
    if (hover?.fp) return fpName[effPart(hover.fp)];
    if (hover?.slot) return `KNOB ${SLOT_NAME[hover.slot]}${hover.part ? ` · ${hover.part === "body" ? "BODY" : "CAP"}` : ""}`;
    return targetLabel;
  }, [targetLabel, hover]);
  useEffect(() => { scene.current?.setKitLifted(kitUp); }, [kitUp]);
  useEffect(() => { setKitUp(false); }, [build, mode]);   // touching the case (a theme, a color, a part) brings it back
  useEffect(() => { scene.current?.setHover(hover?.names ?? []); }, [hover]);
  useEffect(() => { scene.current?.highlight(hlNames); }, [hlNames]);
  // the notice goes away by itself
  useEffect(() => {
    if (!soonAsk) return;
    const t = window.setTimeout(() => setSoonAsk(null), 3500);
    return () => window.clearTimeout(t);
  }, [soonAsk]);
  useEffect(() => { preloadKnobRenders(); }, []);
  // Studio only: hooks for the demo mode (fake cursor + scripted clicks)
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __fm1Demo?: unknown }).__fm1Demo = { scene: scene.current, slots: SLOTS, pickKnob, pickFp, openRadial, clearSel };
  });
  useEffect(() => { if (!selKnob) setAllKnobs(false); }, [selKnob]);
  // Ctrl/Cmd + Z = undo; left / right arrows = previous / next knob model (not while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && selKnob) {
        e.preventDefault(); stepModel(e.key === "ArrowRight" ? 1 : -1); return;
      }
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.key.toLowerCase() !== "z") return;
      e.preventDefault(); undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });


  function pickFp(raw: FpPartName) {
    const cur = buildRef.current;
    const part = effPart(raw);
    let note: string | null = null;
    if (isLocked(cur)) {
      // a theme with its own sides color: touching the faceplate copies the faceplate color onto the sides (they follow it from now on)
      const b = cloneBuild(cur); b.side = null;
      setHist((h) => [...h.slice(-49), { b: cloneBuild(cur), id: themeIdRef.current }]);
      setBuild(b); setThemeId("");
      note = "Sides color is not editable yet (soon). The sides now follow the faceplate color.";
    } else if (raw === "side" && part !== raw) note = "Sides color is not editable yet (soon).";
    else if (raw === "logo" && part !== raw) note = "Editing firmware badges is coming soon!";
    if (note) setSoonAsk({ text: note });
    setSelKnob(null); setTarget({ k: "fp", part }); scene.current?.focus("faceplate"); }
  function pickFaceplate() { pickFp("body"); }
  function pickKnob(s: Slot, part: "body" | "cap" = "body") { setSelKnob(s); setTarget({ k: "knob", slot: s, part }); scene.current?.focus(s); }
  function clearSel() { setAllKnobs(false); setRadial(false); setSelKnob(null); scene.current?.focus(null); scene.current?.clearHighlight(); }

  const snap = () => setHist((h) => [...h.slice(-49), { b: cloneBuild(build), id: themeId }]);
  const undo = () => {
    const l = hist[hist.length - 1];
    if (!l) return;
    setBuild(l.b); setThemeId(l.id); setHist(hist.slice(0, -1)); setSoonAsk(null);
  };
  // Everything the editor offers is editable. The parts it does not offer yet (sides color, firmware badge) stay as the theme
  // has them: only trying to edit them gets the SOON notice (see pickFp).
  const edit = (fn: (b: Fm1Build) => void) => {
    const b = cloneBuild(build); fn(b);
    snap(); setBuild(b); setThemeId(""); setSoonAsk(null); };
  // paints the selected part (what `target` points at) with a color, on the build it is given
  function paint(b: Fm1Build, id: string) {
    if (target.k === "fp") {
      if (target.part === "bezel") b.bezel = id;
      else if (target.part === "logo") b.logo = id;
      else if (target.part === "side") b.side = id;
      else {
        b[target.part] = id;
        if (target.part === "body" && !FM1_FEATURES.sides) b.side = null;
        // linked ("Accent + Bezel"): the bezel follows the new accent, even when the theme had a bezel color of its own
        if (target.part === "accent" && !split && b.bezel !== NO_BEZEL) b.bezel = null;
      }
    } else if (target.k === "group") {
      GROUPS[target.g].forEach((s) => { b.knobs[s][target.part] = id; });
    } else if (allKnobs) SLOTS.forEach((x) => { b.knobs[x][target.part] = id; });
    else b.knobs[target.slot][target.part] = id;
  }
  const setColor = (id: string) => { setPreview(null); edit((b) => paint(b, id)); };
  // "Affect all" only arms the mode: the NEXT model or color change goes to all 8 knobs (nothing is copied on check)
  const toggleAll = (on: boolean) => setAllKnobs(on && !!selKnob);
  const setVariant = (slot: Slot, patch: Partial<Pick<Knob, "style" | "height">>) => edit((b) => {
    const apply = (x: Slot) => {
      const k = { ...b.knobs[x], ...patch };
      if (!variantOk(k.style, k.height)) k.height = "short";
      b.knobs[x] = k;
    };
    if (allKnobs) SLOTS.forEach(apply); else apply(slot);
  });
  // the arrows over the knob picture: previous / next model for the selected knob (same as picking it, wraps around)
  const stepModel = (d: number) => {
    if (!selKnob) return;
    const k = build.knobs[selKnob];
    const i = Math.max(0, MODELS.findIndex((m) => m.st === k.style && m.h === k.height));
    const n = MODELS[(i + d + MODELS.length) % MODELS.length];
    setVariant(selKnob, { style: n.st, height: n.h });
  };

  const loadBuild = (b: Fm1Build, id: string) => { snap(); setSoonAsk(null); setForceSplit(false); setOrigin(saved.some((x) => x.id === id) ? id : null); setBuild(FIXED_THEMES.some((t) => t.id === id) ? { ...cloneBuild(b), mode } : norm({ ...cloneBuild(b), mode })); setThemeId(id); setSelKnob(null); scene.current?.focus(null); scene.current?.clearHighlight(); };
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
  const curId = target.k === "fp" ? (target.part === "bezel" ? bezelId(build) : target.part === "side" ? build.side ?? build.body : target.part === "logo" ? build.logo : build[target.part])
    : target.k === "group" ? groupVal(target.g, target.part)
    : build.knobs[target.slot][target.part];

  const sel = selKnob ? shown.knobs[selKnob] : null;
  const live = info.launched;
  const waitBlurb = `The FM1_Kz cases and knobs are almost here. Join the list and get ${SITE.waitlist.discountPercent}% off at launch, we will email you when the listing goes live.`;

  // an untouched theme carries parts the public editor does not offer (sides color, firmware badge): the note is only for that. Once the
  // buyer changes anything (themeId is cleared) the design is theirs and fully editable, so the note never comes back. The bezel color is editable.
  const hasExclusive = themeId !== "" && ((build.side !== null && !FM1_FEATURES.sides) || ((build.badge !== null || build.logo !== null) && !FM1_FEATURES.badge));

  // Faceplate / Accent + Bezel buttons. Only a chain between Accent and Bezel: linked it is whole and gray, on hover it turns red and
  // broken, a click cuts it. Cut it stays in the same place, broken and gray; on hover it turns red and whole, a click joins them again.
  const exclusiveNote = (
    <p className="border-l-2 border-accent pl-3 text-xs font-medium text-accent">
      This theme includes exclusive parts that are not open for customization yet. You can order it as it is; changing anything removes them.
    </p>
  );
  const renderFpButtons = () => {
    const on = (part: FpPartName) => target.k === "fp" && effPart(target.part) === part;
    const pick = (part: FpPartName) => { pickFp(part); openRadial(); };
    const dot = (id: string) => <span className="w-4 h-4 rounded-full border border-white/40" style={{ background: hex(id) }} />;
    const svg = (children: ReactNode) => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
    const chain = svg(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>);
    const broken = svg(<><path d="m18.84 12.25 1.72-1.71a5 5 0 0 0-.12-7.07 5 5 0 0 0-6.95 0l-1.72 1.71" /><path d="m5.17 11.75-1.71 1.71a5 5 0 0 0 .12 7.07 5 5 0 0 0 6.95 0l1.71-1.71" /><path d="M8 2v3M2 8h3M16 19v3M19 16h3" /></>);
    const base = "inline-flex items-center gap-2 px-2 sm:px-3 min-h-8 sm:min-h-9 text-[11px] sm:text-xs cursor-pointer";
    const border = (sel: boolean) => (sel ? "border-accent text-accent" : "border-border-light text-text-primary hover:border-accent");
    return (
      <>
        <button onClick={() => pick("body")} className={`${base} border ${border(on("body"))}`}>{dot(shown.body)}Faceplate</button>
        {!split ? (
          <div className={`inline-flex items-stretch border ${border(on("accent"))}`}>
            <button onClick={() => pick("accent")} className={`${base} pr-2`}>{dot(shown.accent)}Accent</button>
            <button onClick={() => setLink(false)} title="Unlink: give the bezel its own color" aria-label="Unlink bezel from accent"
              className="group/cut w-7 flex items-center justify-center text-text-muted hover:text-red-500 cursor-pointer">
              <span className="group-hover/cut:hidden">{chain}</span><span className="hidden group-hover/cut:block">{broken}</span>
            </button>
            <button onClick={() => pick("accent")} className={`${base} pl-2`}>Bezel</button>
          </div>
        ) : (
          <>
            <button onClick={() => pick("accent")} className={`${base} border ${border(on("accent"))}`}>{dot(shown.accent)}Accent</button>
            <button onClick={() => setLink(true)} title="Link: the bezel follows the accent again" aria-label="Link bezel to accent"
              className="group/cut w-7 min-h-9 flex items-center justify-center text-text-muted hover:text-red-500 cursor-pointer">
              <span className="group-hover/cut:hidden">{broken}</span>
              <span className="hidden group-hover/cut:block">{chain}</span>
            </button>
            <button onClick={() => pick("bezel")} className={`${base} border ${border(on("bezel"))}`}>{dot(bezelId(shown))}Bezel</button>
          </>
        )}
      </>
    );
  };

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
            thumb: <Fm1Thumb tr={isT} build={FIXED_THEMES.some((f) => f.id === t.id) ? { ...t.build, mode } : norm({ ...cloneBuild(t.build), mode })} hex={hex} factory={fac} />,
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

      {hasExclusive && mode !== "case" && (
        <p className="mb-4 -mt-2 border-l-2 border-accent pl-3 text-xs font-medium text-accent">
          This theme includes exclusive parts that are not open for customization yet. You can order it as it is; changing anything removes them.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* 3D */}
        <div className="sticky top-[73px] z-30 min-w-0 self-start bg-[#0d0d0c]/95 backdrop-blur pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:bg-transparent lg:backdrop-blur-none lg:top-[88px]">
          <div className="relative" data-keep-radial>
            <div ref={host} className="w-full h-[46vh] min-h-[280px] sm:h-auto sm:aspect-[4/3] sm:max-h-[32vh] lg:max-h-none rounded-xl overflow-hidden border border-border bg-[#1f2125]" />
            <span className="pointer-events-none absolute right-2 top-2 hidden sm:block mono text-[8px] leading-none tracking-wider text-white/45">LOW-POLY PREVIEW · NOT FINAL QUALITY</span>
            <div className="pointer-events-none absolute left-2 top-2 sm:left-3 sm:top-3 bg-black/60 px-2 py-1 sm:px-2.5 sm:py-1.5">
              <span className="ks block text-[11px] sm:text-xl leading-none text-white">{partLabel}</span>
            </div>
            {hist.length > 0 && !selKnob && (
              <button onClick={undo} title="Undo (Ctrl+Z)" className={`${radial ? "max-sm:hidden " : ""}absolute right-2 bottom-2 z-20 mono text-[10px] sm:text-[11px] px-2 sm:px-2.5 min-h-7 sm:min-h-8 border border-border-light bg-[#0d0d0c]/85 text-text-primary hover:border-accent hover:text-accent cursor-pointer`}>↶ UNDO</button>
            )}
            {soonAsk && (
              <div className="pointer-events-none absolute inset-x-0 top-3 z-40 flex justify-center px-3">
                <div key={soonAsk.text} className="pointer-events-auto max-w-xs border-2 border-accent bg-[#0d0d0c]/95 px-3 py-2 sm:px-4 sm:py-3 text-center" style={{ animation: "soonBox 1.4s steps(1, end) 1" }}>
                  <span className="mono text-[10px] text-accent tracking-wider">SOON</span>
                  <p className="mt-1 text-xs sm:text-sm text-text-primary">{soonAsk.text}</p>
                </div>
              </div>
            )}
            {/* your device color: a tab at the bottom center, click it and the choices slide up over the 3D view.
                The current color lives on the tab, the others are in the drawer; picking one swaps them and the drawer stays open.
                Clicking the tab or anywhere outside closes it. */}
            <div ref={facRef} className="pointer-events-none absolute inset-x-0 bottom-0 z-30 overflow-hidden">
              <div className="transition-transform duration-300 ease-out" style={{ transform: facOpen ? "translateY(0)" : "translateY(calc(100% - 32px))" }}>
                <div className="flex justify-center">
                  <button onClick={() => setFacOpen(!facOpen)} aria-label="Device color" aria-expanded={facOpen}
                    className="pointer-events-auto group relative h-7 min-w-[140px] sm:h-8 sm:min-w-[190px] px-7 sm:px-9 cursor-pointer">
                    <svg viewBox="0 0 190 32" preserveAspectRatio="none" className="absolute inset-0 w-full h-full text-border-light group-hover:text-accent transition-colors" aria-hidden="true">
                      <path d="M0 32 C16 32 18 1 34 1 L156 1 C172 1 174 32 190 32 Z" fill="rgba(13,13,12,0.45)" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                    </svg>
                    <span className="relative flex h-full items-center justify-center gap-2 pt-0.5 whitespace-nowrap">
                      <span className="w-5 h-5 rounded-[5px] border border-white/40" style={{ background: `linear-gradient(135deg, ${fac.body} 55%, ${fac.keys} 55%)` }} />
                      <span className="mono text-[10px] tracking-wider text-white/55 group-hover:text-white/80 transition-colors">DEVICE COLOR{kitUp && <span className="text-accent"> · BARE</span>}</span>
                    </span>
                  </button>
                </div>
                <div className="pointer-events-auto border-t border-border-light bg-[#0d0d0c]/45 backdrop-blur-[3px] px-3 py-3">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {mode === "case" && (
                      <button onClick={() => setKitUp(!kitUp)} aria-pressed={kitUp}
                        className={`inline-flex items-center gap-2 px-2 sm:px-3 min-h-9 text-[11px] sm:text-xs border cursor-pointer transition-colors ${kitUp ? "border-accent text-accent" : "border-border-light text-text-primary hover:border-accent"}`}>
                        {kitUp ? "Show faceplate" : "Hide faceplate"}
                      </button>
                    )}
                    {FACTORY_COLORS.filter((f) => f.id !== factory).map((f) => (
                      <button key={f.id} title={f.name} aria-label={f.name} onClick={() => setFactory(f.id)}
                        className="w-10 h-10 rounded-md border-2 border-border hover:border-accent cursor-pointer p-0.5 transition-colors">
                        <span className="block w-full h-full rounded-sm" style={{ background: `linear-gradient(135deg, ${f.body} 55%, ${f.keys} 55%)` }} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {radial && (
        <RadialColorMenu colors={target.k === "fp" ? colors.filter((c) => !c.knobsOnly) : colors} currentId={curId} title={targetLabel.replace(/^KNOBS? /, "").replace(" · ", " ")}
          onPick={(id) => setColor(id)} onPreview={setPreview} onClose={() => { setPreview(null); setRadial(false); }}>
          {mode === "case" && target.k === "fp" && target.part === "side" && build.side !== null && (
            <button onClick={() => edit((b) => { b.side = null; })} className="px-2 sm:px-3 min-h-7 sm:min-h-9 text-[11px] sm:text-xs border border-border-light text-text-primary cursor-pointer bg-[#0d0d0c]/90">Follow faceplate</button>
          )}
          {mode === "case" && target.k === "fp" && target.part === "logo" && build.logo !== null && (
            <button onClick={() => edit((b) => { b.logo = null; })} className="px-2 sm:px-3 min-h-7 sm:min-h-9 text-[11px] sm:text-xs border border-border-light text-text-primary cursor-pointer bg-[#0d0d0c]/90">Auto (black or white)</button>
          )}
          {mode === "case" && target.k === "fp" && (target.part === "accent" || target.part === "bezel") && (
            <button onClick={() => edit((b) => { b.bezel = b.bezel === NO_BEZEL ? null : NO_BEZEL; })} className="px-2 sm:px-3 min-h-7 sm:min-h-9 text-[11px] sm:text-xs border border-border-light text-text-primary cursor-pointer bg-[#0d0d0c]/90">
              {build.bezel === NO_BEZEL ? "Restore bezel" : "Delete bezel"}
            </button>
          )}
          {mode === "case" && target.k === "fp" && target.part === "bezel" && build.bezel !== null && build.bezel !== NO_BEZEL && (
            <button onClick={() => edit((b) => { b.bezel = null; })} className="px-2 sm:px-3 min-h-7 sm:min-h-9 text-[11px] sm:text-xs border border-border-light text-text-primary cursor-pointer bg-[#0d0d0c]/90">Follow labels</button>
          )}
          {target.k === "knob" && selKnob && (
            <>
              {(["body", "cap"] as const).map((part) => (
                <button key={part} onClick={() => setTarget({ k: "knob", slot: selKnob, part })}
                  className={`px-2 sm:px-3 min-h-7 sm:min-h-9 text-[11px] sm:text-xs border cursor-pointer bg-[#0d0d0c]/90 ${isTarget({ k: "knob", slot: selKnob, part }) ? "border-accent text-accent" : "border-border-light text-text-primary"}`}>
                  {part === "body" ? "Body" : "Cap"}
                </button>
              ))}
            </>
          )}
        </RadialColorMenu>
      )}
            {/* the selected knob: its picture (renders only, see public/renders/README.md), a rounded triangle on each side to change the model, and its name */}
            {sel && selKnob && (() => {
              const spec = KNOB_SPECS[`${sel.style}_${sel.height}`];
              // the base picture's plate is a diamond with its tips at 7% and 93% of the width, at 53% of the height:
              // the triangles sit inside it, near the left and right tips, pointing out like the plate itself
              const tri = "pointer-events-auto absolute w-7 h-7 sm:w-10 sm:h-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-accent hover:text-white active:scale-90 transition cursor-pointer drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]";
              const Tri = ({ dir }: { dir: "l" | "r" }) => (
                <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-6 sm:h-6" style={dir === "r" ? { transform: "scaleX(-1)" } : undefined} aria-hidden="true">
                  <path d="M17 5 L6 12 L17 19 Z" fill="currentColor" stroke="currentColor" strokeWidth="3.4" strokeLinejoin="round" />
                </svg>
              );
              return (
                <div className="pointer-events-none absolute left-2 bottom-2 w-[30%] sm:w-[42%] max-w-72">
                  <KnobRender style={sel.style} height={sel.height} slot={selKnob} body={hex(sel.body)} cap={hex(sel.cap)} bodyT={isT(sel.body)} capT={isT(sel.cap)} size={256} fluid />
                  <button onClick={() => stepModel(-1)} className={tri} style={{ left: "20%", top: "53%" }} aria-label="Previous knob model"><Tri dir="l" /></button>
                  <button onClick={() => stepModel(1)} className={tri} style={{ left: "80%", top: "53%" }} aria-label="Next knob model"><Tri dir="r" /></button>
                  <span className="absolute inset-x-0 bottom-[7%] flex justify-center"><span className="ks whitespace-nowrap bg-black/60 px-1 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-base leading-none text-white">{allKnobs && <span className="text-accent mr-1.5">ALL ·</span>}{spec?.name ?? `${sel.style} ${sel.height}`}</span></span>
                </div>
              );
            })()}
          </div>
          <div className="mt-2 space-y-2">
          {/* phone: the same two buttons, right under the 3D view instead of far below */}
          {mode === "case" && !selKnob && (
            <div className="lg:hidden flex flex-wrap items-center gap-2 text-xs" data-keep-radial>
              {renderFpButtons()}
              {hasExclusive && <div className="basis-full pt-1">{exclusiveNote}</div>}
            </div>
          )}
          {/* knob card */}
          {sel && selKnob && (
            <section className="border border-border bg-surface-card p-2 sm:p-3" data-keep-radial>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-2">
                <span className="text-sm font-semibold text-text-primary">Knob {SLOT_NAME[selKnob]}</span>
                {/* mode: every change goes to all 8 knobs (checking it copies this knob to the others first) */}
                <label className={`inline-flex items-center gap-2 px-2 sm:px-3 min-h-7 sm:min-h-9 text-[11px] sm:text-xs border cursor-pointer transition-colors ${allKnobs ? "border-accent text-accent" : "border-border text-text-muted hover:border-accent hover:text-accent"}`}>
                  <input type="checkbox" checked={allKnobs} onChange={(e) => toggleAll(e.target.checked)} className="w-4 h-4 accent-[#FF5A1F] cursor-pointer" />
                  Affect all
                </label>
                <div className="flex items-center gap-5">
                  <button onClick={undo} disabled={hist.length === 0} title="Undo (Ctrl+Z)" className="mono text-xs text-text-muted hover:text-accent cursor-pointer disabled:opacity-30 disabled:cursor-default disabled:hover:text-text-muted">↶ UNDO</button>
                  <button className="text-xs text-text-muted cursor-pointer" onClick={clearSel}>Done</button>
                </div>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
                <div className={`grid sm:block transition-[grid-template-rows] duration-300 ease-out ${specsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"} order-2 sm:order-1 basis-full sm:basis-auto sm:flex-1 min-w-0`}>
                  <div className="overflow-hidden min-h-0">
                  <KnobStats variant={`${sel.style}_${sel.height}`} />
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
                <div className="order-1 sm:order-2 flex flex-row sm:flex-col w-full sm:w-auto justify-center gap-2 text-xs" data-keep-radial>
                  {(["cap", "body"] as const).map((part) => {
                    const on = target.k === "knob" && target.slot === selKnob && target.part === part;
                    return (
                      <button key={part} onClick={() => { setTarget({ k: "knob", slot: selKnob, part }); openRadial(); }}
                        className={`inline-flex flex-1 sm:flex-none items-center justify-center sm:justify-start gap-2 px-2 sm:px-3 min-h-8 sm:min-h-9 border cursor-pointer ${on ? "border-accent text-accent" : "border-border-light text-text-primary hover:border-accent"}`}>
                        <span className="w-4 h-4 rounded-full border border-white/40" style={{ background: hex(sel[part]) }} />
                        {part === "body" ? "Body color" : "Cap color"}
                      </button>
                    );
                  })}
                  <button onClick={() => setSpecsOpen(!specsOpen)} aria-expanded={specsOpen}
                    className="sm:hidden px-2 min-h-8 border border-border-light text-[11px] text-text-muted hover:text-accent cursor-pointer">
                    Specs {specsOpen ? "▴" : "▾"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* bezel type: the basic ring, or the badge bezel with a strip for the firmware name */}
          {FM1_FEATURES.badge && mode === "case" && target.k === "fp" && (target.part === "bezel" || target.part === "logo") && (
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
          <section className="bg-surface-card border border-border p-2 w-3/5 mx-auto sm:w-1/2 lg:w-4/5 lg:mx-0 lg:mr-auto" data-keep-radial>
            <Fm1TopView
              build={shown}
              tr={isT}
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
                  setHover({ names: fpMats(effPart(part), build.side === null), fp: part });
                },
                onFaceplate: () => { pickFaceplate(); openRadial(); },
                onBezel: () => { pickFp("bezel"); openRadial(); },
                onLogo: () => { pickFp("logo"); openRadial(); },
                onGroup: (g, part) => { setSelKnob(null); setTarget({ k: "group", g, part }); openRadial(); },
              }}
            />
          </section>

          {/* the two color parts of the case as buttons (the accent is small and easy to miss), plus what is coming */}
          {mode === "case" && (
            <div className="hidden lg:flex lg:w-4/5 lg:mr-auto flex-wrap items-center gap-2 text-xs" data-keep-radial>
              {renderFpButtons()}
              {hasExclusive && <div className="basis-full pt-1">{exclusiveNote}</div>}
            </div>
          )}

        </div>
      </div>


      {/* phone and tablet: after the controls */}
      <div className="lg:hidden">{codePanel}</div>

      {import.meta.env.DEV && (
        <p className="text-[11px] text-center mt-3">
          <button className="mono text-accent underline cursor-pointer"
            onClick={() => { try { localStorage.setItem("fm1_public", FM1_PUBLIC_VIEW ? "0" : "1"); } catch { /* no storage */ } location.reload(); }}>
            STUDIO: {FM1_PUBLIC_VIEW ? "showing the PUBLIC view (click for all features)" : "all features ON (click to preview the public view)"}
          </button>
        </p>
      )}
      <p className="text-[11px] text-text-muted mt-3 text-center">FM1 Kustomizer v{FM1_VERSION} · build {typeof __BUILD__ !== "undefined" ? __BUILD__ : "restart server"}</p>
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
