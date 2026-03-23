import type { Product } from "@/types/index.ts";

export const PRODUCTS: Product[] = [
  {
    id: "pokz-koii",
    slug: "pokz-koii",
    name: "POKZ-KOII",
    shortDescription:
      "3D-printed protective case for Teenage Engineering Pocket Operator. 2026 model — the best, now better. Choose your own button colors.",
    price: 29.99,
    currency: "USD",
    images: [
      "/kumodotstore/images/products/POKZ_KOII-01.jpg",
      "/kumodotstore/images/products/POKZ_KOII-02.jpg",
      "/kumodotstore/images/products/POKZ_KOII-03.jpg",
      "/kumodotstore/images/products/POKZ_KOII-04.jpg",
    ],
    etsyUrl: "https://www.etsy.com/shop/kumodotstore",
    kustomizerModelId: "pokz-02",
    promotion: { label: "NEW 2026", variant: "new" },
    inStock: true,
  },
];
