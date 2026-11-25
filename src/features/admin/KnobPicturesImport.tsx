import { useEffect, useRef, useState } from "react";
import { studioAsset } from "./studioApi.ts";
import { EXTRA_KNOBS } from "@/data/fm1Knobs.ts";
import { setFlash, takeFlash } from "./studioFlash.ts";

// Import the knob pictures (the 2D knob card) from a folder of renders: every file is recognized by its name,
// scaled to 512 px webp and saved in public/renders, and manifest.json is updated. Names:
//   base.png                                   the faceplate with its hole (only if it changes)
//   <model>_body.png   <model>_cap.png          the 7 plain knobs of a model
//   vol_<model>_body.png   vol_<model>_cap.png  the volume knob of that model
// <model> = classic_short, chalice_long (= classic_long), groove_short, groove_long, or an added one (tower_long ...).
const RE = /^(vol_)?([a-z]+)_(short|long)_(body|cap)\.(png|webp)$/i;
const SIZE = 512;

interface Item { file: File; key: string; part: "body" | "cap" | "base"; out: string; label: string }

function recognize(f: File): Item | null {
  const n = f.name.toLowerCase();
  if (/^(all_)?bases?\.(png|webp)$/.test(n) || /^(all_knobs_)?base\.(png|webp)$/.test(n)) return { file: f, key: "", part: "base", out: "knob_base.webp", label: "base" };
  const m = RE.exec(n);
  if (!m) return null;
  const vol = !!m[1], style = m[2] === "chalice" ? "classic" : m[2], height = m[3], part = m[4] as "body" | "cap";
  const key = `${vol ? "vol_" : ""}${style}_${height}`;
  return { file: f, key, part, out: `knob_${key}_${part}.webp`, label: `${key} ${part}` };
}

async function toWebp(f: File): Promise<ArrayBuffer> {
  const bmp = await createImageBitmap(f);
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const x = c.getContext("2d")!;
  x.imageSmoothingQuality = "high";
  x.drawImage(bmp, 0, 0, SIZE, SIZE);
  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/webp", 0.92));
  if (!blob) throw new Error("webp encoding failed");
  return blob.arrayBuffer();
}

