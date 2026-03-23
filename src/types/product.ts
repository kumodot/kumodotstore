export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  price: number;
  currency: string;
  imageUrl?: string;
  etsyUrl?: string;
  kustomizerModelId?: string;
  promotion?: {
    label: string;
    variant: "new" | "sale" | "popular" | "limited";
  };
  inStock: boolean;
}
