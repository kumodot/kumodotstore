import type { FilamentColor } from "@/types/index.ts";
import type { Product } from "@/types/index.ts";
import type { VariationConfig } from "@/types/index.ts";
import type { ColorTemplate } from "@/types/index.ts";
import type { ShippingRegion } from "@/data/shipping.ts";
import type { StoreMode } from "@/data/storeMode.ts";
import { studioWrite } from "./studioApi.ts";

export async function exportStoreModeTs(mode: StoreMode): Promise<void> {
  const content = `export interface StoreMode {
  cartEnabled: boolean;   // false = cart/checkout hidden, products link to Etsy
  showPrices: boolean;    // false = prices masked with ***
  showBanner: boolean;    // false = hides the top notice bar
  bannerText: string;
}

export const STORE_MODE: StoreMode = {
  cartEnabled: ${mode.cartEnabled},
  showPrices: ${mode.showPrices},
  showBanner: ${mode.showBanner},
  bannerText: ${JSON.stringify(mode.bannerText)},
};
`;
  downloadFile("storeMode.ts", content);
}

export async function exportFm1ThemesTs(themes: { id: string; name: string; code: string; enabled?: boolean; lock?: string }[]): Promise<void> {
  const used = new Set<string>();
  const rows = themes.map((t, i) => {
    const slug = (t.id || t.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `theme-${i + 1}`;
    let id = slug;
    for (let n = 2; used.has(id); n++) id = `${slug}-${n}`;
    used.add(id);
    const extra = `${t.enabled === false ? ", enabled: false" : ""}${t.lock ? `, lock: ${JSON.stringify(t.lock)}` : ""}`;
    return `  { id: ${JSON.stringify(id)}, name: ${JSON.stringify(t.name.trim())}, code: ${JSON.stringify(t.code.trim())}${extra} },`;
  });
  const content = `// FM1_Kz ready themes (the strip at the top of the Kustomizer).
//
// A theme is a name and an order code. To add one: design it in the Kustomizer, press Copy, then paste the
// code in the Store Studio, tab "FM1 Themes". The Studio writes this file. Ids are codenames, not public names.
// enabled: false = hidden on the public site (ready but not released yet).
// lock: SHA-256 of a secret unlock code (see src/features/fm1/themeLock.ts); the theme only shows for buyers who
// typed that code in the Kustomizer. The code itself is never stored here.
export interface Fm1ThemeData { id: string; name: string; code: string; enabled?: boolean; lock?: string }

export const FM1_THEMES: Fm1ThemeData[] = [
${rows.join("\n")}
];
`;
  downloadFile("fm1Themes.ts", content);
}

export async function exportColorAvailabilityTs(limits: Record<string, string[]>, activeIds: string[]): Promise<void> {
  // A product with every active color ticked is left out: it offers all active colors, new ones included.
  const entries = Object.entries(limits)
    .map(([line, ids]) => [line, activeIds.filter((id) => ids.includes(id))] as const)
    .filter(([, ids]) => ids.length !== activeIds.length)
    .map(([line, ids]) => `  ${JSON.stringify(line)}: [${ids.map((id) => JSON.stringify(id)).join(", ")}],`);
  const content = `// Colors offered per product line.
//
// Every color marked \`available\` in colors.ts (the admin "Colors" tab) is offered by default.
// To LIMIT a line, list the ids it may offer below. To grow it later, add an id to the list. That is all:
// the tools only ever show these colors, and a code or saved theme that already uses another color
// still loads and still draws correctly.
//
// Written by the admin (Colors tab, "Colors per product"). Keys: "fm1-case" (FM1_Kz faceplate and bezel),
// "fm1-knobs" (FM1_Kz knob bodies and caps) and "pokz" (Pocket Operator cases). Ids: RD Red, OR Orange, YE Yellow, GR Green, IB Ice Blue, BL Blue,
// PU Purple, LG Light Gray, MG Medium Gray, DG Dark Gray, WH White, BK Black, GD Gold.
export const COLOR_LIMITS: Record<string, string[] | undefined> = {
${entries.join("\n")}
};

export function offeredColors<T extends { id: string; available: boolean }>(line: string, all: T[]): T[] {
  const limit = COLOR_LIMITS[line];
  return all.filter((c) => c.available && (!limit || limit.includes(c.id)));
}
`;
  downloadFile("colorAvailability.ts", content);
}

export async function exportColorsTs(colors: FilamentColor[]): Promise<void> {
  const lines = colors.map((c) => {
    const [r, g, b] = c.rgb;
    const avail = c.available ? "true" : "false";
    const extra = (c.translucent ? ", translucent: true" : "") + (c.knobsOnly ? ", knobsOnly: true" : "");
    return `  { id: "${c.id}", name: "${c.name}", rgb: [${r}, ${g}, ${b}], hex: "${c.hex}", available: ${avail}${extra} },`;
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

export async function exportKnobAvailabilityTs(off: string[], noCap: string[]): Promise<void> {
  const list = (a: string[]) => a.map((x) => JSON.stringify(x)).join(", ");
  const content = `// FM1_Kz knob models: which are out of stock right now, and which take no cap.
//
// Written by the Store Studio (FM1 Themes tab, "Knob models"). Ids: classic_short, classic_long (Chalice),
// groove_short, groove_long.
// KNOBS_OFF: hidden from the model arrows on the public site; a theme or a pasted code that already uses it still
// loads, and the buyer sees a short out-of-stock note before ordering.
// KNOBS_NO_CAP: models that take no cap. The cap is hidden everywhere (3D, top view, picture, packing list); the
// order code keeps its cap color field, so switching the model back brings the cap back.
export const KNOBS_OFF: string[] = [${list(off)}];
export const KNOBS_NO_CAP: string[] = [${list(noCap)}];

export const knobOn = (style: string, height: string) => !KNOBS_OFF.includes(\`\${style}_\${height}\`);
export const hasCap = (style: string, height: string) => !KNOBS_NO_CAP.includes(\`\${style}_\${height}\`);
`;
  await downloadFile("knobAvailability.ts", content);
}

async function downloadFile(filename: string, content: string): Promise<void> {
  // Store Studio running: save straight into src/data, no file dialog
  if (await studioWrite(filename, content)) return;
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
