import { STORE_MODE, type StoreMode } from "@/data/storeMode.ts";
import { exportStoreModeTs } from "./exportUtils.ts";
import { usePersistedState } from "./usePersistedState.ts";

function Toggle({ label, hint, checked, onChange }: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface
                      hover:bg-surface-hover transition-colors cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-current shrink-0 cursor-pointer"
      />
      <span>
        <span className="block text-sm font-medium text-text-primary">{label}</span>
        <span className="block text-xs text-text-muted mt-0.5">{hint}</span>
      </span>
    </label>
  );
}

export function StoreModeAdmin() {
  const [mode, setMode] = usePersistedState<StoreMode>("storeMode", () => STORE_MODE);

  const set = <K extends keyof StoreMode>(key: K, value: StoreMode[K]) =>
    setMode((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="text-sm text-amber-200 font-medium">These toggles are a draft until you publish.</p>
        <p className="text-xs text-amber-200/70 mt-1">
          Export <code className="font-mono">storeMode.ts</code> over{" "}
          <code className="font-mono">src/data/storeMode.ts</code>, then run{" "}
          <code className="font-mono">push-store-mode.bat</code> to make it live for everyone.
        </p>
      </div>

      <Toggle
        label="Cart & checkout enabled"
        hint="Off: cart is hidden everywhere and products link to their Etsy listing instead."
        checked={mode.cartEnabled}
        onChange={(v) => set("cartEnabled", v)}
      />

      <Toggle
        label="Show prices"
        hint="Off: prices show as CA$••• across the store. Note: buyers still see the real price on Etsy."
        checked={mode.showPrices}
        onChange={(v) => set("showPrices", v)}
      />

      <Toggle
        label="Show top notice bar"
        hint="A thin banner above the navbar pointing buyers to Etsy."
        checked={mode.showBanner}
        onChange={(v) => set("showBanner", v)}
      />

      {mode.showBanner && (
        <div className="p-4 rounded-xl border border-border bg-surface">
          <label className="block text-sm font-medium text-text-primary mb-2">Notice text</label>
          <input
            type="text"
            value={mode.bannerText}
            onChange={(e) => set("bannerText", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border
                       text-text-primary text-sm focus:outline-none focus:border-accent"
          />
          <p className="text-xs text-text-muted mt-2">
            An "Visit our Etsy shop ↗" link is appended automatically.
          </p>
        </div>
      )}

      <button
        onClick={() => exportStoreModeTs(mode)}
        className="w-full py-3 bg-accent text-[#0f0f0f] font-semibold rounded-xl
                   hover:bg-accent-hover transition-colors cursor-pointer"
      >
        Export storeMode.ts
      </button>
    </div>
  );
}
