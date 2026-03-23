import { Link } from "react-router-dom";
import { PRODUCTS } from "@/data/products.ts";
import { SITE } from "@/config/site.ts";
import { Carousel } from "@/components/ui/Carousel.tsx";
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

function sortedProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const aOrder = a.sortOrder ?? 999;
    const bOrder = b.sortOrder ?? 999;
    return aOrder - bOrder;
  });
}

function ProductCard({ product }: { product: Product }) {
  const images = getImages(product);

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
                className="px-3 py-1.5 text-sm bg-accent text-[#0f0f0f] font-semibold
                           rounded-lg hover:bg-accent-hover transition-colors whitespace-nowrap"
              >
                Customize
              </Link>
            )}
            {product.etsyUrl ? (
              <a
                href={product.etsyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm bg-surface-elevated border border-border
                           text-text-secondary rounded-lg hover:bg-surface-hover
                           hover:text-text-primary transition-colors whitespace-nowrap"
              >
                Etsy ↗
              </a>
            ) : (
              <button
                disabled
                title="Add to cart — coming soon"
                className="w-9 h-9 flex items-center justify-center rounded-lg
                           bg-surface-elevated border border-border opacity-60
                           cursor-not-allowed"
                aria-label="Add to cart (coming soon)"
              >
                {/* Shopping cart icon — red */}
                <svg fill="#e53e3e" width="18" height="18" viewBox="-1 0 19 19" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.417 9.579A7.917 7.917 0 1 1 8.5 1.662a7.917 7.917 0 0 1 7.917 7.917zm-3.34-2.323a.63.63 0 0 0-.628-.628H5.892l-.436-1a.384.384 0 0 0-.351-.23H3.68a.384.384 0 1 0 0 .768h1.173l1.785 4.096a.37.37 0 0 0-.087-.01 1.161 1.161 0 1 0 0 2.322h.042a.792.792 0 1 0 .864 0h3.452a.792.792 0 1 0 .864 0h.565a.384.384 0 1 0 0-.767H6.55a.393.393 0 0 1 0-.787.38.38 0 0 0 .098-.013l5.803-.602a.714.714 0 0 0 .625-.694z"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StorefrontPage() {
  const products = sortedProducts(PRODUCTS);

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Slim tagline bar just below navbar */}
      <div className="py-3 mb-8 border-b border-border">
        <p className="text-xs text-text-muted tracking-widest uppercase text-center">
          {SITE.tagline}
        </p>
      </div>

      {/* Product Grid */}
      <section className="pb-12">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-6">
          Products
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
