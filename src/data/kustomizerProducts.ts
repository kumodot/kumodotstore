// What the Kustomizer's top picker offers. The first entry is the default, so
// /#/kustomize with no params behaves exactly as before (POKZ grid).
//
// `launched: false` = the listing is not live yet: the page shows a waiting
// list button instead of a buy link. Flip it (and fill etsyUrl) when the
// Etsy listing goes live.
export interface KustomizerProduct {
  id: string;                         // also the waitlist product id
  kind: "grid" | "fm1-case" | "fm1-knobs";
  name: string;
  tagline: string;
  image: string;
  launched: boolean;
  etsyUrl?: string;
}

export const KUSTOMIZER_PRODUCTS: KustomizerProduct[] = [
  {
    id: "pokz",
    kind: "grid",
    name: "Pocket Operator Cases",
    tagline: "POKZ cases for Teenage Engineering PO",
    image: "/images/products/POKZ_02-01.jpg",
    launched: true,
  },
  {
    id: "fm1-kz-case",
    kind: "fm1-case",
    name: "FM1_Kz Case",
    tagline: "Faceplate + knobs for the M-VAVE FM-1",
    image: "/images/kustomizer/fm1-case.svg",
    launched: false,
  },
  {
    id: "fm1-kz-knobs",
    kind: "fm1-knobs",
    name: "FM1_Kz Knobs",
    tagline: "Custom knob set for the M-VAVE FM-1",
    image: "/images/kustomizer/fm1-knobs.svg",
    launched: false,
  },
];

export const DEFAULT_KUSTOMIZER_PRODUCT = KUSTOMIZER_PRODUCTS[0].id;
