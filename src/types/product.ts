export interface Product {
  id: string;
  slug: string;
  sortOrder?: number;        // lower = first. Leave undefined to sort by array order
  categories?: string[];     // e.g. ["PO", "EP-133"] — drives the filter pills
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
