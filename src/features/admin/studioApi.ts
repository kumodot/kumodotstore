// Client side of the Store Studio (see tools/studioPlugin.ts). Only exists while the local dev server runs.
let tokenPromise: Promise<string | null> | null = null;

function token(): Promise<string | null> {
  tokenPromise ??= fetch("/__studio/session")
    .then((r) => (r.ok ? r.json().then((j: { token: string }) => j.token) : null))
    .catch(() => null);
  return tokenPromise;
}

async function call<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T | null> {
  const t = await token();
  if (!t) return null;
  const r = await fetch(`/__studio${path}`, {
    method,
    headers: { "x-studio-token": t, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.ok ? ((await r.json()) as T) : null;
}

/** True when the Studio server is there (local dev server). */
export const studioAvailable = async () => (await token()) !== null;

/** Save a data file straight into src/data. Returns false if the Studio server is not available. */
export async function studioWrite(file: string, content: string): Promise<boolean> {
  const r = await call<{ ok: boolean }>("/write", "POST", { file, content });
  if (r?.ok) window.dispatchEvent(new CustomEvent("studio:saved", { detail: { file } }));
  return !!r?.ok;
}

export interface StudioStatus { branch: string; changed: string[]; otherChanges: number; last: string }
export const studioStatus = () => call<StudioStatus>("/status", "GET");

export interface PublishResult { ok: boolean; nothing?: boolean; steps: { name: string; ok: boolean; out: string }[] }
export const studioPublish = () => call<PublishResult>("/publish", "POST", {});
export const studioDiscard = () => call<{ ok: boolean }>("/discard", "POST", {});

/** Save an uploaded file under public/ (only models/knobs/*.glb, renders/*.webp|png and renders/manifest.json). */
export async function studioAsset(file: string, data: ArrayBuffer): Promise<boolean> {
  const bytes = new Uint8Array(data);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const r = await call<{ ok: boolean }>("/asset", "POST", { file, base64: btoa(bin) });
  return !!r?.ok;
}
