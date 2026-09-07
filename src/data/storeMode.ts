export interface StoreMode {
  cartEnabled: boolean;   // false = cart/checkout hidden, products link to Etsy
  showPrices: boolean;    // false = prices masked with ***
  showBanner: boolean;    // false = hides the top notice bar
  bannerText: string;
}

export const STORE_MODE: StoreMode = {
  cartEnabled: false,
  showPrices: false,
  showBanner: true,
  bannerText: "Checkout is temporarily handled through our Etsy shop.",
};
