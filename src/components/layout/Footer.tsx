import { Link } from "react-router-dom";
import { SITE } from "@/config/site.ts";

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center
                      justify-between gap-3 text-xs text-text-muted">
        <span>&copy; {new Date().getFullYear()} kumodot</span>

        <div className="flex items-center gap-5">
          <a
            href={SITE.etsyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors"
          >
            Etsy
          </a>
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-text-secondary transition-colors"
            aria-label="Instagram @kumodotdesign"
          >
            <InstagramIcon />
            <span>@kumodotdesign</span>
          </a>
          <a
            href={SITE.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors"
          >
            GitHub
          </a>
          <Link
            to="/admin"
            className="hover:text-text-secondary transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
