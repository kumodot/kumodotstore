import { useSyncExternalStore } from "react";

// STUDIO ONLY (never in the production bundle): plays a scripted tour of the three Kustomizers with a fake
// cursor, so it can be screen-recorded for a reel. It clicks the real buttons, so what you see is the real UI.
// Press Esc to stop. The DEMO button hides itself while it plays and is not part of the recording.

type Pt = { x: number; y: number };
interface Fm1Hooks {
  scene: { screenOf(t: string): Pt; focus(t: string | null): void; demoOrbit(a: number, p: number, z: number, ms: number): Promise<void> } | null;
  slots: string[];
  pickKnob(s: string, part?: "body" | "cap"): void;
  pickFp(part: string): void;
  openRadial(): void;
  clearSel(): void;
}
const hooks = () => (window as unknown as { __fm1Demo?: Fm1Hooks }).__fm1Demo;

class Stop extends Error {}

// The state lives outside the component: switching product tabs remounts the page (and this component),
// and the tour must keep running and keep showing its cursor across that.
interface DemoState { running: boolean; cursor: Pt; pulse: { id: number; x: number; y: number } | null; fast: boolean }
let state: DemoState = { running: false, cursor: { x: -50, y: -50 }, pulse: null, fast: false };
const subs = new Set<() => void>();
const patch = (p: Partial<DemoState>) => { state = { ...state, ...p }; subs.forEach((f) => f()); };
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const stop = { current: false };
const pos = { current: { x: 80, y: 200 } as Pt };
const speed = { current: 1 };
const setCursor = (cursor: Pt) => patch({ cursor });
const setPulse = (pulse: DemoState["pulse"]) => patch({ pulse });
let t0 = 0;
/** prints the elapsed time at each beat, so the voice-over can be timed against a real run (console, F12) */
const mark = (name: string) => console.log(`[demo] ${((performance.now() - t0) / 1000).toFixed(1)}s  ${name}`);
const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") stop.current = true; };

