export interface ShippingRegion {
  id: string;
  name: string;
  countries: string[]; // ISO 3166-1 alpha-2 codes, or ["*"] for catch-all
  rate: number;        // in CAD
  currency: string;
  etsyRedirect: boolean; // if true, redirect to Etsy instead of PayPal
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
    countries: ["*"],
    rate: 10,
    currency: "CAD",
    etsyRedirect: false,
    freeShipping: false,
  },
];

export function getRegionForCountry(countryCode: string): ShippingRegion {
  const specific = SHIPPING_REGIONS.find(
    (r) => !r.countries.includes("*") && r.countries.includes(countryCode)
  );
  if (specific) return specific;
  return SHIPPING_REGIONS.find((r) => r.countries.includes("*"))!;
}

// Full country list for the dropdown
export const COUNTRIES: { code: string; name: string }[] = [
  { code: "CA", name: "Canada" },
  { code: "US", name: "United States" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GR", name: "Greece" },
  { code: "HU", name: "Hungary" },
  { code: "IS", name: "Iceland" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "LV", name: "Latvia" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MT", name: "Malta" },
  { code: "MX", name: "Mexico" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NO", name: "Norway" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "GB", name: "United Kingdom" },
  { code: "OTHER", name: "Other country..." },
];
