import { useEffect, useRef } from "react";

// Brand backdrop, ported from kumodot.art (editorial JS, "Backdrop v6" values):
// interlocking Ks as a near-black texture inside a fixed glow, a soft light that
// sweeps across and catches "gloss" Ks, and a mouse LED trail on the K grid.
const BD = { gap: 10, scale: 0.42, seed: 7, cells: 16, thr: 0.28, con: 5.75, smooth: 0.2, vary: 0.75, dim: 0.05, drift: 0.35 };
const KU = "M0 0H10V40H20V30H30V20H40V10H50V0H60V80H50V60H40V50H30V40H20V50H10V80H0Z";
const KM = "M10 0V10H20V20H30V30H40V40H50V0H60V80H50V50H40V40H30V50H20V60H10V80H0V0Z";

export function Backdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bd = ref.current!;
    const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N = BD.cells, CW = 70 + BD.gap, CH = 80 + BD.gap, W = N * CW, H = N * CH;
    let seed = BD.seed * 7919 + 13;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const raw = Array.from({ length: N * N }, rnd);
    const at = (i: number, j: number) => raw[((j + N) % N) * N + ((i + N) % N)];
    const gloss: number[] = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const nb = (at(i + 1, j) + at(i - 1, j) + at(i, j + 1) + at(i, j - 1)) / 4;
      const v = at(i, j) * (1 - BD.smooth) + nb * BD.smooth;
      gloss.push(Math.max(0, Math.min(1, (v - BD.thr) * BD.con + 0.5)) * (1 - BD.vary + BD.vary * at(i + 3, j + 5)));
    }
    const tile = (alpha: (v: number) => number) => {
      let body = "";
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const a = alpha(gloss[j * N + i]);
        if (a > 0.01) body += `<path fill-opacity="${a.toFixed(2)}" transform="translate(${i * CW} ${j * CH})" d="${(i + j) % 2 ? KM : KU}"/>`;
      }
      return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">${body}</svg>`)}")`;
    };
    bd.style.setProperty("--bd-base-tile", tile((v) => 1 - BD.dim * v));
    bd.style.setProperty("--bd-gloss-tile", tile((v) => v));
    bd.style.setProperty("--bd-w", `${Math.round(W * BD.scale)}px`);
    bd.style.setProperty("--bd-h", `${Math.round(H * BD.scale)}px`);

    let ticking = false;
    const drift = () => {
      ticking = false;
      bd.style.setProperty("--bd-y", `${reduced() ? 0 : Math.round(-window.scrollY * BD.drift)}px`);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(drift); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    drift();

    // LED trail: mouse only, one K lights up and fades, cell by cell
    let onMove: ((e: PointerEvent) => void) | null = null;
    if (window.matchMedia("(pointer: fine)").matches) {
      const trail = bd.querySelector<HTMLElement>(".backdrop__trail")!;
      const cw = CW * BD.scale, ch = CH * BD.scale;
      const kmask = (d: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80"><path d="${d}"/></svg>`)}")`;
      trail.style.setProperty("--k-up", kmask(KU));
      trail.style.setProperty("--k-mir", kmask(KM));
      trail.style.setProperty("--k-w", `${(60 * BD.scale).toFixed(2)}px`);
      trail.style.setProperty("--k-h", `${(80 * BD.scale).toFixed(2)}px`);
      const leds = Array.from({ length: 28 }, () => {
        const d = document.createElement("span"); d.className = "backdrop__led"; trail.appendChild(d); return d;
      });
      let n = 0, lastCell = "";
      onMove = (e) => {
        if (e.pointerType !== "mouse" || reduced()) return;
        const y0 = parseFloat(bd.style.getPropertyValue("--bd-y")) || 0;
        const i = Math.floor(e.clientX / cw), j = Math.floor((e.clientY - y0) / ch);
        const fx = e.clientX - i * cw, fy = e.clientY - y0 - j * ch;
        if (fx > 60 * BD.scale || fy > 80 * BD.scale) return;
        const key = `${i},${j}`;
        if (key === lastCell) return;
        lastCell = key;
        const led = leds[n++ % leds.length];
        led.classList.toggle("is-mir", (((i + j) % 2) + 2) % 2 === 1);
        led.style.transform = `translate(${(i * cw).toFixed(2)}px, calc(${(j * ch).toFixed(2)}px + var(--bd-y, 0px)))`;
        led.classList.remove("is-on"); void led.offsetWidth; led.classList.add("is-on");
      };
      window.addEventListener("pointermove", onMove, { passive: true });
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (onMove) window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={ref} className="backdrop" aria-hidden="true">
      <div className="backdrop__k" />
      <div className="backdrop__gl"><div className="backdrop__spot" /></div>
      <div className="backdrop__trail" />
    </div>
  );
}
