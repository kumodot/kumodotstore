// What the FM1_Kz Kustomizer offers. Turned off = hidden in the interface and fixed in the order code (the code format
// keeps its fields, so codes made while a feature was on still decode, and turning it back on is one line).
//   sides: color of the faceplate sides (off = the sides follow the faceplate).
//   badge: the firmware badge bezel with its logo (off = only the simple bezel, which takes the accent color).
// The PUBLIC site has both off. In the local Studio (dev server) both are ON, so firmware themes can be designed and
// their codes pasted into the FM1 Themes tab. To check the public look while in dev: localStorage.fm1_public = "1".
let publicView = !import.meta.env.DEV;
try { if (import.meta.env.DEV && localStorage.getItem("fm1_public") === "1") publicView = true; } catch { /* no storage */ }

export const FM1_PUBLIC_VIEW = publicView;
export const FM1_FEATURES = publicView ? { sides: false, badge: false } : { sides: true, badge: true };
