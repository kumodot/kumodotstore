import { useState } from "react";
import { sendTelegramTest, downloadTestCsv } from "@/utils/telegramNotify.ts";
import { printTestOrderSlip } from "@/utils/orderSlip.ts";
import { ColorsAdmin } from "./ColorsAdmin.tsx";
import { ProductsAdmin } from "./ProductsAdmin.tsx";
import { TemplatesAdmin } from "./TemplatesAdmin.tsx";
import { ShippingAdmin } from "./ShippingAdmin.tsx";
import { ConfiguratorsAdmin } from "./ConfiguratorsAdmin.tsx";

type Tab = "colors" | "products" | "templates" | "shipping" | "configurators";

function TelegramTestButton() {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");

  const handleTest = async () => {
    setState("sending");
    try {
      await sendTelegramTest();
      setState("ok");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 3000);
  };

  return (
    <button
      onClick={handleTest}
      disabled={state === "sending"}
      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer shrink-0
        ${state === "ok" ? "bg-green-500/20 text-green-400 border-green-500/30"
          : state === "error" ? "bg-red-500/20 text-red-400 border-red-500/30"
          : "bg-surface-elevated border-border text-text-secondary hover:bg-surface-hover"
        }`}
    >
      {state === "sending" ? "Sending..." : state === "ok" ? "✓ Sent!" : state === "error" ? "✗ Failed" : "🔔 Test Telegram"}
    </button>
  );
}

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("colors");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
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
          <div className="flex gap-2 shrink-0">
            <button
              onClick={printTestOrderSlip}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-surface-elevated
                         text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              🧾 Test Slip
            </button>
            <button
              onClick={downloadTestCsv}
              className="text-xs px-3 py-1.5 rounded-lg border border-border bg-surface-elevated
                         text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              📋 Test CSV
            </button>
            <TelegramTestButton />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {(["colors", "products", "templates", "shipping", "configurators"] as Tab[]).map((t) => (
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
              : t === "templates" ? "Templates"
              : t === "shipping" ? "Shipping"
              : "Configurators"}
          </button>
        ))}
      </div>

      {tab === "colors" && <ColorsAdmin />}
      {tab === "products" && <ProductsAdmin />}
      {tab === "templates" && <TemplatesAdmin />}
      {tab === "shipping" && <ShippingAdmin />}
      {tab === "configurators" && <ConfiguratorsAdmin />}
    </div>
  );
}
