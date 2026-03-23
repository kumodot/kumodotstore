import { Link } from "react-router-dom";
import { PRODUCTS } from "@/data/products.ts";
import { SITE } from "@/config/site.ts";
import { Carousel } from "@/components/ui/Carousel.tsx";
import type { Product } from "@/types/index.ts";

const PROMO_COLORS: Record<string, string> = {
  new: "bg-green-500",
  sale: "bg-red-500",
  popular: "bg-accent text-[#0f0f0f]",
  limited: "bg-amber-500",
};

function getImages(product: Product): string[] {
  if (product.images && product.images.length > 0) return product.images;
  if (product.imageUrl) return [product.imageUrl];
  return [];
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

        <div className="flex items-center justify-between gap-2 mt-auto">
          <span className="text-xl font-bold text-text-primary">
            ${product.price.toFixed(2)}
            <span className="text-xs font-normal text-text-muted ml-1">
              {product.currency}
            </span>
          </span>

          <div className="flex gap-2">
            {product.kustomizerModelId && (
              <Link
                to={`/kustomize/${product.kustomizerModelId}`}
                className="px-3 py-1.5 text-sm bg-accent text-[#0f0f0f] font-semibold
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
                           text-text-secondary rounded-lg hover:bg-surface-hover
                           hover:text-text-primary transition-colors"
              >
                Etsy
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StorefrontPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4 tracking-tight">
          {SITE.name}
        </h1>
        <p className="text-lg text-text-secondary max-w-md mx-auto leading-relaxed">
          {SITE.tagline}
        </p>
      </section>

      {/* Product Grid */}
      <section>
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-6">
          Products
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
