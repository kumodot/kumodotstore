import type { FilamentColor } from "@/types/index.ts";
import type { Product } from "@/types/index.ts";
import type { VariationConfig } from "@/types/index.ts";
import type { ColorTemplate } from "@/types/index.ts";
import type { ShippingRegion } from "@/data/shipping.ts";

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

export async function exportTemplatesTs(templatesByModel: Record<string, ColorTemplate[]>): Promise<void> {
  const modelBlocks = Object.entries(templatesByModel).map(([modelId, templates]) => {
    const lines = templates.map(
      (t) => `    { name: ${JSON.stringify(t.name)}, code: ${JSON.stringify(t.code)} },`
    );
    return `  ${JSON.stringify(modelId)}: [\n${lines.join("\n")}\n  ]`;
  });

  const content = `import type { ColorTemplate } from "@/types/index.ts";\n\nexport const TEMPLATES: Record<string, ColorTemplate[]> = {\n${modelBlocks.join(",\n")},\n};\n`;
  downloadFile("templates.ts", content);
}

export async function exportShippingTs(regions: ShippingRegion[]): Promise<void> {
  const lines = regions.map((r) => {
    const countries = JSON.stringify(r.countries);
    const extras: string[] = [];
    if (r.enabled === false) extras.push(`    enabled: false`);
    if (r.disabledMessage) extras.push(`    disabledMessage: ${JSON.stringify(r.disabledMessage)}`);
    if (r.requirements?.length) extras.push(`    requirements: ${JSON.stringify(r.requirements)}`);
    return `  {\n    id: ${JSON.stringify(r.id)},\n    name: ${JSON.stringify(r.name)},\n    countries: ${countries},\n    rate: ${r.rate},\n    currency: ${JSON.stringify(r.currency)},\n    etsyRedirect: ${r.etsyRedirect},\n    freeShipping: ${r.freeShipping},${extras.length ? "\n" + extras.join(",\n") + "," : ""}\n  }`;
  });

  const content = `export interface ShippingRegion {
  id: string;
  name: string;
  countries: string[];
  rate: number;
  currency: string;
  etsyRedirect: boolean;
  freeShipping: boolean;
  enabled?: boolean;
  disabledMessage?: string;
  requirements?: string[];
}

export const SHIPPING_REGIONS: ShippingRegion[] = [
${lines.join(",\n")},
];

export function getRegionForCountry(countryCode: string): ShippingRegion {
  const match = SHIPPING_REGIONS.find((r) => r.countries.includes(countryCode));
  return match ?? SHIPPING_REGIONS[SHIPPING_REGIONS.length - 1];
}

// Master ISO country name map — used by admin and checkout dropdown
export const ISO_COUNTRY_NAMES: Record<string, string> = {
  AE: "United Arab Emirates", AT: "Austria", AU: "Australia", BE: "Belgium",
  BG: "Bulgaria", BR: "Brazil", CA: "Canada", CH: "Switzerland", CY: "Cyprus",
  CZ: "Czech Republic", DE: "Germany", DK: "Denmark", EE: "Estonia",
  ES: "Spain", FI: "Finland", FR: "France", GB: "United Kingdom", GR: "Greece",
  HK: "Hong Kong", HR: "Croatia", HU: "Hungary", IE: "Ireland", IL: "Israel",
  IS: "Iceland", IT: "Italy", JP: "Japan", KR: "South Korea", LI: "Liechtenstein",
  LT: "Lithuania", LU: "Luxembourg", LV: "Latvia", MT: "Malta", MX: "Mexico",
  NF: "Norfolk Island", NL: "Netherlands", NO: "Norway", NZ: "New Zealand",
  PL: "Poland", PT: "Portugal", RO: "Romania", SE: "Sweden", SG: "Singapore",
  SI: "Slovenia", SK: "Slovakia", TW: "Taiwan", US: "United States", ZA: "South Africa",
};

// Returns sorted list of countries available for checkout based on regions
export function getCheckoutCountries(): { code: string; name: string }[] {
  const codes = new Set<string>();
  for (const region of SHIPPING_REGIONS) {
    for (const c of region.countries) {
      if (c !== "*") codes.add(c);
    }
  }
  return Array.from(codes)
    .map((code) => ({ code, name: ISO_COUNTRY_NAMES[code] ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface CheckoutCountry {
  code: string;
  name: string;
  enabled: boolean;
  disabledMessage?: string;
}

// Returns countries split into two groups: direct payment vs VAT-required (Etsy redirect)
export function getCheckoutCountriesGrouped(): { direct: CheckoutCountry[]; vat: CheckoutCountry[] } {
  const direct: CheckoutCountry[] = [];
  const vat: CheckoutCountry[] = [];
  for (const region of SHIPPING_REGIONS) {
    const regionEnabled = region.enabled !== false;
    const list = region.countries
      .filter((c) => c !== "*")
      .map((code) => ({
        code,
        name: ISO_COUNTRY_NAMES[code] ?? code,
        enabled: regionEnabled,
        disabledMessage: regionEnabled ? undefined : region.disabledMessage,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (region.etsyRedirect) vat.push(...list);
    else direct.push(...list);
  }
  direct.sort((a, b) => a.name.localeCompare(b.name));
  return { direct, vat };
}
`;
  downloadFile("shipping.ts", content);
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
