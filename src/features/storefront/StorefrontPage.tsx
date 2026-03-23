import { Link } from "react-router-dom";
import { PRODUCTS } from "@/data/products.ts";
import { SITE } from "@/config/site.ts";

const PROMO_COLORS: Record<string, string> = {
  new: "bg-green-500",
  sale: "bg-red-500",
  popular: "bg-accent",
  limited: "bg-amber-500",
};

export function StorefrontPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">
          {SITE.name}
        </h1>
        <p className="text-lg text-text-secondary max-w-md mx-auto">
          {SITE.tagline}
        </p>
      </section>

      {/* Product Grid */}
      <section>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-6">
          Products
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((product) => (
            <div
              key={product.id}
              className="relative bg-surface-card border border-border rounded-xl overflow-hidden
                         hover:border-border-light transition-colors group"
            >
              {/* Promo badge */}
              {product.promotion && (
                <div
                  className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-bold rounded-full
                    text-surface z-10 ${PROMO_COLORS[product.promotion.variant]}`}
                >
                  {product.promotion.label}
                </div>
              )}

              {/* Image placeholder */}
              <div className="aspect-square bg-surface-elevated flex items-center justify-center
                              group-hover:bg-surface-hover transition-colors">
                <span className="text-4xl font-bold text-text-muted font-mono">
                  {product.name}
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-text-primary mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                  {product.shortDescription}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-text-primary">
                    ${product.price.toFixed(2)}
                  </span>
                  <div className="flex gap-2">
                    {product.kustomizerModelId && (
                      <Link
                        to={`/kustomize/${product.kustomizerModelId}`}
                        className="px-3 py-1.5 text-sm bg-accent text-surface font-medium
                                   rounded-lg hover:bg-accent-hover transition-colors"
                      >
                        Customize
                      </Link>
                    )}
                    {product.etsyUrl && (
                      <a
                        href={product.etsyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-sm bg-surface-elevated border border-border
                                   text-text-primary rounded-lg hover:bg-surface-hover
                                   transition-colors"
                      >
                        Buy on Etsy
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
