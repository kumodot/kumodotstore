import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Scramble } from "@/components/ui/Scramble.tsx";
import { JoinListButton } from "@/components/ui/JoinListButton.tsx";
import { SITE } from "@/config/site.ts";
import { STORE_MODE } from "@/data/storeMode.ts";
import { useCart } from "@/features/checkout/useCart.ts";
import { CartModal } from "@/features/checkout/CartModal.tsx";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { count, total } = useCart();

  // Open cart automatically when navigated to /?openCart=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (STORE_MODE.cartEnabled && params.get("openCart") === "1") {
      setCartOpen(true);
      navigate("/", { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <>
      <nav className="border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-[72px] flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0" aria-label="kumodot store">
            <img src="/brand/kumodot-store_on-dark.svg" alt="KUMODOT STORE" className="h-9 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-6">
            {SITE.navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`font-mono text-xs uppercase tracking-[.06em] transition-colors ${
                  location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path))
                    ? "text-accent"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Scramble text={item.label} />
              </Link>
            ))}
            {import.meta.env.DEV && (
              <Link to="/admin_k9x7m" className={`font-mono text-xs uppercase tracking-[.06em] transition-colors ${location.pathname.startsWith("/admin_k9x7m") ? "text-accent" : "text-accent/70 hover:text-accent"}`}>
                Studio
              </Link>
            )}
            <a
              href={SITE.etsyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs uppercase tracking-[.06em] text-text-secondary hover:text-text-primary transition-colors"
            >
              <Scramble text="Etsy Shop ↗" />
            </a>
            <JoinListButton />

            {/* Cart button */}
            {STORE_MODE.cartEnabled && (
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 p-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Cart"
            >
              <div className="relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-[#0f0f0f] text-[10px]
                                   font-bold rounded-full flex items-center justify-center leading-none">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </div>
              {total > 0 && (
                <span className="text-xs font-medium text-text-secondary tabular-nums">
                  CA${total.toFixed(0)}
                </span>
              )}
            </button>
            )}
          </div>

          {/* Mobile right side */}
          <div className="flex sm:hidden items-center gap-2">
            {STORE_MODE.cartEnabled && (
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-1.5 p-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Cart"
            >
              <div className="relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-[#0f0f0f] text-[10px]
                                   font-bold rounded-full flex items-center justify-center leading-none">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </div>
              {total > 0 && (
                <span className="text-xs font-medium text-text-secondary tabular-nums">
                  CA${total.toFixed(0)}
                </span>
              )}
            </button>
            )}
            <button
              className="p-2 text-text-secondary hover:text-text-primary cursor-pointer"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? <path d="M4 4L16 16M16 4L4 16" /> : <path d="M3 5h14M3 10h14M3 15h14" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="sm:hidden border-t border-border px-4 py-3 space-y-1 bg-surface">
            {SITE.navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block py-2 font-mono text-xs uppercase tracking-[.06em] transition-colors ${
                  location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path))
                    ? "text-accent"
                    : "text-text-secondary hover:text-text-primary"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                <Scramble text={item.label} />
              </Link>
            ))}
            {import.meta.env.DEV && (
              <Link to="/admin_k9x7m" onClick={() => setMobileOpen(false)} className="block py-2 font-mono text-xs uppercase tracking-[.06em] text-accent">
                Studio
              </Link>
            )}
            <a
              href={SITE.etsyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block py-2 font-mono text-xs uppercase tracking-[.06em] text-text-secondary hover:text-text-primary"
            >
              Etsy Shop ↗
            </a>
            <JoinListButton className="w-full mt-2" />
          </div>
        )}
      </nav>

      {STORE_MODE.cartEnabled && cartOpen && <CartModal onClose={() => setCartOpen(false)} />}
    </>
  );
}
