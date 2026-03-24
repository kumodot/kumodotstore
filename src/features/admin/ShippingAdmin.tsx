import { useState } from "react";
import { SHIPPING_REGIONS, ISO_COUNTRY_NAMES } from "@/data/shipping.ts";
import type { ShippingRegion } from "@/data/shipping.ts";

function exportShippingTs(regions: ShippingRegion[]): void {
  const lines = regions.map((r) => {
    const countries = JSON.stringify(r.countries);
    const extras: string[] = [];
    if (r.enabled === false) extras.push(`    enabled: false`);
    if (r.disabledMessage) extras.push(`    disabledMessage: ${JSON.stringify(r.disabledMessage)}`);
    if (r.requirements?.length) extras.push(`    requirements: ${JSON.stringify(r.requirements)}`);
    return `  {
    id: ${JSON.stringify(r.id)},
    name: ${JSON.stringify(r.name)},
    countries: ${countries},
    rate: ${r.rate},
    currency: ${JSON.stringify(r.currency)},
    etsyRedirect: ${r.etsyRedirect},
    freeShipping: ${r.freeShipping},${extras.length ? "\n" + extras.join(",\n") + "," : ""}
  }`;
  });

  const content = `export interface ShippingRegion {
  id: string;
  name: string;
  countries: string[];
  rate: number;
  currency: string;
  etsyRedirect: boolean;
  freeShipping: boolean;
  enabled?: boolean;
  disabledMessage?: string;
  requirements?: string[];
}

export const SHIPPING_REGIONS: ShippingRegion[] = [
${lines.join(",\n")},
];

export function getRegionForCountry(countryCode: string): ShippingRegion {
  const specific = SHIPPING_REGIONS.find(
    (r) => !r.countries.includes("*") && r.countries.includes(countryCode)
  );
  if (specific) return specific;
  return SHIPPING_REGIONS.find((r) => r.countries.includes("*"))!;
}
`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "shipping.ts";
  a.click();
  URL.revokeObjectURL(url);
}

