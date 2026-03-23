import { useState } from "react";
import { ColorsAdmin } from "./ColorsAdmin.tsx";
import { ProductsAdmin } from "./ProductsAdmin.tsx";
import { TemplatesAdmin } from "./TemplatesAdmin.tsx";

type Tab = "colors" | "products" | "templates";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("colors");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          <span className="text-red-500">K</span><span className="text-accent">umodot</span>{" "}
          <span className="text-text-primary">Admin</span>
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Local admin — changes stay in your browser. Export to update source files.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {(["colors", "products", "templates"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors cursor-pointer capitalize
              ${tab === t
                ? "bg-surface-card border border-b-surface-card border-border text-accent -mb-px"
                : "text-text-secondary hover:text-text-primary"
              }`}
          >
            {t === "colors" ? "Filament Colors" : t === "products" ? "Products" : "Templates"}
          </button>
        ))}
      </div>

      {tab === "colors" && <ColorsAdmin />}
      {tab === "products" && <ProductsAdmin />}
      {tab === "templates" && <TemplatesAdmin />}
    </div>
  );
}
