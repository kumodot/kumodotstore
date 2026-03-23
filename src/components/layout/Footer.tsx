import { SITE } from "@/config/site.ts";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center
                      justify-between gap-2 text-xs text-text-muted">
        <span>&copy; {new Date().getFullYear()} kumodot</span>
        <div className="flex gap-4">
          <a
            href={SITE.etsyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors"
          >
            Etsy
          </a>
          <a
            href={SITE.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-secondary transition-colors"
          >
            GitHub
          </a>
          <a
            href="#/admin"
            className="hover:text-text-secondary transition-colors"
          >
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
}