function RegionRow({
  region,
  onEdit,
  onRemove,
  onToggleEnabled,
}: {
  region: ShippingRegion;
  onEdit: (r: ShippingRegion) => void;
  onRemove: (id: string) => void;
  onToggleEnabled: (id: string) => void;
}) {
  const enabled = region.enabled !== false;
  return (
    <tr className={`border-b border-border transition-colors ${enabled ? "hover:bg-surface-hover" : "opacity-60 hover:bg-surface-hover"}`}>
      <td className="py-3 px-4 text-sm">
        <span className={`font-medium ${enabled ? "text-text-primary" : "text-text-muted line-through"}`}>{region.name}</span>
        {!enabled && region.disabledMessage && (
          <span className="ml-2 text-xs text-text-muted italic">"{region.disabledMessage}"</span>
        )}
      </td>
      <td className="py-3 px-4 text-xs text-text-muted font-mono">
        {region.countries.includes("*")
          ? <span className="text-amber-400">catch-all (*)</span>
          : region.countries.map((c) => (
              <span key={c} title={ISO_COUNTRY_NAMES[c] ?? c} className="mr-1">{c}</span>
            ))
        }
      </td>
      <td className="py-3 px-4 text-sm text-text-secondary">
        <div className="flex flex-col gap-0.5">
          {region.freeShipping ? (
            <span className="text-green-400">Free</span>
          ) : region.etsyRedirect ? (
            <span className="text-amber-400">→ Etsy</span>
          ) : (
            <span>{`CA$${region.rate.toFixed(2)}`}</span>
          )}
          {region.requirements?.includes("phone") && (
            <span className="text-xs text-text-muted">📞 phone req.</span>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onToggleEnabled(region.id)}
            className={`text-xs px-3 py-1 rounded cursor-pointer transition-colors ${
              enabled
                ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                : "bg-surface-elevated text-text-muted hover:bg-surface-hover"
            }`}
          >
            {enabled ? "Enabled" : "Disabled"}
          </button>
          <button
            onClick={() => onEdit(region)}
            className="text-xs px-3 py-1 bg-surface-elevated border border-border
                       text-text-secondary rounded hover:bg-surface-hover transition-colors cursor-pointer"
          >
            Edit
          </button>
          {!region.countries.includes("*") && (
            <button
              onClick={() => { if (confirm(`Remove region "${region.name}"?`)) onRemove(region.id); }}
              className="text-xs px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors cursor-pointer"
            >
              Remove
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function RegionForm({
  initial,
  existingIds,
  onSave,
  onCancel,
}: {
  initial: ShippingRegion | null;
  existingIds: string[];
  onSave: (r: ShippingRegion) => void;
  onCancel: () => void;
}) {
  const isNew = !initial;
  const [form, setForm] = useState<ShippingRegion>(
    initial ?? {
      id: "",
      name: "",
      countries: [],
      rate: 0,
      currency: "CAD",
      etsyRedirect: false,
      freeShipping: false,
      enabled: true,
    }
  );
  const [countriesInput, setCountriesInput] = useState(
    initial?.countries.join(", ") ?? ""
  );
  const [error, setError] = useState("");

  const set = <K extends keyof ShippingRegion>(key: K, value: ShippingRegion[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    setError("");
    if (!form.name.trim()) { setError("Name is required"); return; }
    const id = form.id.trim() || form.name.toLowerCase().replace(/\s+/g, "-");
    if (isNew && existingIds.includes(id)) { setError(`ID "${id}" already exists`); return; }
    const countries = countriesInput.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (countries.length === 0) { setError("At least one country code required (or * for catch-all)"); return; }
    onSave({ ...form, id, countries });
  };

  const inputCls = "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none";

  return (
    <div className="bg-surface-card border border-border rounded-xl p-5 space-y-4 mb-4">
      <h3 className="text-sm font-semibold text-text-primary">
        {isNew ? "Add Region" : `Edit: ${initial?.name}`}
      </h3>
      {error && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-secondary mb-1">Region Name</label>
          <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Europe (EU + UK)" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Countries (comma separated ISO codes, or *)</label>
          <input type="text" value={countriesInput} onChange={(e) => setCountriesInput(e.target.value)} placeholder="DE, FR, IT, ES or *" className={`${inputCls} font-mono`} />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Shipping Rate (CAD)</label>
          <input type="number" value={form.rate} onChange={(e) => set("rate", parseFloat(e.target.value) || 0)} min={0} step={0.01} disabled={form.freeShipping || form.etsyRedirect} className={`${inputCls} w-32 disabled:opacity-50`} />
        </div>
        <div className="flex gap-4 items-end pb-1 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.freeShipping} onChange={(e) => { set("freeShipping", e.target.checked); if (e.target.checked) set("etsyRedirect", false); }} className="cursor-pointer" />
            <span className="text-sm text-text-secondary">Free shipping</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.etsyRedirect} onChange={(e) => { set("etsyRedirect", e.target.checked); if (e.target.checked) set("freeShipping", false); }} className="cursor-pointer" />
            <span className="text-sm text-text-secondary">Redirect to Etsy (VAT)</span>
          </label>
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">
            Disabled message <span className="text-text-muted">(shown in dropdown when region is disabled)</span>
          </label>
          <input
            type="text"
            value={form.disabledMessage ?? ""}
            onChange={(e) => set("disabledMessage", e.target.value || undefined)}
            placeholder="e.g. Visit our Etsy shop ↗"
            className={inputCls}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-text-secondary mb-2">Checkout requirements</label>
          <div className="flex flex-wrap gap-4">
            {(["phone"] as const).map((req) => {
              const checked = form.requirements?.includes(req) ?? false;
              return (
                <label key={req} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const reqs = form.requirements ? [...form.requirements] : [];
                      set("requirements", e.target.checked
                        ? [...reqs, req]
                        : reqs.filter((r) => r !== req) || undefined
                      );
                    }}
                    className="cursor-pointer"
                  />
                  <span className="text-sm text-text-secondary">Require phone number</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-text-muted mt-1">Fields shown to buyer at checkout when their country is in this region.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} className="px-4 py-2 bg-accent text-surface font-medium rounded-lg text-sm hover:bg-accent-hover transition-colors cursor-pointer">
          {isNew ? "Add Region" : "Save"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-surface-elevated border border-border text-text-secondary rounded-lg text-sm hover:bg-surface-hover transition-colors cursor-pointer">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function ShippingAdmin() {
  const [regions, setRegions] = useState<ShippingRegion[]>([...SHIPPING_REGIONS]);
  const [editing, setEditing] = useState<ShippingRegion | null>(null);
  const [adding, setAdding] = useState(false);

  const handleSave = (updated: ShippingRegion) => {
    setRegions((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    setEditing(null);
  };

  const handleToggleEnabled = (id: string) => {
    setRegions((prev) => prev.map((r) =>
      r.id === id ? { ...r, enabled: r.enabled === false ? true : false } : r
    ));
  };

  const handleAdd = (newR: ShippingRegion) => {
    setRegions((prev) => [...prev.slice(0, -1), newR, prev[prev.length - 1]]);
    setAdding(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">{regions.length} regions</p>
        <button
          onClick={() => exportShippingTs(regions)}
          className="text-sm px-4 py-2 bg-accent text-surface font-medium rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
        >
          Export shipping.ts ↓
        </button>
      </div>

      {adding && (
        <RegionForm
          initial={null}
          existingIds={regions.map((r) => r.id)}
          onSave={handleAdd}
          onCancel={() => setAdding(false)}
        />
      )}

      <div className="bg-surface-card border border-border rounded-xl overflow-hidden mb-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Region</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Countries</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Rate</th>
              <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((region) => (
              editing?.id === region.id ? (
                <tr key={region.id}>
                  <td colSpan={4} className="p-3">
                    <RegionForm
                      initial={editing}
                      existingIds={regions.map((r) => r.id)}
                      onSave={handleSave}
                      onCancel={() => setEditing(null)}
                    />
                  </td>
                </tr>
              ) : (
                <RegionRow
                  key={region.id}
                  region={region}
                  onEdit={setEditing}
                  onRemove={(id) => setRegions((prev) => prev.filter((r) => r.id !== id))}
                  onToggleEnabled={handleToggleEnabled}
                />
              )
            ))}
          </tbody>
        </table>
      </div>

      {!adding && (
        <button
          onClick={() => { setEditing(null); setAdding(true); }}
          className="px-4 py-2 bg-surface-card border border-border text-text-secondary rounded-lg text-sm hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
        >
          + Add Region
        </button>
      )}

      <div className="mt-6 p-4 bg-surface-card border border-border rounded-xl">
        <p className="text-xs text-text-muted">
          <span className="text-text-secondary font-medium">Note:</span> Only countries explicitly listed in regions appear in the checkout dropdown — no surprises for buyers.
          Regions marked <span className="text-amber-400">→ Etsy</span> redirect to Etsy (VAT countries).
          Use 2-letter ISO codes —{" "}
          <a href="https://www.iban.com/country-codes" target="_blank" rel="noopener noreferrer"
             className="text-accent hover:underline">full list here ↗</a>.
          Export and replace <code className="font-mono">src/data/shipping.ts</code> to apply changes.
        </p>
      </div>
    </div>
  );
}