/** The picture as the knob card will stack it: base, body, cap (untinted), to check the layers line up. */
function PicPreview({ label, body, cap }: { label: string; body?: File; cap?: File }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let dead = false;
    const urls: string[] = [];
    const img = (src: string) => new Promise<HTMLImageElement | null>((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
    const file = (f?: File) => { if (!f) return Promise.resolve(null); const u = URL.createObjectURL(f); urls.push(u); return img(u); };
    void (async () => {
      let base: HTMLImageElement | null = null;
      try {
        const m = await (await fetch(`${import.meta.env.BASE_URL}renders/manifest.json`, { cache: "no-store" })).json() as { base?: string };
        if (m.base) base = await img(`${import.meta.env.BASE_URL}renders/${m.base}`);
      } catch { /* no base */ }
      const [b, c] = await Promise.all([file(body), file(cap)]);
      const cv = ref.current; if (dead || !cv) return;
      const x = cv.getContext("2d")!;
      x.clearRect(0, 0, cv.width, cv.height);
      for (const i of [base, b, c]) if (i) x.drawImage(i, 0, 0, cv.width, cv.height);
    })();
    return () => { dead = true; urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [body, cap]);
  return (
    <div className="inline-flex flex-col items-center border border-border bg-[#050505]">
      <canvas ref={ref} width={160} height={160} />
      <span className="mono text-[10px] pb-1">{label}{!body ? " · no body" : ""}{!cap ? " · no cap" : ""}</span>
    </div>
  );
}

export function KnobPicturesImport() {
  const [items, setItems] = useState<Item[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [done, setDone] = useState(takeFlash);

  const BUILT = ["classic_short", "classic_long", "groove_short", "groove_long"];
  const known = new Set([...BUILT, ...EXTRA_KNOBS.map((k) => `${k.style}_${k.height}`)]);
  const unknown = [...new Set(items.filter((it) => it.part !== "base").map((it) => it.key.replace(/^vol_/, "")).filter((k) => !known.has(k)))];
  const take = (files: FileList | File[] | null) => {
    if (!files) return;
    const ok: Item[] = [], bad: string[] = [];
    for (const f of Array.from(files)) { const it = recognize(f); if (it) ok.push(it); else bad.push(f.name); }
    ok.sort((a, b) => a.label.localeCompare(b.label));
    setItems(ok); setSkipped(bad); setDone("");
  };

  const run = async () => {
    const stamp = Date.now().toString(36);   // new address for each import, so browsers never show an old cached picture
    let manifest: { base?: string; caps?: Record<string, string>; knobs?: Record<string, { body?: string; cap?: string; inner?: string }> } = {};
    try { manifest = await (await fetch(`${import.meta.env.BASE_URL}renders/manifest.json`, { cache: "no-store" })).json(); } catch { /* new */ }
    manifest.knobs ??= {};
    let n = 0;
    for (const it of items) {
      setBusy(`${++n} / ${items.length}: ${it.label}`);
      if (!(await studioAsset(`renders/${it.out}`, await toWebp(it.file)))) { setBusy(""); setDone("Could not save: is the Studio server running (restarted after the update)?"); return; }
      const ref = `${it.out}?v=${stamp}`;
      if (it.part === "base") manifest.base = ref;
      else manifest.knobs[it.key] = { ...manifest.knobs[it.key], [it.part]: ref };
    }
    const json = new TextEncoder().encode(JSON.stringify(manifest, null, 2) + "\n");
    await studioAsset("renders/manifest.json", json.buffer as ArrayBuffer);
    setBusy("");
    const msg = `✓ ${items.length} pictures imported (${[...new Set(items.map((it) => it.key.replace(/^vol_/, "")))].join(", ")}). Reload the Kustomizer to see them, then Publish.`;
    setFlash(msg);
    setDone(msg);
    setItems([]);
  };

  return (
    <section className="border border-border bg-surface-card p-4 space-y-3">
      <h4 className="mono">2. KNOB PICTURES (2D CARD)</h4>
      <p className="text-xs text-text-secondary">
        Select every render at once (PNG 1024, transparent, same camera as the base). Names: <code>groove_long_body.png</code>,{" "}
        <code>groove_long_cap.png</code>, <code>vol_groove_long_body.png</code>, <code>vol_groove_long_cap.png</code> ...;
        <code> chalice_long</code> is the Chalice; <code>base.png</code> only if the base changes. A picture you do not send keeps the old one.
      </p>
      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files); }}
        className="border border-dashed border-border-light p-4 text-center text-sm text-text-muted">
        Drop the files here, or <label className="text-accent underline cursor-pointer">pick them
          <input type="file" multiple accept=".png,.webp" className="hidden" onChange={(e) => take(e.target.files)} /></label>
      </div>
      {items.length > 0 && (
        <>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5 text-xs">
            {items.map((it) => <li key={it.out}><span className="text-accent">{it.label}</span> <span className="text-text-muted">{it.file.name}</span></li>)}
          </ul>
          {unknown.length > 0 && (
            <p className="text-xs text-text-secondary">
              Pictures for {unknown.join(", ")}, which is not saved as a model yet. That is fine: import them now, and they show
              as soon as its model is saved in step 1.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            {[...new Set(items.filter((it) => it.part !== "base").map((it) => it.key))].map((key) => (
              <PicPreview key={key} label={key} body={items.find((it) => it.key === key && it.part === "body")?.file}
                cap={items.find((it) => it.key === key && it.part === "cap")?.file} />
            ))}
          </div>
          <button onClick={() => void run()} disabled={!!busy}
            className="text-sm px-4 py-2 bg-accent text-[#0D0D0C] font-medium hover:bg-accent-hover cursor-pointer disabled:opacity-40">
            {busy || `Import ${items.length} pictures`}
          </button>
        </>
      )}
      {skipped.length > 0 && <p className="text-xs text-amber-400">Not recognized (skipped): {skipped.join(", ")}</p>}
      {done && <p className="text-sm text-green-400">{done}</p>}
    </section>
  );
}
