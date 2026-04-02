import type { FilamentColor } from "@/types/index.ts";
import type { Product } from "@/types/index.ts";
import type { VariationConfig } from "@/types/index.ts";

export async function exportColorsTs(colors: FilamentColor[]): Promise<void> {
  const lines = colors.map((c) => {
    const [r, g, b] = c.rgb;
    const avail = c.available ? "true" : "false";
    return `  { id: "${c.id}", name: "${c.name}", rgb: [${r}, ${g}, ${b}], hex: "${c.hex}", available: ${avail} },`;
  });

  const content = `import type { FilamentColor } from "@/types/index.ts";

export const FILAMENT_COLORS: FilamentColor[] = [
${lines.join("\n")}
];

export const COLORS_BY_ID: Record<string, FilamentColor> = Object.fromEntries(
  FILAMENT_COLORS.map((c) => [c.id, c])
);
`;
  downloadFile("colors.ts", content);
}

export async function exportProductsTs(products: Product[]): Promise<void> {
  const lines = products.map((p) => {
    const fields: string[] = [];
    fields.push(`    id: ${JSON.stringify(p.id)}`);
    fields.push(`    slug: ${JSON.stringify(p.slug)}`);
    if (p.sortOrder !== undefined) fields.push(`    sortOrder: ${p.sortOrder}`);
    fields.push(`    name: ${JSON.stringify(p.name)}`);
    if (p.shortDescription) fields.push(`    shortDescription: ${JSON.stringify(p.shortDescription)}`);
    fields.push(`    price: ${p.price}`);
    fields.push(`    currency: ${JSON.stringify(p.currency)}`);
    if (p.categories?.length) fields.push(`    categories: ${JSON.stringify(p.categories)}`);
    if (p.images?.length) {
      const imgs = p.images.map((i) => `      ${JSON.stringify(i)}`).join(",\n");
      fields.push(`    images: [\n${imgs},\n    ]`);
    }
    if (p.etsyUrl) fields.push(`    etsyUrl: ${JSON.stringify(p.etsyUrl)}`);
    if (p.kustomizerModelId) fields.push(`    kustomizerModelId: ${JSON.stringify(p.kustomizerModelId)}`);
    if (p.variationConfigId) fields.push(`    variationConfigId: ${JSON.stringify(p.variationConfigId)}`);
    if (p.promotions?.length) {
      const badges = p.promotions.map((b) => `      { label: ${JSON.stringify(b.label)}, variant: ${JSON.stringify(b.variant)} }`).join(",\n");
      fields.push(`    promotions: [\n${badges},\n    ]`);
    }
    fields.push(`    inStock: ${p.inStock}`);
    if (p.listed === false) fields.push(`    listed: false`);
    if (p.soon) fields.push(`    soon: true`);
    return `  {\n${fields.join(",\n")},\n  }`;
  });

  const content = `import type { Product } from "@/types/index.ts";

export const PRODUCTS: Product[] = [
${lines.join(",\n")}
];
`;
  downloadFile("products.ts", content);
}

export async function exportVariationConfigsTs(configs: VariationConfig[]): Promise<void> {
  const lines = configs.map((c) => {
    const groups = c.groups.map((g) => {
      const options = g.options.map((o) => {
        const parts = [
          `id: ${JSON.stringify(o.id)}`,
          `label: ${JSON.stringify(o.label)}`,
          `priceDelta: ${o.priceDelta}`,
        ];
        if (o.imageUrl) parts.push(`imageUrl: ${JSON.stringify(o.imageUrl)}`);
        return `          { ${parts.join(", ")} }`;
      });
      return `      {\n        id: ${JSON.stringify(g.id)},\n        name: ${JSON.stringify(g.name)},\n        required: ${g.required},\n        options: [\n${options.join(",\n")},\n        ],\n      }`;
    });
    return `  {\n    id: ${JSON.stringify(c.id)},\n    name: ${JSON.stringify(c.name)},\n    groups: [\n${groups.join(",\n")},\n    ],\n  }`;
  });

  const content = `import type { VariationConfig } from "@/types/index.ts";

export const VARIATION_CONFIGS: VariationConfig[] = [
${lines.join(",\n")}
];

export const VARIATION_CONFIGS_BY_ID: Record<string, VariationConfig> = Object.fromEntries(
  VARIATION_CONFIGS.map((c) => [c.id, c])
);
`;
  downloadFile("variationConfigs.ts", content);
}

async function downloadFile(filename: string, content: string): Promise<void> {
  try {
    const handle = await (window as unknown as { showSaveFilePicker: (o: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: "TypeScript file", accept: { "text/plain": [".ts"] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;
    // fallback to download link
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
