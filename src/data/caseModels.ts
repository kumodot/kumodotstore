import type { CaseModel } from "@/types/index.ts";

// One entry while every kustomizable case shares the same 4x4 grid, the same
// buttons and the same templates: POKZ-01 and POKZ-02 would be identical rows,
// and a dropdown that changes nothing on screen only makes buyers wonder
// whether they picked right. `description` is shown on the page, so it stays
// model-free — the buyer of either case has to recognise it as theirs.
//
// Add a second entry when a case actually differs on screen (the faceplate
// colour preview is the planned one). The dropdown and ?model= are already
// wired: KustomizerPage shows the picker as soon as this array has two.
// Themed cases (KOII) are deliberately absent — nothing to customize.
export const CASE_MODELS: CaseModel[] = [
  {
    id: "pokz-02",
    name: "POKZ-02",
    description: "Protective case for Teenage Engineering Pocket Operator",
    gridCols: 4,
    gridRows: 4,
    buttonCount: 16,
    groupSize: 4,
    defaultColorId: "WH",
    etsyUrl: "https://www.etsy.com/shop/kumodot",
  },
];

export const MODELS_BY_ID: Record<string, CaseModel> = Object.fromEntries(
  CASE_MODELS.map((m) => [m.id, m])
);

export const DEFAULT_MODEL_ID = "pokz-02";
