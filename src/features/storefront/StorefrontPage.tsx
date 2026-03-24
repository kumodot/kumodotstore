import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PRODUCTS } from "@/data/products.ts";
import { SITE } from "@/config/site.ts";
import { Carousel } from "@/components/ui/Carousel.tsx";
import { CategoryFilter } from "@/components/ui/CategoryFilter.tsx";
import { CheckoutModal } from "@/features/checkout/CheckoutModal.tsx";
import type { Product } from "@/types/index.ts";

const PROMO_COLORS: Record<string, string> = {
  new: "bg-green-500 text-white",
  sale: "bg-red-500 text-white",
  popular: "bg-accent text-[#0f0f0f]",
  limited: "bg-amber-500 text-[#0f0f0f]",
};

function getImages(product: Product): string[] {
  if (product.images && product.images.length > 0) return product.images;
  if (product.imageUrl) return [product.imageUrl];
  return [];
}

function ProductCard({ product }: { product: Product }) {
  const images = getImages(product);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <div className="relative bg-surface-card border border-border rounded-xl overflow-hidden
                    hover:border-border-light transition-all duration-200 hover:-translate-y-0.5
                    hover:shadow-lg hover:shadow-black/30 flex flex-col group">
      {/* Promo badge */}
      {product.promotion && (
        <div className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-bold rounded-full z-10
          ${PROMO_COLORS[product.promotion.variant] ?? "bg-surface-elevated text-text-primary"}`}>
          {product.promotion.label}
        </div>
      )}

      {/* Image / Carousel */}
      {images.length > 0 ? (
        <Carousel images={images} alt={product.name} />
      ) : (
        <div className="aspect-square bg-surface-elevated flex items-center justify-center
                        group-hover:bg-surface-hover transition-colors">
          <span className="text-3xl font-bold text-text-muted font-mono tracking-tight">
            {product.name}
          </span>
        </div>
      )}

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category pills on card */}
        {product.categories && product.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.categories.map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold
                           bg-surface-elevated border border-border text-text-muted tracking-wide"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-semibold text-text-primary mb-1 leading-tight">
          {product.name}
        </h3>
        <p className="text-sm text-text-secondary mb-4 flex-1 leading-relaxed">
          {product.shortDescription}
        </p>

        <div className="flex items-end justify-between gap-2 mt-auto">
          <div>
            {product.price > 0 ? (
              <>
                <span className="text-xl font-bold text-text-primary">
                  CA${product.price.toFixed(2)}
                </span>
                <p className="text-xs text-text-muted mt-0.5">Prices in CAD. Final price at checkout.</p>
              </>
            ) : (
              <span className="text-sm font-medium text-text-muted">Coming soon</span>
            )}
          </div>

          <div className="flex gap-2 shrink-0 items-center">
            {product.kustomizerModelId && (
              <Link
                to={`/kustomize/${product.kustomizerModelId}`}
                className="px-3 py-1.5 text-sm bg-surface-elevated border border-border
                           text-text-secondary rounded-lg hover:bg-surface-hover
                           hover:text-text-primary transition-colors whitespace-nowrap"
              >
                Customize
              </Link>
            )}
            {product.price > 0 && (
              <button
                onClick={() => setCheckoutOpen(true)}
                className="px-3 py-1.5 text-sm bg-accent text-[#0f0f0f] font-semibold
                           rounded-lg hover:bg-accent-hover transition-colors whitespace-nowrap cursor-pointer"
              >
                Buy
              </button>
            )}
          </div>

          {checkoutOpen && (
            <CheckoutModal
              product={product}
              onClose={() => setCheckoutOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function sortedProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

function allCategories(products: Product[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const p of products) {
    for (const cat of p.categories ?? []) {
      if (!seen.has(cat)) {
        seen.add(cat);
        result.push(cat);
      }
    }
  }
  return result;
}

export function StorefrontPage() {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => sortedProducts(PRODUCTS), []);
  const categories = useMemo(() => allCategories(sorted), [sorted]);

  const visible = useMemo(() => {
    if (activeFilters.size === 0) return sorted;
    return sorted.filter((p) =>
      p.categories?.some((cat) => activeFilters.has(cat))
    );
  }, [sorted, activeFilters]);

  const toggleFilter = (cat: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Slim tagline bar just below navbar */}
      <div className="py-3 mb-8 border-b border-border">
        <p className="text-xs text-text-muted tracking-widest uppercase text-center">
          {SITE.tagline}
        </p>
      </div>

      <section className="pb-12">
        <CategoryFilter
          categories={categories}
          active={activeFilters}
          onToggle={toggleFilter}
          onClear={() => setActiveFilters(new Set())}
        />

        {visible.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-16">
            No products found for the selected filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
