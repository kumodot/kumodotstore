import type { CaseModel } from "@/types/index.ts";

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
