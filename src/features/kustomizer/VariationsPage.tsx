import { useState, useMemo } from "react";
import { useParams, useSearchParams, Navigate, useNavigate } from "react-router-dom";
import { VARIATION_CONFIGS_BY_ID } from "@/data/variationConfigs.ts";
import { PRODUCTS } from "@/data/products.ts";
import { cartStore } from "@/data/cartStore.ts";
import type { VariationGroup } from "@/types/index.ts";

function buildOrderCode(selections: Record<string, string>): string {
  return Object.values(selections).filter(Boolean).join("/");
}

function GroupSelector({
  group,
  selected,
  onSelect,
}: {
  group: VariationGroup;
  selected: string;
  onSelect: (optionId: string) => void;
}) {
  const selectedOption = group.options.find((o) => o.id === selected);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-primary">{group.name}</label>
        {selectedOption?.priceDelta !== undefined && selectedOption.priceDelta > 0 && (
          <span className="text-xs text-accent">+CA${selectedOption.priceDelta.toFixed(2)}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {group.options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border
              ${selected === option.id
                ? "bg-accent text-[#0f0f0f] border-accent"
                : "bg-surface border-border text-text-secondary hover:border-text-secondary hover:text-text-primary"
              }`}
          >
            {option.label}
            {option.priceDelta > 0 && (
              <span className="ml-1 text-xs opacity-70">+${option.priceDelta}</span>
            )}
          </button>
        ))}
      </div>

      {/* Option image if available */}
      {selectedOption?.imageUrl && (
        <div className="mt-2">
          <img
            src={selectedOption.imageUrl}
            alt={selectedOption.label}
            className="w-full max-w-xs rounded-xl border border-border object-cover"
          />
        </div>
      )}
    </div>
  );
}

export function VariationsPage() {
  const { configId } = useParams<{ configId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const config = VARIATION_CONFIGS_BY_ID[configId ?? ""];
  const productId = searchParams.get("product");
  const editLineId = searchParams.get("editLineId");
  const editCode = searchParams.get("code");
  const product = productId ? PRODUCTS.find((p) => p.id === productId) : null;

  const [selections, setSelections] = useState<Record<string, string>>(() => {
    // Pre-fill from editCode if editing — code is "opt1Id/opt2Id/..."
    if (editCode && config) {
      const parts = editCode.split("/");
      const entries = config.groups.map((g, i) => [g.id, parts[i] ?? g.options[0]?.id ?? ""] as [string, string]);
      return Object.fromEntries(entries);
    }
    return Object.fromEntries((config?.groups ?? []).map((g) => [g.id, g.options[0]?.id ?? ""]));
  });
  const [added, setAdded] = useState(false);

  const priceDelta = useMemo(() => {
    if (!config) return 0;
    return config.groups.reduce((sum, group) => {
      const opt = group.options.find((o) => o.id === selections[group.id]);
      return sum + (opt?.priceDelta ?? 0);
    }, 0);
  }, [config, selections]);

  const allSelected = useMemo(() => {
    if (!config) return false;
    return config.groups.every((g) => !!selections[g.id]);
  }, [config, selections]);

  const orderCode = buildOrderCode(selections);

  if (!config) return <Navigate to="/" replace />;

  const handleAddToCart = () => {
    if (!product || !allSelected) return;
    const productWithDelta = { ...product, price: product.price + priceDelta };
    if (editLineId) {
      cartStore.updateLine(editLineId, productWithDelta, orderCode);
      navigate("/?openCart=1");
    } else {
      cartStore.add(productWithDelta, orderCode);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          <span className="text-red-500">K</span><span className="text-accent">ustomizer</span>
        </h1>
        <p className="text-sm text-text-secondary mt-1">{config.name}</p>
        {product && (
          <p className="text-xs text-text-muted mt-1">Configuring: {product.name}</p>
        )}
      </div>

      {/* Product reference image */}
      {product?.images?.[0] && (
        <div className="mb-6 rounded-xl overflow-hidden border border-border">
          <img src={product.images[0]} alt={product.name} className="w-full object-cover max-h-48" />
        </div>
      )}

      <div className="space-y-6">
        {config.groups.map((group) => (
          <GroupSelector
            key={group.id}
            group={group}
            selected={selections[group.id]}
            onSelect={(optionId) => setSelections((prev) => ({ ...prev, [group.id]: optionId }))}
          />
        ))}

        {/* Order code + price */}
        <div className="bg-surface-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Order Code</h2>
            {product && (
              <span className="text-lg font-bold text-text-primary">
                CA${(product.price + priceDelta).toFixed(2)}
              </span>
            )}
          </div>
          <code className="block font-mono text-sm text-accent bg-surface px-3 py-2 rounded-lg border border-border">
            {orderCode}
          </code>

          {product && (
            <button
              onClick={handleAddToCart}
              disabled={!allSelected}
              className={`w-full py-3 font-semibold rounded-xl transition-colors cursor-pointer
                flex items-center justify-center gap-2
                ${added
                  ? "bg-green-500/20 text-green-400"
                  : allSelected
                    ? "bg-accent text-[#0f0f0f] hover:bg-accent-hover"
                    : "bg-surface-elevated text-text-muted cursor-not-allowed opacity-50"
                }`}
            >
              {added ? "Added to Cart ✓" : (
                <><img src="/add-to-bag_blue.png" alt="" className="w-5 h-5 object-contain" /> {editLineId ? "Update Cart" : "Add to Cart"}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
