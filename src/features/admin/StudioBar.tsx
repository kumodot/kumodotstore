import { useCallback, useEffect, useState } from "react";
import {
  studioAvailable, studioDiscard, studioPublish, studioStatus,
  type PublishResult, type StudioStatus,
} from "./studioApi.ts";

const PREVIEWS = [
  ["Home", "#/"],
  ["FM1 Case", "#/kustomize?kit=fm1-kz-case"],
  ["FM1 Knobs", "#/kustomize?kit=fm1-kz-knobs"],
  ["Pocket Operator", "#/kustomize"],
] as const;

/** The control strip of the Store Studio: what changed, preview, publish. */
export function StudioBar() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [status, setStatus] = useState<StudioStatus | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState<"publish" | "discard" | null>(null);
  const [confirm, setConfirm] = useState<"publish" | "discard" | null>(null);
  const [result, setResult] = useState<PublishResult | null>(null);

  const refresh = useCallback(async () => {
    const ok = await studioAvailable();
    setAvailable(ok);
    if (ok) setStatus(await studioStatus());
  }, []);

  useEffect(() => {
    void refresh();
    const onSaved = (e: Event) => {
      setSaved((e as CustomEvent<{ file: string }>).detail.file);
      setResult(null);
      void refresh();
    };
    window.addEventListener("studio:saved", onSaved);
    return () => window.removeEventListener("studio:saved", onSaved);
  }, [refresh]);

  const changed = status?.changed.length ?? 0;

  return (
    <div className="mb-6 border border-border-light bg-surface-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="ks text-2xl text-text-primary">STORE STUDIO</h2>
        <div className="flex flex-wrap gap-2">
          {PREVIEWS.map(([label, hash]) => (
            <a key={label} href={`${window.location.origin}/${hash}`} target="_blank" rel="noopener noreferrer"
              className="mono px-3 py-2 border border-border-light text-text-primary hover:border-accent hover:text-accent transition-colors">
              Preview: {label} ↗
            </a>
          ))}
        </div>
      </div>

      {available === false && (
        <p className="text-sm text-red-400">The Studio server is not running. Close this window and start Store_Studio.bat.</p>
      )}

      {available && (
        <>
          <ol className="text-sm text-text-secondary space-y-1 list-decimal list-inside mb-3">
            <li>Change things in the tabs below and press <b>Export</b>: it saves straight into the store files.</li>
            <li>Use the <b>Preview</b> buttons to see the store with your changes (this is your computer, nobody else sees it).</li>
            <li>When it looks right, press <b>Publish</b>. The live site updates in about 90 seconds.</li>
          </ol>

          <div className="flex flex-wrap items-center gap-3">
            <span className="mono text-text-primary">
              {changed === 0 ? "NOTHING TO PUBLISH" : `${changed} FILE${changed > 1 ? "S" : ""} CHANGED, NOT PUBLISHED`}
            </span>
            {saved && <span className="mono text-accent">SAVED {saved.toUpperCase()}</span>}
            {status && <span className="mono text-text-muted">branch {status.branch} · last: {status.last}</span>}
          </div>

          {changed > 0 && (
            <p className="mono text-text-muted mt-1">{status?.changed.join(" · ")}</p>
          )}
          {(status?.otherChanges ?? 0) > 0 && (
            <p className="text-xs text-text-muted mt-1">
              {status?.otherChanges} other file(s) were changed outside the Studio (code). Publish does not include them.
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {confirm === "publish" ? (
              <>
                <span className="text-sm text-text-primary self-center">Publish {changed} file(s) to the live store?</span>
                <button
                  disabled={busy !== null}
                  onClick={async () => { setConfirm(null); setBusy("publish"); setResult(await studioPublish()); setBusy(null); setSaved(null); void refresh(); }}
                  className="btn-brand px-4 min-h-10 bg-text-primary text-[#0D0D0C] font-mono text-xs uppercase tracking-[.06em] cursor-pointer">
                  Yes, publish
                </button>
                <button onClick={() => setConfirm(null)} className="px-4 min-h-10 border border-border-light text-text-muted cursor-pointer">Cancel</button>
              </>
            ) : confirm === "discard" ? (
              <>
                <span className="text-sm text-text-primary self-center">Throw away the unpublished changes?</span>
                <button
                  disabled={busy !== null}
                  onClick={async () => { setConfirm(null); setBusy("discard"); await studioDiscard(); setBusy(null); setSaved(null); void refresh(); window.location.reload(); }}
                  className="px-4 min-h-10 bg-red-500/20 text-red-400 cursor-pointer">
                  Yes, discard
                </button>
                <button onClick={() => setConfirm(null)} className="px-4 min-h-10 border border-border-light text-text-muted cursor-pointer">Cancel</button>
              </>
            ) : (
              <>
                <button
                  disabled={changed === 0 || busy !== null}
                  onClick={() => setConfirm("publish")}
                  className="btn-brand px-5 min-h-11 bg-accent text-[#0D0D0C] font-mono text-xs uppercase tracking-[.06em] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  {busy === "publish" ? "Publishing…" : "Publish to live site"}
                </button>
                <button
                  disabled={changed === 0 || busy !== null}
                  onClick={() => setConfirm("discard")}
                  className="px-4 min-h-11 border border-border-light text-text-muted hover:text-text-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  Discard unpublished changes
                </button>
              </>
            )}
          </div>

          {result && (
            <div className={`mt-3 p-3 text-sm border ${result.ok ? "border-green-500/40 text-green-400" : "border-red-500/40 text-red-400"}`}>
              {result.ok
                ? result.nothing ? "Nothing to publish." : "Published. The live site updates in about 90 seconds."
                : <>Publish stopped at <b>{result.steps.find((s) => !s.ok)?.name}</b>. Nothing went live.
                    <pre className="whitespace-pre-wrap text-xs mt-2 text-text-secondary">{result.steps.find((s) => !s.ok)?.out}</pre></>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
