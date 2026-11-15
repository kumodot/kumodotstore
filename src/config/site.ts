export const TELEGRAM = {
  botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string,
  chatId: import.meta.env.VITE_TELEGRAM_CHAT_ID as string,
};

export const SITE = {
  name: "kumodot store",
  tagline: "Custom cases for your Pocket Operator",
  etsyUrl: "https://www.etsy.com/shop/kumodotstore",
  githubUrl: "https://github.com/kumodot",
  instagramUrl: "https://www.instagram.com/kumodotdesign/",
  logoUrl: "/images/KUMODOT_LOGOTYPE_WHITE.png",
  logoIconUrl: "/images/Kumodot_LOGO_RED.png",
  // Waiting list for the FM1_Kz launch (top bar + home). Same Apps Script waitlist, tab launch_fm1-kz.
  // One list for the whole FM1_Kz line (cases and knobs go live together): top bar, home and both Kustomizer pages.
  // discountCode must match the code created on Etsy exactly; percent is only the wording shown to the buyer.
  waitlist: { id: "fm1-kz", name: "FM1_Kz", discountCode: "FM1KZLAUNCH", discountPercent: 5 },
  navItems: [
    { label: "Home", path: "/" },
    { label: "Kustomizer", path: "/kustomize" },
  ],
} as const;
