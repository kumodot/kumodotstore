// Secret theme codes: a theme with a `lock` only shows for buyers who typed its unlock code in the Kustomizer.
// Only the SHA-256 of the code is published (src/data/fm1Themes.ts), so the code cannot be read from the site files.
// This is for fun (codes shared in videos and groups), not for security: anyone who has the code can unlock it.
const SALT = "kumodot-fm1-theme:";
const KEY = "kumodot_fm1_unlocked_v1";

/** Codes are case-insensitive and ignore spaces. */
export const normCode = (c: string) => c.trim().toUpperCase().replace(/\s+/g, "");

export async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(SALT + normCode(code));
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** What this browser has unlocked (kept between visits): "<theme id>:<lock hash>" entries, so changing a theme's
 *  code locks it again for everyone who used the old one. */
export const unlockKey = (id: string, lock: string) => `${id}:${lock}`;
export const isUnlocked = (list: string[], id: string, lock: string) => list.includes(unlockKey(id, lock));
/** Forget every unlocked theme in this browser. */
export function clearUnlocked() {
  try { localStorage.removeItem(KEY); } catch { /* no storage */ }
}
export function loadUnlocked(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[]; } catch { return []; }
}
export function storeUnlocked(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* no storage */ }
}
