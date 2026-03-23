import type { Product } from "@/types/index.ts";

// ─── HOW TO ADD A PRODUCT ────────────────────────────────────────────────────
// 1. Copy the block below and paste it after the last product (before the ];)
// 2. Fill in the fields — only id, slug, name, price, currency, inStock are required
// 3. Add photos to public/images/products/ and list them in the images array
// 4. git add . && git commit -m "add product X" && git push
//
// TEMPLATE:
// {
//   id: "your-product-id",          // unique, no spaces
//   slug: "your-product-id",        // same as id, used in URLs
//   sortOrder: 10,                  // controls order in grid (lower = first)
//   name: "Product Name",
//   shortDescription: "One or two sentences about the product.",
//   price: 49.99,
//   currency: "CAD",
//   categories: ["PO", "EP-133"],   // filter pills — any string, new ones auto-appear
//   images: [
//     "/kumodotstore/images/products/your-product-01.jpg",
//     "/kumodotstore/images/products/your-product-02.jpg",
//   ],
//   etsyUrl: "https://www.etsy.com/listing/XXXXXXX/your-listing",
//   kustomizerModelId: "pokz-02",   // remove line if product has no kustomizer
//   promotion: { label: "NEW", variant: "new" },  // variants: new | sale | popular | limited
//   inStock: true,
// },
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCTS: Product[] = [
  {
    id: "pokz-koii",
    slug: "pokz-koii",
    sortOrder: 1,
    name: "POKZ-KOII",
    shortDescription:
      "3D-printed protective case for Teenage Engineering Pocket Operator. 2026 model — the best, now better. Choose your own button colors.",
    price: 70.00,
    currency: "CAD",
    images: [
      "/kumodotstore/images/products/POKZ_KOII-01.jpg",
      "/kumodotstore/images/products/POKZ_KOII-02.jpg",
      "/kumodotstore/images/products/POKZ_KOII-03.jpg",
      "/kumodotstore/images/products/POKZ_KOII-04.jpg",
    ],
    categories: ["PO"],
    etsyUrl: "https://www.etsy.com/ca/listing/4446276407/kmdt-pokz-koii-edition-2026-model",
    kustomizerModelId: "pokz-02",
    promotion: { label: "NEW 2026", variant: "new" },
    inStock: true,
  },
  {
    id: "placeholder-2",
    slug: "placeholder-2",
    sortOrder: 2,
    name: "POKZ-01",
    shortDescription: "A new product is on its way. Stay tuned.",
    price: 50,
    categories: ["PO"],
    etsyUrl: "https://www.etsy.com/ca/listing/4308877925/kmdt-pokz-01-2026-model-pocket-operator",
    currency: "CAD",
    inStock: true,
  },
  {
    id: "placeholder-3",
    slug: "placeholder-3",
    sortOrder: 3,
    name: "POKZ-02",
    shortDescription: "A new product is on its way. Stay tuned.",
    price: 65,
    categories: ["PO"],
    etsyUrl: "https://www.etsy.com/ca/listing/1901389447/kmdt-pokz-02-2026-model-pocket-operator",
    currency: "CAD",
    inStock: true,
  },
    {
    id: "placeholder-4",
    slug: "placeholder-4",
    sortOrder: 4,
    name: "OP-1 STANDS",
    shortDescription: "A new product is on its way. Stay tuned.",
    price: 40,
    categories: ["OP-1"],
    etsyUrl: "https://www.etsy.com/ca/listing/1071324709/kmdt-og-op-1-stands",
    currency: "CAD",
    inStock: true,
  },
];
