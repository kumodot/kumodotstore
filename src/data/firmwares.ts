// Firmware badges for the FM1_Kz bezel.
//
// Each firmware has ONE bezel it needs (`bezel`): the buyer picks a firmware and gets that bezel, so a firmware can
// never end up on a bezel it does not fit. Bezel types: "ext" (extended bezel with a strip, shared by most badges),
// "jiant" (exclusive to JIANT). `logo` is the SVG in public/logos (one color, transparent, tinted in the Kustomizer);
// null = no logo (the BLANK strip). `scale` makes that logo bigger or smaller than the default fit (1 = fits the strip). `code` goes into the order code, two letters, never change one that shipped.
export type BezelType = "ext" | "jiant";

export const FIRMWARE_LIST = [
  { id: "sloop", code: "SL", name: "SLOOP", logo: "logo_sloop.svg", bezel: "ext", scale: 1.08 },
  { id: "jiant", code: "JI", name: "JIANT", logo: "logo_jiant.svg", bezel: "jiant", scale: 1.35 },
  { id: "shrub", code: "SH", name: "SHRUB", logo: "logo_shrub.svg", bezel: "ext", scale: 0.8 },
  { id: "baudgirl", code: "BG", name: "BaudGirl", logo: "logo_baudgirl.svg", bezel: "ext", scale: 1 },
  { id: "blank", code: "BL", name: "BLANK", logo: null, bezel: "ext", scale: 1 },
] as const satisfies readonly { id: string; code: string; name: string; logo: string | null; bezel: BezelType; scale: number }[];

export type FirmwareId = (typeof FIRMWARE_LIST)[number]["id"];
export const firmwareById = (id: string) => FIRMWARE_LIST.find((f) => f.id === id);
