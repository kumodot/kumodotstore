export interface VariationOption {
  id: string;
  label: string;
  priceDelta: number; // added to product base price
  imageUrl?: string;  // optional photo shown when selected
}

export interface VariationGroup {
  id: string;
  name: string;       // e.g. "Angle", "Color"
  required: boolean;
  options: VariationOption[];
}

export interface VariationConfig {
  id: string;
  name: string;
  groups: VariationGroup[];
}
