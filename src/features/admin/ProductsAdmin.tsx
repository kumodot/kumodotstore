import { useState } from "react";
import { PRODUCTS } from "@/data/products.ts";
import { CASE_MODELS } from "@/data/caseModels.ts";
import type { Product } from "@/types/index.ts";
import { exportProductsTs } from "./exportUtils.ts";

const PROMOTION_VARIANTS = ["new", "sale", "popular", "limited"] as const;

const EMPTY_PRODUCT: Omit<Product, "id" | "slug"> = {
  sortOrder: 99,
  name: "",
  shortDescription: "",
  price: 0,
  currency: "CAD",
  categories: [],
  images: [],
  etsyUrl: "",
  kustomizerModelId: "",
  inStock: true,
};

function ProductRow({
  product,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <tr className="border-b border-border hover:bg-surface-hover transition-colors">
      <td className="py-3 px-3 text-center">
        <div className="flex flex-col gap-0.5 items-center">
          <button
            onClick={() => onMoveUp(product.id)}
            disabled={isFirst}
            className="text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer disabled:cursor-default text-xs leading-none"
          >▲</button>
          <span className="text-xs text-text-muted font-mono">{product.sortOrder ?? "—"}</span>
          <button
            onClick={() => onMoveDown(product.id)}
            disabled={isLast}
            className="text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer disabled:cursor-default text-xs leading-none"
          >▼</button>
        </div>
      </td>
      <td className="py-3 px-3">
        <div className="text-sm font-medium text-text-primary">{product.name}</div>
        <div className="text-xs text-text-muted font-mono">{product.id}</div>
      </td>
      <td className="py-3 px-3 text-sm text-text-secondary">
        {product.price > 0 ? `CA$${product.price}` : <span className="text-text-muted italic">Coming soon</span>}
      </td>
      <td className="py-3 px-3">
        <div className="flex flex-wrap gap-1">
          {product.categories?.map((c) => (
            <span key={c} className="text-xs px-1.5 py-0.5 bg-surface-elevated rounded font-mono text-text-secondary">{c}</span>
          ))}
        </div>
      </td>
      <td className="py-3 px-3 text-xs text-text-muted">
        {product.images?.length ?? 0} img{(product.images?.length ?? 0) !== 1 ? "s" : ""}
        {product.kustomizerModelId && (
          <span className="ml-2 text-accent">⚙ kustomizer</span>
        )}
      </td>
      <td className="py-3 px-3">
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${product.inStock ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {product.inStock ? "In Stock" : "Out of Stock"}
        </span>
      </td>
      <td className="py-3 px-3">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(product)}
            className="text-xs px-3 py-1 bg-surface-elevated border border-border
                       text-text-secondary rounded hover:bg-surface-hover transition-colors cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm(`Remove product "${product.name}"?`)) onRemove(product.id);
            }}
            className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors cursor-pointer"
          >
            Remove
          </button>
        </div>
      </td>
    </tr>
  );
}

interface ProductFormProps {
  initial: Product | null;
  onSave: (p: Product) => void;
  onCancel: () => void;
  existingIds: string[];
}

