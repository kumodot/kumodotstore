import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { SITE } from "@/config/site.ts";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src={SITE.logoIconUrl}
            alt="kumodot logo"
            className="h-7 w-7 object-contain"
          />
          <span className="font-bold text-text-primary tracking-tight leading-none">
            kumodot<span className="text-accent">store</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          {SITE.navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-sm font-medium transition-colors ${
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path))
                  ? "text-accent"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={SITE.etsyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Etsy Shop ↗
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 text-text-secondary hover:text-text-primary cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M4 4L16 16M16 4L4 16" />
            ) : (
              <path d="M3 5h14M3 10h14M3 15h14" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border px-4 py-3 space-y-1 bg-surface">
          {SITE.navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block py-2 text-sm font-medium transition-colors ${
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path))
                  ? "text-accent"
                  : "text-text-secondary hover:text-text-primary"
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={SITE.etsyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            Etsy Shop ↗
          </a>
        </div>
      )}
    </nav>
  );
}
