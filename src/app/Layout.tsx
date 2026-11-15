import { Outlet } from "react-router-dom";
import { Backdrop } from "@/components/layout/Backdrop.tsx";
import { Navbar } from "@/components/layout/Navbar.tsx";
import { Footer } from "@/components/layout/Footer.tsx";
import { PrivacyBanner } from "@/components/layout/PrivacyBanner.tsx";
import { SITE } from "@/config/site.ts";
import { STORE_MODE } from "@/data/storeMode.ts";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col text-text-primary">
      <Backdrop />
      {STORE_MODE.showBanner && (
        <div className="bg-accent text-[#0f0f0f] font-mono uppercase tracking-wider text-[11px] sm:text-xs text-center py-2 px-4 font-medium">
          {STORE_MODE.bannerText}{" "}
          <a
            href={SITE.etsyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            Visit our Etsy shop ↗
          </a>
        </div>
      )}
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <PrivacyBanner />
    </div>
  );
}