function ProductForm({ initial, onSave, onCancel, existingIds }: ProductFormProps) {
  const isNew = !initial;
  const [form, setForm] = useState<Product>(
    initial ?? { id: "", slug: "", ...EMPTY_PRODUCT }
  );
  const [categoriesInput, setCategoriesInput] = useState(
    initial?.categories?.join(", ") ?? ""
  );
  const [imagesInput, setImagesInput] = useState(
    initial?.images?.join("\n") ?? ""
  );
  const [hasKustomizer, setHasKustomizer] = useState(!!initial?.kustomizerModelId);
  const [kustomizerModel, setKustomizerModel] = useState(
    initial?.kustomizerModelId ?? CASE_MODELS[0].id
  );
  const [hasPromo, setHasPromo] = useState(!!initial?.promotion);
  const [promoLabel, setPromoLabel] = useState(initial?.promotion?.label ?? "NEW");
  const [promoVariant, setPromoVariant] = useState<typeof PROMOTION_VARIANTS[number]>(
    initial?.promotion?.variant ?? "new"
  );
  const [error, setError] = useState("");

  const set = (key: keyof Product, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    setError("");
    const id = form.id.trim().toLowerCase().replace(/\s+/g, "-");
    if (!id) { setError("ID is required"); return; }
    if (isNew && existingIds.includes(id)) { setError(`ID "${id}" already exists`); return; }
    if (!form.name.trim()) { setError("Name is required"); return; }

    const categories = categoriesInput.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    const images = imagesInput.split("\n").map((s) => s.trim()).filter(Boolean);
    const promotion = hasPromo ? { label: promoLabel, variant: promoVariant } : undefined;
    const kustomizerModelId = hasKustomizer ? kustomizerModel : undefined;

    onSave({ ...form, id, slug: id, categories, images, promotion, kustomizerModelId });
  };

  const inputCls = "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none";

  return (
    <div className="bg-surface-card border border-border rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-text-primary">
        {isNew ? "Add New Product" : `Edit: ${initial?.name}`}
      </h3>
      {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-secondary mb-1">ID (slug) *</label>
          <input
            type="text"
            value={form.id}
            onChange={(e) => { set("id", e.target.value); set("slug", e.target.value); }}
            placeholder="pokz-koii"
            disabled={!isNew}
            className={`${inputCls} font-mono ${!isNew ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Name *</label>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="POKZ-KOII" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-text-secondary mb-1">Short Description</label>
          <textarea
            value={form.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
            rows={2}
            placeholder="One or two sentences about the product."
            className={`${inputCls} resize-none`}
          />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Price</label>
          <input type="number" value={form.price} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} min={0} step={0.01} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Currency</label>
          <input type="text" value={form.currency} onChange={(e) => set("currency", e.target.value)} placeholder="CAD" className={`${inputCls} w-24`} />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Sort Order</label>
          <input type="number" value={form.sortOrder ?? ""} onChange={(e) => set("sortOrder", parseInt(e.target.value) || undefined)} min={1} className={`${inputCls} w-24`} />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Categories (comma separated)</label>
          <input
            type="text"
            value={categoriesInput}
            onChange={(e) => setCategoriesInput(e.target.value)}
            placeholder="PO, EP-133"
            className={inputCls}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-text-secondary mb-1">Etsy URL</label>
          <input type="text" value={form.etsyUrl ?? ""} onChange={(e) => set("etsyUrl", e.target.value)} placeholder="https://www.etsy.com/ca/listing/..." className={inputCls} />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <label className="text-xs text-text-secondary">Kustomizer</label>
            <button
              onClick={() => setHasKustomizer((v) => !v)}
              className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${
                hasKustomizer ? "bg-accent/20 text-accent" : "bg-surface-elevated text-text-muted"
              }`}
            >
              {hasKustomizer ? "On" : "Off"}
            </button>
          </div>
          {hasKustomizer && (
            <select
              value={kustomizerModel}
              onChange={(e) => setKustomizerModel(e.target.value)}
              className={`${inputCls} w-48`}
            >
              {CASE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.id})</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Stock</label>
          <button
            onClick={() => set("inStock", !form.inStock)}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              form.inStock ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
            }`}
          >
            {form.inStock ? "In Stock" : "Out of Stock"}
          </button>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-text-secondary mb-1">
            Images (one path per line)
          </label>
          <textarea
            value={imagesInput}
            onChange={(e) => setImagesInput(e.target.value)}
            rows={3}
            placeholder={"/images/products/pokz-koii-01.jpg\n/images/products/pokz-koii-02.jpg"}
            className={`${inputCls} resize-none font-mono text-xs`}
          />
        </div>
        <div className="sm:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <label className="text-xs text-text-secondary">Promotion badge</label>
            <button
              onClick={() => setHasPromo((v) => !v)}
              className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${
                hasPromo ? "bg-accent/20 text-accent" : "bg-surface-elevated text-text-muted"
              }`}
            >
              {hasPromo ? "On" : "Off"}
            </button>
          </div>
          {hasPromo && (
            <div className="flex gap-3">
              <input
                type="text"
                value={promoLabel}
                onChange={(e) => setPromoLabel(e.target.value)}
                placeholder="NEW 2026"
                className={`${inputCls} w-36`}
              />
              <select
                value={promoVariant}
                onChange={(e) => setPromoVariant(e.target.value as typeof PROMOTION_VARIANTS[number])}
                className={`${inputCls} w-36`}
              >
                {PROMOTION_VARIANTS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-accent text-surface font-medium rounded-lg text-sm hover:bg-accent-hover transition-colors cursor-pointer"
        >
          {isNew ? "Add Product" : "Save Changes"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-surface-elevated border border-border text-text-secondary rounded-lg text-sm hover:bg-surface-hover transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>(() =>
    [...PRODUCTS].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
  );
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);

  const handleSave = (updated: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setEditing(null);
  };

  const handleAdd = (newProduct: Product) => {
    setProducts((prev) => [...prev, newProduct]);
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleMoveUp = (id: string) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const aOrder = next[idx - 1].sortOrder ?? idx;
      const bOrder = next[idx].sortOrder ?? idx + 1;
      next[idx - 1] = { ...next[idx - 1], sortOrder: bOrder };
      next[idx] = { ...next[idx], sortOrder: aOrder };
      return next.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
    });
  };

  const handleMoveDown = (id: string) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      const aOrder = next[idx].sortOrder ?? idx + 1;
      const bOrder = next[idx + 1].sortOrder ?? idx + 2;
      next[idx] = { ...next[idx], sortOrder: bOrder };
      next[idx + 1] = { ...next[idx + 1], sortOrder: aOrder };
      return next.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
    });
  };

  const existingIds = products.map((p) => p.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">{products.length} products</p>
        <button
          onClick={() => exportProductsTs(products)}
          className="text-sm px-4 py-2 bg-accent text-surface font-medium rounded-lg
                     hover:bg-accent-hover transition-colors cursor-pointer"
        >
          Export products.ts ↓
        </button>
      </div>

      <div className="bg-surface-card border border-border rounded-xl overflow-hidden mb-4 overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-3">Order</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-3">Product</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-3">Price</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-3">Categories</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-3">Media</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-3">Stock</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => (
              editing?.id === product.id ? (
                <tr key={product.id}>
                  <td colSpan={7} className="p-3">
                    <ProductForm
                      initial={editing}
                      onSave={handleSave}
                      onCancel={() => setEditing(null)}
                      existingIds={existingIds}
                    />
                  </td>
                </tr>
              ) : (
                <ProductRow
                  key={product.id}
                  product={product}
                  onEdit={setEditing}
                  onRemove={handleRemove}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  isFirst={idx === 0}
                  isLast={idx === products.length - 1}
                />
              )
            ))}
          </tbody>
        </table>
      </div>

      {adding ? (
        <ProductForm
          initial={null}
          onSave={handleAdd}
          onCancel={() => setAdding(false)}
          existingIds={existingIds}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="px-4 py-2 bg-surface-card border border-border text-text-secondary
                     rounded-lg text-sm hover:bg-surface-hover hover:text-text-primary
                     transition-colors cursor-pointer"
        >
          + Add New Product
        </button>
      )}

      <div className="mt-6 p-4 bg-surface-card border border-border rounded-xl">
        <p className="text-xs text-text-muted">
          <span className="text-text-secondary font-medium">How to use:</span> Edit products here,
          then click <strong>Export products.ts</strong> — it downloads the file ready to replace{" "}
          <code className="font-mono">src/data/products.ts</code>. Then use <code className="font-mono">/product-push</code> to deploy.
        </p>
      </div>
    </div>
  );
}
