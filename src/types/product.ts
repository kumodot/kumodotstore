export interface Product {
  id: string;
  slug: string;
  sortOrder?: number;   // lower = first. Leave undefined to sort by array order
  name: string;
  shortDescription: string;
  price: number;
  currency: string;
  images?: string[];      // multiple photos for carousel
  imageUrl?: string;     // legacy single image fallback
  etsyUrl?: string;
  kustomizerModelId?: string;
  promotion?: {
    label: string;
    variant: "new" | "sale" | "popular" | "limited";
  };
  inStock: boolean;
}
