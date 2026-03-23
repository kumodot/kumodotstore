import type { Product } from "@/types/index.ts";

export const PRODUCTS: Product[] = [
  {
    id: "pokz-02",
    slug: "pokz-02",
    name: "POKZ-02",
    shortDescription:
      "Custom 3D-printed protective case for Teenage Engineering Pocket Operator. Choose your own button colors.",
    price: 29.99,
    currency: "USD",
    // Add photos to public/images/products/ and list them here:
    // images: [
    //   "/kumodotstore/images/products/pokz-02-1.jpg",
    //   "/kumodotstore/images/products/pokz-02-2.jpg",
    //   "/kumodotstore/images/products/pokz-02-3.jpg",
    // ],
    etsyUrl: "https://www.etsy.com/shop/kumodot",
    kustomizerModelId: "pokz-02",
    promotion: { label: "POPULAR", variant: "popular" },
    inStock: true,
  },
];
