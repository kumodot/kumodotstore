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
  navItems: [
    { label: "Home", path: "/" },
    { label: "Kustomizer", path: "/kustomize" },
  ],
} as const;
