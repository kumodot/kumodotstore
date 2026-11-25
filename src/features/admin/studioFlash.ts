// A message that survives the page reload the dev server does after the Studio writes a file
// (saving a data file or a picture reloads the page, which used to wipe the "saved" message before it could be read).
const KEY = "studio_flash";
export function setFlash(msg: string) { try { sessionStorage.setItem(KEY, JSON.stringify({ msg, t: Date.now() })); } catch { /* no storage */ } }
/** The message saved in the last 20 seconds, if any (read once). */
export function takeFlash(): string {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return "";
    const { msg, t } = JSON.parse(raw) as { msg: string; t: number };
    return Date.now() - t < 20000 ? msg : "";
  } catch { return ""; }
}
