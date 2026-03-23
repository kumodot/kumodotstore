import type { FilamentColor } from "@/types/index.ts";
import type { Product } from "@/types/index.ts";

export function exportColorsTs(colors: FilamentColor[]): void {
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

export function exportProductsTs(products: Product[]): void {
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
    if (p.promotion) fields.push(`    promotion: { label: ${JSON.stringify(p.promotion.label)}, variant: ${JSON.stringify(p.promotion.variant)} }`);
    fields.push(`    inStock: ${p.inStock}`);
    return `  {\n${fields.join(",\n")},\n  }`;
  });

  const content = `import type { Product } from "@/types/index.ts";

export const PRODUCTS: Product[] = [
${lines.join(",\n")}
];
`;
  downloadFile("products.ts", content);
}

function downloadFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
