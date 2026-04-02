import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar.tsx";
import { Footer } from "@/components/layout/Footer.tsx";
import { PrivacyBanner } from "@/components/layout/PrivacyBanner.tsx";

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-text-primary">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <PrivacyBanner />
    </div>
  );
}
