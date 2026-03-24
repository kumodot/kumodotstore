import type { VariationConfig } from "@/types/index.ts";

export const VARIATION_CONFIGS: VariationConfig[] = [
  {
    id: "op1-stands",
    name: "OP-1 Stands",
    groups: [
      {
        id: "angle",
        name: "Angle",
        required: true,
        options: [
          { id: "25deg", label: "25°", priceDelta: 0 },
          { id: "40deg", label: "40°", priceDelta: 0 },
          { id: "combo", label: "Combo (25° + 40°)", priceDelta: 18 },
        ],
      },
      {
        id: "color",
        name: "Color",
        required: true,
        options: [
          { id: "olive", label: "Olive Green", priceDelta: 0 },
          { id: "gray", label: "Gray", priceDelta: 0 },
        ],
      },
    ],
  }
];

export const VARIATION_CONFIGS_BY_ID: Record<string, VariationConfig> = Object.fromEntries(
  VARIATION_CONFIGS.map((c) => [c.id, c])
);
