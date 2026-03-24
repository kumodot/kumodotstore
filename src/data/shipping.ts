export interface ShippingRegion {
  id: string;
  name: string;
  countries: string[]; // ISO 3166-1 alpha-2 codes, or ["*"] for catch-all
  rate: number;        // in CAD
  currency: string;
  etsyRedirect: boolean;
  freeShipping: boolean;
}

export const SHIPPING_REGIONS: ShippingRegion[] = [
  {
    id: "canada",
    name: "Canada",
    countries: ["CA"],
    rate: 10,
    currency: "CAD",
    etsyRedirect: false,
    freeShipping: false,
  },
  {
    id: "usa",
    name: "United States",
    countries: ["US"],
    rate: 40,
    currency: "CAD",
    etsyRedirect: false,
    freeShipping: false,
  },
  {
    id: "europe",
    name: "Europe (EU + UK)",
    countries: [
      "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU",
      "IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES",
      "SE","GB","NO","CH","IS","LI"
    ],
    rate: 0,
    currency: "CAD",
    etsyRedirect: true,
    freeShipping: false,
  },
  {
    id: "world",
    name: "Rest of World",
    countries: ["AU","JP","NZ","MX","SG","KR","HK","TW","NF","ZA","IL","AE"],
    rate: 10,
    currency: "CAD",
    etsyRedirect: false,
    freeShipping: false,
  },
];

export function getRegionForCountry(countryCode: string): ShippingRegion {
  const match = SHIPPING_REGIONS.find((r) => r.countries.includes(countryCode));
  // fallback to catch-all (*) or last region
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

// Returns countries split into two groups: direct payment vs VAT-required (Etsy redirect)
export function getCheckoutCountriesGrouped(): {
  direct: { code: string; name: string }[];
  vat: { code: string; name: string }[];
} {
  const direct: { code: string; name: string }[] = [];
  const vat: { code: string; name: string }[] = [];
  for (const region of SHIPPING_REGIONS) {
    const list = region.countries
      .filter((c) => c !== "*")
      .map((code) => ({ code, name: ISO_COUNTRY_NAMES[code] ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (region.etsyRedirect) vat.push(...list);
    else direct.push(...list);
  }
  direct.sort((a, b) => a.name.localeCompare(b.name));
  return { direct, vat };
}
