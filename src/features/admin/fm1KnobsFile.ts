// Writes src/data/fm1Knobs.ts (the knob models added in the Studio). Used by the FM1 Knobs tab and by the
// Kustomizer's cap height slider (Studio only).
import type { Fm1KnobModel } from "@/data/fm1Knobs.ts";
import { studioWrite } from "./studioApi.ts";

const HEAD = `// Extra FM1_Kz knob models, added in the Store Studio (tab "FM1 Knobs"). The four original models (Classic Short,
// Chalice, Groove Short, Groove Long) are built into the code and the device model; these come on top of them.
//
// Each model is a PAIR from one GLB in public/models/knobs: the knob used on the 7 function slots and the volume
// knob (nodes knob_<style>_<height>_body and knob_vol_<style>_<height>_body, pivot at the base center, site scale).
// letter: the style letter in the order code. Never change or reuse one that shipped: old orders must still decode.
// capY / volCapY: where the shared cap sits, in mm from the body top (negative = sunk into the body).
// render: the 2D picture layers in public/renders (same camera as the other knob renders, see its README).
// stats: 0 to 5 for Grip, Precision, Big hands, 1-finger tweak, Hover tweak, Compact.
export interface Fm1KnobModel {
  style: string;
  height: "short" | "long";
  letter: string;
  name: string;
  glb: string;
  d: number;
  h: number;
  capY: number;
  volCapY: number;
  render?: { body?: string; volBody?: string; cap?: string; volCap?: string };
  stats?: number[];
}
`;

export function fm1KnobsTs(list: Fm1KnobModel[]): string {
  const rows = list.map((k) => `  ${JSON.stringify(k)},`);
  return `${HEAD}\nexport const EXTRA_KNOBS: Fm1KnobModel[] = [${rows.length ? `\n${rows.join("\n")}\n` : ""}];\n`;
}

export const saveFm1Knobs = (list: Fm1KnobModel[]) => studioWrite("fm1Knobs.ts", fm1KnobsTs(list));
