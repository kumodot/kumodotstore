import { useState } from "react";
import { colorsStore } from "@/data/colorsStore.ts";
import { fm1PartsList } from "@/features/fm1/fm1Parts.ts";

/** Paste an FM1_Kz order code (from the Etsy personalization box): get the list of parts to pick for packing. */
export function OrderDecoderAdmin() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  let lines: string[] = [], error = "";
  if (code.trim()) {
    try { lines = fm1PartsList(code, colorsStore.getColors()); } catch (e) { error = (e as Error).message; }
  }
  const text = lines.join("\n");
  return (
    <div className="max-w-3xl">
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
        <div className="mt-3 border border-border bg-surface-card p-4">
          <pre className="text-sm text-text-primary whitespace-pre-wrap font-mono leading-relaxed">{text}</pre>
          <button
            onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); } catch { /* blocked */ } }}
            className="mt-3 text-sm px-4 py-2 bg-accent text-[#0D0D0C] font-medium hover:bg-accent-hover transition-colors cursor-pointer">
            {copied ? "Copied ✓" : "Copy the list"}
          </button>
        </div>
      )}
    </div>
  );
}
