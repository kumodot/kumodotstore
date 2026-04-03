import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PRODUCTS } from "@/data/products.ts";
import { SITE } from "@/config/site.ts";
import { Carousel } from "@/components/ui/Carousel.tsx";
import { CategoryFilter } from "@/components/ui/CategoryFilter.tsx";
import { cartStore } from "@/data/cartStore.ts";
import type { Product, ProductPromotion } from "@/types/index.ts";

const BACKEND_URL = "https://script.google.com/macros/s/AKfycby3R8jh3ehmFnnm1moDTsVHKs0qidsFWJLWnAMZc7XUolsz45ob8wRg2sGJ-fHadPEI/exec";

const PROMO_COLORS: Record<string, string> = {
  new:     "bg-green-500 text-white",
  sale:    "bg-red-500 text-white",
  popular: "bg-accent text-[#0f0f0f]",
  limited: "bg-amber-500 text-[#0f0f0f]",
  soon:    "bg-purple-500 text-white",
  blue:    "bg-blue-500 text-white",
  pink:    "bg-pink-500 text-white",
};

function getImages(product: Product): string[] {
  if (product.images && product.images.length > 0) return product.images;
  if (product.imageUrl) return [product.imageUrl];
  return [];
}

function getBadges(product: Product): ProductPromotion[] {
  if (product.promotions && product.promotions.length > 0) return product.promotions;
  if (product.promotion) return [product.promotion];
  return [];
}

function NotifyModal({ product, type, onClose }: {
  product: Product;
  type: "restock" | "launch";
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");

  const submit = async () => {
    if (!email.trim()) return;
    setState("sending");
    try {
      fetch(BACKEND_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: import.meta.env.VITE_BACKEND_SECRET,
          action: "waitlist",
          waitlistType: type,
          productId: product.id,
          productName: product.name,
          email: email.trim(),
        }),
      });
      setState("ok");
      setTimeout(onClose, 2000);
    } catch {
      setState("error");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="font-semibold text-text-primary mb-1">
          {type === "launch" ? "Notify me at launch" : "Notify me when back"}
        </h3>
        <p className="text-sm text-text-muted mb-4">
          {product.name} — we'll email you when it's available.
        </p>

        {state === "ok" ? (
          <p className="text-sm text-green-400 text-center py-2">✓ You're on the list!</p>
        ) : (
          <>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full px-3 py-2 rounded-lg bg-surface border border-border
                         text-text-primary text-sm placeholder:text-text-muted
                         focus:outline-none focus:border-accent mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 text-sm rounded-lg border border-border
                           text-text-muted hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={state === "sending" || !email.trim()}
                className="flex-1 py-2 text-sm rounded-lg bg-accent text-[#0f0f0f]
                           font-semibold hover:bg-accent-hover transition-colors cursor-pointer
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {state === "sending" ? "Sending..." : "Notify me"}
              </button>
            </div>
            {state === "error" && (
              <p className="text-xs text-red-400 mt-2 text-center">Something went wrong. Try again.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const images = getImages(product);
  const badges = getBadges(product);
  const [added, setAdded] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);

  const isSoon = product.soon === true;
  const isOutOfStock = !product.inStock && !isSoon;

  const handleAddToCart = () => {
    cartStore.add(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="relative bg-surface-card border border-border rounded-xl overflow-hidden
                    hover:border-border-light transition-all duration-200 hover:-translate-y-0.5
                    hover:shadow-lg hover:shadow-black/30 flex flex-col group">

      {/* Promo badges — stacked top left */}
      {badges.length > 0 && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
          {badges.map((b, i) => (
            <span
              key={i}
              className={`px-2.5 py-1 text-xs font-bold rounded-full
                ${PROMO_COLORS[b.variant] ?? "bg-surface-elevated text-text-primary"}`}
            >
              {b.label}
            </span>
          ))}
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

        <h3 className="font-semibold text-text-primary mb-1 leading-tight">{product.name}</h3>
        <p className="text-sm text-text-secondary mb-4 flex-1 leading-relaxed">
          {product.shortDescription}
        </p>

        <div className="flex items-end justify-between gap-2 mt-auto">
          <div>
            {isSoon ? (
              <span className="text-xl font-bold text-text-muted tracking-widest">???</span>
            ) : isOutOfStock ? (
              <div>
                <span className="text-xl font-bold text-text-muted line-through">
                  CA${product.price.toFixed(2)}
                </span>
                <p className="text-xs text-red-400 mt-0.5 font-medium">Out of stock</p>
              </div>
            ) : product.price > 0 ? (
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
            {(isSoon || isOutOfStock) ? (
              <button
                onClick={() => setNotifyOpen(true)}
                className="px-3 py-1.5 text-sm bg-surface-elevated border border-border
                           text-text-secondary rounded-lg hover:bg-surface-hover
                           hover:text-text-primary transition-colors whitespace-nowrap cursor-pointer"
              >
                Notify me
              </button>
            ) : (
              <>
                {product.kustomizerModelId && (
                  <Link
                    to={`/kustomize/${product.kustomizerModelId}?product=${product.id}`}
                    className="px-3 py-1.5 text-sm bg-surface-elevated border border-border
                               text-text-secondary rounded-lg hover:bg-surface-hover
                               hover:text-text-primary transition-colors whitespace-nowrap"
                  >
                    Customize
                  </Link>
                )}
                {product.variationConfigId && (
                  <Link
                    to={`/configure/${product.variationConfigId}?product=${product.id}`}
                    className="px-3 py-1.5 text-sm bg-surface-elevated border border-border
                               text-text-secondary rounded-lg hover:bg-surface-hover
                               hover:text-text-primary transition-colors whitespace-nowrap"
                  >
                    Customize
                  </Link>
                )}
                {product.price > 0 && (
                  <button
                    onClick={handleAddToCart}
                    title="Add to cart"
                    className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer
                      ${added ? "bg-green-500/20" : "hover:bg-surface-hover"}`}
                  >
                    {added ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <img src="/add-to-bag_blue.png" alt="Add to cart" className="w-7 h-7 object-contain" />
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {notifyOpen && (
        <NotifyModal
          product={product}
          type={isSoon ? "launch" : "restock"}
          onClose={() => setNotifyOpen(false)}
        />
      )}
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
      if (!seen.has(cat)) { seen.add(cat); result.push(cat); }
    }
  }
  return result;
}

export function StorefrontPage() {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => sortedProducts(PRODUCTS.filter(p => p.listed !== false)), []);
  const categories = useMemo(() => allCategories(sorted), [sorted]);

  const visible = useMemo(() => {
    if (activeFilters.size === 0) return sorted;
    return sorted.filter((p) => p.categories?.some((cat) => activeFilters.has(cat)));
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
