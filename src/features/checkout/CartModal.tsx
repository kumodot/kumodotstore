import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cartStore } from "@/data/cartStore.ts";
import { useCart } from "./useCart.ts";
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

type Step = "cart" | "shipping" | "payment";

interface CartModalProps {
  onClose: () => void;
}

export function CartModal({ onClose }: CartModalProps) {
  const { items, total } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [countryCode, setCountryCode] = useState("CA");
  const paypalRendered = useRef(false);
  const paypalContainerId = "cart-paypal-container";

  const region = getRegionForCountry(countryCode);
  const shipping = region.freeShipping ? 0 : region.rate;
  const orderTotal = total + shipping;

  const etsyUrl = items[0]?.product.etsyUrl; // fallback to first product's Etsy

  // Load PayPal SDK once
  useEffect(() => {
    if (document.getElementById("paypal-sdk")) return;
    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=CAD`;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Render PayPal buttons when on payment step
  useEffect(() => {
    if (step !== "payment" || region.etsyRedirect || paypalRendered.current) return;

    const tryRender = () => {
      if (!window.paypal || !document.getElementById(paypalContainerId)) {
        setTimeout(tryRender, 300);
        return;
      }
      paypalRendered.current = true;

      const purchaseItems = items.map((item) => ({
        name: item.kustomizerCode
          ? `${item.product.name} [${item.kustomizerCode}]`
          : item.product.name,
        unit_amount: { currency_code: "CAD", value: item.product.price.toFixed(2) },
        quantity: String(item.quantity),
      }));

      window.paypal!.Buttons({
        createOrder: (_: unknown, actions: {
          order: { create: (o: unknown) => Promise<string> }
        }) => actions.order.create({
          purchase_units: [{
            items: purchaseItems,
            amount: {
              currency_code: "CAD",
              value: orderTotal.toFixed(2),
              breakdown: {
                item_total: { currency_code: "CAD", value: total.toFixed(2) },
                shipping: { currency_code: "CAD", value: shipping.toFixed(2) },
              },
            },
          }],
        }),
        onApprove: (_: unknown, actions: {
          order: { capture: () => Promise<{ id: string }> }
        }) => actions.order.capture().then((details) => {
          cartStore.clear();
          onClose();
          alert(`Order confirmed! #${details.id}\nThank you for your purchase! 🎉`);
        }),
        onError: (err: unknown) => {
          console.error("PayPal error", err);
          alert("Payment failed. Please try again.");
        },
      }).render(`#${paypalContainerId}`);
    };

    tryRender();
  }, [step, region.etsyRedirect, items, total, shipping, orderTotal, onClose]);

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-card border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            {step !== "cart" && (
              <button
                onClick={() => { setStep(step === "payment" ? "shipping" : "cart"); paypalRendered.current = false; }}
                className="text-text-muted hover:text-text-primary transition-colors cursor-pointer text-sm"
              >←</button>
            )}
            <h2 className="text-base font-semibold text-text-primary">
              {step === "cart" ? "Your Cart" : step === "shipping" ? "Shipping" : "Payment"}
            </h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors cursor-pointer text-xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* STEP: Cart */}
          {step === "cart" && (
            <>
              {items.length === 0 ? (
                <p className="text-center text-text-muted py-10 text-sm">Your cart is empty.</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={`${item.product.id}-${item.kustomizerCode}`}
                      className="flex items-center gap-3 bg-surface rounded-xl p-3">
                      {item.product.images?.[0] && (
                        <img src={item.product.images[0]} alt={item.product.name}
                          className="w-14 h-14 rounded-lg object-cover border border-border shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{item.product.name}</p>
                        {item.kustomizerCode && (
                          <p className="text-xs font-mono text-accent truncate">{item.kustomizerCode}</p>
                        )}
                        <p className="text-sm text-text-secondary">CA${item.product.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => cartStore.updateQuantity(item.product.id, item.kustomizerCode, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-surface-elevated border border-border text-text-primary
                                     hover:bg-surface-hover transition-colors cursor-pointer flex items-center justify-center text-sm"
                        >−</button>
                        <span className="text-sm text-text-primary w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => cartStore.updateQuantity(item.product.id, item.kustomizerCode, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-surface-elevated border border-border text-text-primary
                                     hover:bg-surface-hover transition-colors cursor-pointer flex items-center justify-center text-sm"
                        >+</button>
                        <button
                          onClick={() => cartStore.remove(item.product.id, item.kustomizerCode)}
                          className="w-7 h-7 rounded-lg text-text-muted hover:text-red-400 transition-colors cursor-pointer
                                     flex items-center justify-center text-sm ml-1"
                        >✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-sm font-semibold text-text-primary">
                    <span>Subtotal</span>
                    <span>CA${total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-text-muted">Shipping calculated at next step.</p>
                  <button
                    onClick={() => setStep("shipping")}
                    className="w-full py-3 bg-accent text-[#0f0f0f] font-semibold rounded-xl
                               hover:bg-accent-hover transition-colors cursor-pointer"
                  >
                    Proceed to Shipping →
                  </button>
                </div>
              )}
            </>
          )}

          {/* STEP: Shipping */}
          {step === "shipping" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-text-muted bg-surface rounded-lg px-3 py-2">
                <span>🇨🇦</span>
                <span>Shipped from <span className="text-text-secondary font-medium">Canada</span></span>
              </div>

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

              <div className="bg-surface rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>Subtotal</span>
                  <span>CA${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Shipping ({region.name})</span>
                  <span>{region.freeShipping ? "Free" : `CA$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold text-text-primary">
                  <span>Total</span>
                  <span>CA${orderTotal.toFixed(2)}</span>
                </div>
                {region.etsyRedirect && (
                  <p className="text-xs text-amber-400 pt-1">
                    ⚠ VAT required for this destination — you'll complete your order on Etsy.
                  </p>
                )}
              </div>

              <button
                onClick={() => setStep("payment")}
                className="w-full py-3 bg-accent text-[#0f0f0f] font-semibold rounded-xl
                           hover:bg-accent-hover transition-colors cursor-pointer"
              >
                Continue to Payment →
              </button>
            </div>
          )}

          {/* STEP: Payment */}
          {step === "payment" && (
            <div className="space-y-4">
              {/* Order summary */}
              <div className="bg-surface rounded-lg p-4 space-y-2 text-sm">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.kustomizerCode}`}
                    className="flex justify-between text-text-secondary">
                    <span className="truncate mr-2">{item.product.name} ×{item.quantity}</span>
                    <span className="shrink-0">CA${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-text-secondary">
                  <span>Shipping to {ISO_COUNTRY_NAMES[countryCode] ?? countryCode}</span>
                  <span>{region.freeShipping ? "Free" : `CA$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold text-text-primary">
                  <span>Total</span>
                  <span>CA${orderTotal.toFixed(2)}</span>
                </div>
              </div>

              {region.etsyRedirect ? (
                <div className="space-y-3">
                  <p className="text-xs text-text-secondary text-center">
                    VAT is required for your destination. Complete your order on Etsy.
                  </p>
                  <a
                    href={etsyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#F1641E] text-white
                               font-semibold rounded-xl hover:bg-[#d95518] transition-colors"
                  >
                    Complete on Etsy ↗
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-text-secondary text-center">
                    Secure payment via PayPal — credit card, debit or PayPal balance.
                  </p>
                  <div id={paypalContainerId} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
