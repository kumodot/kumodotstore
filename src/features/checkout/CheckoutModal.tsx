import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Product } from "@/types/index.ts";
import { getRegionForCountry, getCheckoutCountries, ISO_COUNTRY_NAMES } from "@/data/shipping.ts";

const CHECKOUT_COUNTRIES = getCheckoutCountries();

const PAYPAL_CLIENT_ID = "Ac4QBVY97qPStjhNr0zVXzAf2cgQ5jvx0TkTvH9VB7xfPV0CZO73bCcR93Tvkq17SOVacBNjxWjXfTFy";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: unknown) => { render: (selector: string) => void };
    };
  }
}

interface CheckoutModalProps {
  product: Product;
  kustomizerCode?: string;
  onClose: () => void;
}

type Step = "country" | "summary" | "paying";

export function CheckoutModal({ product, kustomizerCode, onClose }: CheckoutModalProps) {
  const [step, setStep] = useState<Step>("country");
  const [countryCode, setCountryCode] = useState("CA");
  const paypalRef = useRef<HTMLDivElement>(null);
  const paypalRendered = useRef(false);

  const region = getRegionForCountry(countryCode);
  const shipping = region.freeShipping ? 0 : region.rate;
  const total = product.price + shipping;

  // Load PayPal SDK
  useEffect(() => {
    if (step !== "summary" || region.etsyRedirect) return;
    if (document.getElementById("paypal-sdk")) return;

    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=CAD`;
    script.async = true;
    document.body.appendChild(script);
  }, [step, region.etsyRedirect]);

  // Render PayPal button
  useEffect(() => {
    if (step !== "summary" || region.etsyRedirect || paypalRendered.current) return;

    const tryRender = () => {
      if (!window.paypal || !paypalRef.current) {
        setTimeout(tryRender, 300);
        return;
      }
      paypalRendered.current = true;
      window.paypal.Buttons({
        createOrder: (_data: unknown, actions: {
          order: { create: (o: unknown) => Promise<string> }
        }) => {
          return actions.order.create({
            purchase_units: [{
              description: kustomizerCode
                ? `${product.name} — Code: ${kustomizerCode}`
                : product.name,
              amount: {
                currency_code: "CAD",
                value: total.toFixed(2),
                breakdown: {
                  item_total: { currency_code: "CAD", value: product.price.toFixed(2) },
                  shipping: { currency_code: "CAD", value: shipping.toFixed(2) },
                },
              },
            }],
          });
        },
        onApprove: (_data: unknown, actions: {
          order: { capture: () => Promise<{ id: string }> }
        }) => {
          setStep("paying");
          return actions.order.capture().then((details) => {
            alert(`Order confirmed! ID: ${details.id}\nThank you for your purchase!`);
            onClose();
          });
        },
        onError: (err: unknown) => {
          console.error("PayPal error", err);
          alert("Payment failed. Please try again.");
        },
      }).render("#paypal-button-container");
    };

    tryRender();
  }, [step, region.etsyRedirect, product, shipping, total, kustomizerCode, onClose]);

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary">Checkout</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors cursor-pointer text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Product summary */}
          <div className="flex items-center gap-4">
            {product.images?.[0] && (
              <img src={product.images[0]} alt={product.name}
                className="w-16 h-16 rounded-lg object-cover border border-border" />
            )}
            <div>
              <p className="font-medium text-text-primary">{product.name}</p>
              {kustomizerCode && (
                <p className="text-xs font-mono text-accent mt-0.5">{kustomizerCode}</p>
              )}
              <p className="text-sm text-text-secondary mt-0.5">CA${product.price.toFixed(2)}</p>
            </div>
          </div>

          {/* Step: Country */}
          {step === "country" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Ship to</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm
                             text-text-primary focus:border-accent focus:outline-none cursor-pointer"
                >
                  {CHECKOUT_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Preview shipping */}
              <div className="bg-surface rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between text-text-secondary">
                  <span>Shipping ({region.name})</span>
                  <span>{region.freeShipping ? "Free" : `CA$${shipping.toFixed(2)}`}</span>
                </div>
                {region.etsyRedirect && (
                  <p className="text-xs text-amber-400 mt-1">
                    ⚠ This destination requires VAT — you'll be redirected to Etsy to complete your order.
                  </p>
                )}
              </div>

              <button
                onClick={() => setStep("summary")}
                className="w-full py-3 bg-accent text-surface font-semibold rounded-xl
                           hover:bg-accent-hover transition-colors cursor-pointer"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step: Summary + PayPal or Etsy */}
          {step === "summary" && (
            <div className="space-y-4">
              {/* Order breakdown */}
              <div className="bg-surface rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>{product.name}</span>
                  <span>CA${product.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Shipping to {ISO_COUNTRY_NAMES[countryCode] ?? countryCode}</span>
                  <span>{region.freeShipping ? "Free" : `CA$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold text-text-primary">
                  <span>Total</span>
                  <span>CA${total.toFixed(2)}</span>
                </div>
              </div>

              {region.etsyRedirect ? (
                <div className="space-y-3">
                  <p className="text-xs text-text-secondary text-center">
                    VAT is required for your destination. You'll complete your order on Etsy.
                  </p>
                  <a
                    href={product.etsyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#F1641E] text-white
                               font-semibold rounded-xl hover:bg-[#d95518] transition-colors cursor-pointer"
                  >
                    Complete on Etsy ↗
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-text-secondary text-center">
                    Secure payment via PayPal — credit card, debit or PayPal balance.
                  </p>
                  <div ref={paypalRef} id="paypal-button-container" />
                </div>
              )}

              <button
                onClick={() => { setStep("country"); paypalRendered.current = false; }}
                className="w-full py-2 text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
              >
                ← Change destination
              </button>
            </div>
          )}

          {step === "paying" && (
            <div className="text-center py-6 text-text-secondary">Processing...</div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
