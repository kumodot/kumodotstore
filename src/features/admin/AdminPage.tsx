import { useState } from "react";
import { downloadTestCsv } from "@/utils/telegramNotify.ts";
import { printTestOrderSlip } from "@/utils/orderSlip.ts";

import { ColorsAdmin } from "./ColorsAdmin.tsx";
import { ProductsAdmin } from "./ProductsAdmin.tsx";
import { TemplatesAdmin } from "./TemplatesAdmin.tsx";
import { ShippingAdmin } from "./ShippingAdmin.tsx";
import { ConfiguratorsAdmin } from "./ConfiguratorsAdmin.tsx";
import { StoreModeAdmin } from "./StoreModeAdmin.tsx";
import { StudioBar } from "./StudioBar.tsx";
import { Fm1ThemesAdmin } from "./Fm1ThemesAdmin.tsx";
import { OrderDecoderAdmin } from "./OrderDecoderAdmin.tsx";
import { Fm1KnobsAdmin } from "./Fm1KnobsAdmin.tsx";

type Tab = "colors" | "products" | "templates" | "fm1themes" | "fm1knobs" | "decoder" | "shipping" | "configurators" | "storemode";

// The Telegram test button is gone: Telegram is switched off (see _backend/Code.gs, TELEGRAM_ENABLED).

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("colors");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <StudioBar />
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              <span className="text-red-500">K</span><span className="text-accent">umodot</span>{" "}
              <span className="text-text-primary">Admin</span>
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Local admin — changes stay in your browser. Export to update source files.
            </p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
            <a
              href={`${window.location.origin}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-surface-elevated
                         text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              🌐 Preview Store
            </a>
            <button
              onClick={() => printTestOrderSlip(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-surface-elevated
                         text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              🧾 Test Slip
            </button>
            <button
              onClick={() => printTestOrderSlip(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-surface-elevated
                         text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              🎁 Test Gift Slip
            </button>
            <button
              onClick={downloadTestCsv}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-surface-elevated
                         text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              📋 Test CSV
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {(["colors", "products", "templates", "fm1themes", "fm1knobs", "decoder", "shipping", "configurators", "storemode"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors cursor-pointer capitalize
              ${tab === t
                ? "bg-surface-card border border-b-surface-card border-border text-accent -mb-px"
                : "text-text-secondary hover:text-text-primary"
              }`}
          >
            {t === "colors" ? "Filament Colors"
              : t === "products" ? "Products"
              : t === "templates" ? "Pocket Operator Themes"
              : t === "fm1themes" ? "FM1 Themes"
              : t === "fm1knobs" ? "FM1 Knobs"
              : t === "decoder" ? "Order Decoder"
              : t === "shipping" ? "Shipping"
              : t === "configurators" ? "Configurators"
              : "Store Mode"}
          </button>
        ))}
      </div>

      {tab === "colors" && <ColorsAdmin />}
      {tab === "products" && <ProductsAdmin />}
      {tab === "templates" && <TemplatesAdmin />}
      {tab === "fm1themes" && <Fm1ThemesAdmin />}
      {tab === "fm1knobs" && <Fm1KnobsAdmin />}
      {tab === "decoder" && <OrderDecoderAdmin />}
      {tab === "shipping" && <ShippingAdmin />}
      {tab === "configurators" && <ConfiguratorsAdmin />}
      {tab === "storemode" && <StoreModeAdmin />}
    </div>
  );
}