export function DemoMode() {
  const { running, cursor, pulse, fast } = useSyncExternalStore(subscribe, () => state);
  const setRunning = (r: boolean) => patch({ running: r });
  const setFast = (f: boolean) => patch({ fast: f });

  const wait = async (ms: number) => {
    const end = performance.now() + ms / speed.current;
    while (performance.now() < end) {
      if (stop.current) throw new Stop();
      await new Promise((r) => setTimeout(r, 30));
    }
    if (stop.current) throw new Stop();
  };
  const visible = (e: HTMLElement) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const all = (sel: string, root: ParentNode = document) => [...root.querySelectorAll<HTMLElement>(sel)].filter(visible);
  const byText = (sel: string, re: RegExp) => all(sel).find((e) => re.test(e.textContent ?? ""));

  const moveTo = async (p: Pt, ms = 650) => {
    const d = Math.hypot(p.x - pos.current.x, p.y - pos.current.y);
    const dur = Math.max(250, Math.min(ms, d * 1.4));
    setCursor(p);
    pos.current = p;
    await wait(dur + 60);
  };
  const centerOf = (e: HTMLElement): Pt => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const toEl = async (e: HTMLElement) => {
    const r = e.getBoundingClientRect();
    if (r.top < 70 || r.bottom > window.innerHeight - 20) { e.scrollIntoView({ block: "center", behavior: "smooth" }); await wait(650); }
    await moveTo(centerOf(e));
  };
  const hover = async (e: HTMLElement) => {
    await toEl(e);
    for (const t of ["pointerover", "pointerenter", "mouseover"]) e.dispatchEvent(new PointerEvent(t, { bubbles: t !== "pointerenter", pointerType: "mouse" }));
  };
  const unhover = (e: HTMLElement) => { for (const t of ["pointerout", "pointerleave", "mouseout"]) e.dispatchEvent(new PointerEvent(t, { bubbles: t !== "pointerleave", pointerType: "mouse" })); };
  const click = async (e: HTMLElement, after = 700) => {
    await hover(e);
    await wait(180);
    setPulse({ id: Math.random(), ...pos.current });
    await wait(140);
    e.click();
    unhover(e);
    await wait(after);
  };
  const clickAt = async (p: Pt, fn: () => void, after = 800) => {
    await moveTo(p);
    await wait(180);
    setPulse({ id: Math.random(), ...p });
    await wait(140);
    fn();
    await wait(after);
  };

  // theme cards of the filmstrip, skipping the scroll arrows
  const themes = () => all('section[aria-label="PICK A THEME"] button[aria-pressed]');
  const swatches = () => all('[role="dialog"] button[aria-label]');
  const tabs = () => all('[role="tab"]');
  const sceneTop = async () => { window.scrollTo({ top: 0, behavior: "smooth" }); await wait(700); };

  const showCode = async (sel: string) => {
    const el = all(sel).at(0);
    if (!el) return;
    await toEl(el);
    const range = document.createRange();
    range.selectNodeContents(el);
    const s = window.getSelection();
    s?.removeAllRanges(); s?.addRange(range);
    await wait(1800);
    s?.removeAllRanges();
  };

  const pickSwatches = async (n: number) => {
    const list = swatches();
    const step = Math.max(1, Math.floor(list.length / (n + 1)));
    for (let i = 1; i <= n; i++) {
      const sw = list[(i * step) % list.length];
      if (!sw) continue;
      await hover(sw);
      await wait(350);   // the preview on hover
      await click(sw, 650);
    }
  };

  // the device-color tab over the 3D view: open it, try a couple of colors (it stays open), close it by tapping the tab
  const deviceColor = async (n: number) => {
    const tab = all('button[aria-label="Device color"]').at(0);
    if (!tab) return;
    await click(tab, 900);
    for (let i = 0; i < n; i++) {
      const drawer = tab.closest<HTMLElement>("div.overflow-hidden");
      const opts = drawer ? all("button[title]", drawer) : [];
      const o = opts[(i * 2 + 1) % Math.max(1, opts.length)];
      if (o) await click(o, 1100);
    }
    await click(tab, 800);
  };

  const orbit = async (a: number, p: number, z: number, ms: number) => { await hooks()?.scene?.demoOrbit(a, p, z, ms); };

  const knobTour = async (slot: string, colorsToo: boolean) => {
    const h = hooks();
    if (!h?.scene) return;
    h.scene.focus(null);
    await wait(700);
    await clickAt(h.scene.screenOf(slot), () => { h.pickKnob(slot); h.openRadial(); }, 1400);
    const next = all('button[aria-label="Next knob model"]').at(0);
    if (next) { await click(next, 900); await click(next, 900); }
    const prev = all('button[aria-label="Previous knob model"]').at(0);
    if (prev) await click(prev, 800);
    const cap = byText("button", /^\s*Cap color/);
    if (cap) { await click(cap, 700); await pickSwatches(2); }
    const body = byText("button", /^\s*Body color/);
    if (body) { await click(body, 700); await pickSwatches(2); }
    if (colorsToo) {
      const aff = all("label").find((l) => /Affect all/.test(l.textContent ?? ""));
      const box = aff?.querySelector<HTMLElement>("input");
      if (aff && box) {
        await click(aff, 700);
        const n2 = all('button[aria-label="Next knob model"]').at(0);
        if (n2) await click(n2, 1200);
        const cap2 = byText("button", /^\s*Cap color/);
        if (cap2) { await click(cap2, 700); await pickSwatches(1); }
        await wait(900);
        await click(aff, 500);
      }
    }
    const done = byText("button", /^\s*Done\s*$/);
    if (done) await click(done, 900);
  };

  const run = async () => {
    stop.current = false;
    speed.current = state.fast ? 1.8 : 1;
    window.addEventListener("keydown", onKey);
    t0 = performance.now();
    setRunning(true);
    try {
      await wait(1200);
      await sceneTop();
      pos.current = { x: window.innerWidth * 0.5, y: 140 };
      setCursor(pos.current);
      await wait(400);

      // 1. POKZ
      mark("POKZ: tab");
      const t = tabs();
      if (t[0]) await click(t[0], 1400);
      mark("POKZ: themes");
      for (const th of themes().slice(0, 3)) { await click(th, 1000); }
      mark("POKZ: pad colors");
      const pads = all("div.grid.w-fit button");
      if (pads.length) {
        for (const i of [2, 5, 9]) {
          const pad = pads[i % pads.length];
          await click(pad, 600);
          const fresh = [...document.body.children].at(-1);
          const opts = fresh ? all("button", fresh as HTMLElement) : [];
          const o = opts[(i * 3) % Math.max(1, opts.length)];
          if (o) await click(o, 800);
        }
      }
      mark("POKZ: code");
      await showCode("code");

      // 2. FM1 case
      mark("CASE: tab");
      await sceneTop();
      const t2 = tabs();
      if (t2[1]) await click(t2[1], 2500);
      for (const th of themes().slice(1, 4)) { await click(th, 1100); }
      mark("CASE: camera orbit");
      await orbit(1.4, -0.15, 0.85, 3200);
      await orbit(-2.6, 0.2, 0.55, 3600);
      const h = hooks();
      if (h?.scene) { h.scene.focus("faceplate"); await wait(900); await orbit(0.9, -0.2, 0.7, 2600); }
      mark("CASE: faceplate + accent colors");
      const fp = byText("button", /^\s*Faceplate/);
      if (fp) { await click(fp, 700); await pickSwatches(3); }
      const ac = byText("button", /^\s*Accent/);
      if (ac) { await click(ac, 700); await pickSwatches(2); }
      await sceneTop();
      mark("CASE: device color");
      await deviceColor(2);
      mark("CASE: knob tour");
      if (h?.slots[0]) await knobTour(h.slots[1] ?? h.slots[0], true);
      await sceneTop();
      mark("CASE: code");
      await showCode("code, input");

      // 3. FM1 knobs
      mark("KNOBS: tab");
      await sceneTop();
      const t3 = tabs();
      if (t3[2]) await click(t3[2], 2500);
      for (const th of themes().slice(0, 3)) { await click(th, 1100); }
      mark("KNOBS: knob tours");
      const h2 = hooks();
      if (h2?.slots) { await knobTour(h2.slots[0], true); await knobTour(h2.slots[3] ?? h2.slots[0], false); }
      await orbit(1.2, -0.1, 1, 2400);
      await wait(1500);
      mark("END");
    } catch (e) {
      if (!(e instanceof Stop)) console.error("[demo]", e);
    } finally {
      window.removeEventListener("keydown", onKey);
      hooks()?.clearSel();
      setRunning(false);
      setCursor({ x: -50, y: -50 });
    }
  };

  return (
    <>
      {!running && (
        <div className="fixed left-3 bottom-3 z-[9998] flex items-center gap-2 mono text-[11px]">
          <button onClick={() => void run()} className="px-3 py-2 border border-accent text-accent bg-[#0d0d0c]/90 cursor-pointer">▶ DEMO</button>
          <label className="text-text-muted cursor-pointer"><input type="checkbox" checked={fast} onChange={(e) => setFast(e.target.checked)} className="mr-1" />fast</label>
        </div>
      )}
      {running && (
        <div className="pointer-events-none fixed inset-0 z-[9999]">
          <svg width="28" height="28" viewBox="0 0 24 24" className="absolute"
            style={{ left: 0, top: 0, transform: `translate(${cursor.x - 4}px, ${cursor.y - 3}px)`, transition: "transform 650ms cubic-bezier(.45,.05,.25,1)", filter: "drop-shadow(0 2px 3px rgba(0,0,0,.6))" }}>
            <path d="M4 3 L4 19 L8.5 15 L11.5 21.5 L14 20.3 L11 14 L17 14 Z" fill="#fff" stroke="#0d0d0c" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
          {pulse && (
            <span key={pulse.id} className="absolute rounded-full border-2 border-accent"
              style={{ left: pulse.x - 18, top: pulse.y - 18, width: 36, height: 36, animation: "demoPulse 500ms ease-out 1 forwards" }} />
          )}
        </div>
      )}
    </>
  );
}
