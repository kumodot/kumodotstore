import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { cartStore } from "@/data/cartStore.ts";
import { useCart } from "./useCart.ts";
import { getRegionForCountry, getCheckoutCountriesGrouped, ISO_COUNTRY_NAMES, type CheckoutCountry } from "@/data/shipping.ts";
import { notifyShippingTelegram } from "@/utils/telegramNotify.ts";
import { printOrderSlip } from "@/utils/orderSlip.ts";

const CHECKOUT_COUNTRIES_GROUPED = getCheckoutCountriesGrouped();

const SHIPPING_STORAGE_KEY = "kumodot_shipping_v1";

function loadSavedShipping() {
  try {
    const raw = localStorage.getItem(SHIPPING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveShipping(data: {
  recipientName: string; email: string; address1: string;
  city: string; provinceCode: string; postalCode: string;
  phone: string; countryCode: string;
}) {
  localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(data));
}

function CountryOption({ c, selected, onSelect, variant }: {
  c: CheckoutCountry;
  selected: boolean;
  onSelect: () => void;
  variant: "direct" | "vat";
}) {
  if (!c.enabled) {
    return (
      <div className="px-3 py-2 flex items-center justify-between gap-2 opacity-50 cursor-not-allowed select-none">
        <span className="text-sm text-text-muted">{c.name}</span>
        {c.disabledMessage && (
          <span className="text-xs text-text-muted italic shrink-0">{c.disabledMessage}</span>
        )}
      </div>
    );
  }
  if (variant === "vat") {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors
          ${selected ? "bg-amber-500/10 text-amber-400" : "text-amber-400/70 hover:bg-amber-500/10 hover:text-amber-400"}`}
      >
        {c.name}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors
        ${selected ? "bg-accent/10 text-accent" : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"}`}
    >
      {c.name}
    </button>
  );
}

function CountrySelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const { direct, vat } = CHECKOUT_COUNTRIES_GROUPED;
  const currentName = ISO_COUNTRY_NAMES[value] ?? value;
  const isVat = vat.some((c) => c.code === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm
                   text-left flex items-center justify-between gap-2 cursor-pointer
                   focus:border-accent focus:outline-none hover:border-border-light transition-colors"
      >
        <span className={isVat ? "text-amber-400" : "text-text-primary"}>{currentName}</span>
        <span className="flex items-center gap-1.5 shrink-0">
          {isVat && <span className="text-xs text-amber-400">⚠ VAT</span>}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`text-text-muted transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 w-full mt-1 bg-surface-card border border-border rounded-xl shadow-2xl max-h-64 overflow-y-auto">
            <div className="px-3 pt-2 pb-1">
              <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Direct Payment</p>
            </div>
            {direct.map((c) => (
              <CountryOption key={c.code} c={c} selected={value === c.code} onSelect={() => { onChange(c.code); setOpen(false); }} variant="direct" />
            ))}
            <div className="border-t border-border mx-3 my-1" />
            <div className="px-3 pb-1">
              <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">⚠ VAT Required — Order via Etsy</p>
            </div>
            {vat.map((c) => (
              <CountryOption key={c.code} c={c} selected={value === c.code} onSelect={() => { onChange(c.code); setOpen(false); }} variant="vat" />
            ))}
            <div className="h-1" />
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-text-secondary mb-1.5">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;

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

function customizeLink(
  product: import("@/types/index.ts").Product,
  lineId: string,
  kustomizerCode?: string
): string | null {
  const code = kustomizerCode ? `&code=${encodeURIComponent(kustomizerCode)}` : "";
  if (product.kustomizerModelId)
    return `/kustomize/${product.kustomizerModelId}?product=${product.id}&editLineId=${lineId}${code}`;
  if (product.variationConfigId)
    return `/configure/${product.variationConfigId}?product=${product.id}&editLineId=${lineId}${code}`;
  return null;
}

export function CartModal({ onClose }: CartModalProps) {
  const { items, total } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const saved = loadSavedShipping();
  const [countryCode, setCountryCode] = useState(saved?.countryCode ?? "CA");
  const [recipientName, setRecipientName] = useState(saved?.recipientName ?? "");
  const [email, setEmail] = useState(saved?.email ?? "");
  const [address1, setAddress1] = useState(saved?.address1 ?? "");
  const [city, setCity] = useState(saved?.city ?? "");
  const [provinceCode, setProvinceCode] = useState(saved?.provinceCode ?? "");
  const [postalCode, setPostalCode] = useState(saved?.postalCode ?? "");
  const [phone, setPhone] = useState(saved?.phone ?? "");
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const paypalRendered = useRef(false);
  const paypalContainerId = "cart-paypal-container";

  const region = getRegionForCountry(countryCode);
  const requiresPhone = region.requirements?.includes("phone") ?? false;
  const shipping = region.freeShipping ? 0 : region.rate;
  const orderTotal = total + shipping;

  const etsyUrl = items[0]?.product.etsyUrl;

  const canProceedToPayment =
    recipientName.trim() &&
    email.trim() &&
    address1.trim() &&
    city.trim() &&
    postalCode.trim() &&
    (!requiresPhone || phone.trim());

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
            description: phone ? `Phone: ${phone}` : undefined,
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
          const orderDate = new Date().toLocaleDateString("en-CA", {
            timeZone: "America/Toronto", day: "numeric", month: "short", year: "numeric",
          });
          const slipParams = {
            orderId: details.id,
            orderDate,
            items,
            total,
            shipping,
            countryCode,
            phone,
            recipientName,
            address1,
            city,
            provinceCode,
            postalCode,
            paymentMethod: "PayPal",
            isGift,
            giftMessage: isGift ? giftMessage : undefined,
            giftFrom: isGift ? recipientName : undefined,
          };
          // Backend (Apps Script) — primary
          const backendPayload = {
            secret: import.meta.env.VITE_BACKEND_SECRET,
            ...slipParams,
            email,
            items: items.map((i) => ({
              name: i.product.name,
              code: i.kustomizerCode ?? "",
              quantity: i.quantity,
              price: i.product.price,
            })),
          };
          fetch("https://script.google.com/macros/s/AKfycbwlnF_PHS1DUziarwkUyMzPkpjC0mvwj2rzYD0fmZPM4NEGvwEHPpCgYTHEMeVRAhcJ/exec", {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(backendPayload),
          }).catch(() => {});
          saveShipping({ recipientName, email, address1, city, provinceCode, postalCode, phone, countryCode });
          cartStore.clear();
          onClose();
          printOrderSlip(slipParams);
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
                  {items.map((item) => {
                    const custLink = customizeLink(item.product, item.lineId, item.kustomizerCode);
                    return (
                      <div key={item.lineId}
                        className="flex items-start gap-3 bg-surface rounded-xl p-3">
                        {item.product.images?.[0] && (
                          <img src={item.product.images[0]} alt={item.product.name}
                            className="w-14 h-14 rounded-lg object-cover border border-border shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{item.product.name}</p>
                          {item.kustomizerCode && (
                            <p className="text-xs font-mono text-accent truncate leading-tight">{item.kustomizerCode}</p>
                          )}
                          <p className="text-sm text-text-secondary">CA${item.product.price.toFixed(2)}</p>
                          {custLink && (
                            item.kustomizerCode ? (
                              <Link to={custLink} onClick={onClose}
                                className="inline-block mt-1 text-xs text-accent hover:opacity-70 transition-opacity underline underline-offset-2">
                                ✏ Re-customize
                              </Link>
                            ) : (
                              <Link to={custLink} onClick={onClose}
                                className="inline-block mt-1 text-xs text-red-500 hover:text-red-400 transition-colors underline underline-offset-2 font-semibold">
                                ✏ Customize
                              </Link>
                            )
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => cartStore.updateQuantity(item.lineId, item.quantity - 1)}
                              className="w-6 h-6 rounded bg-surface-elevated border border-border text-text-primary
                                         hover:bg-surface-hover transition-colors cursor-pointer flex items-center justify-center text-xs"
                            >−</button>
                            <span className="text-sm text-text-primary w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => cartStore.updateQuantity(item.lineId, item.quantity + 1)}
                              className="w-6 h-6 rounded bg-surface-elevated border border-border text-text-primary
                                         hover:bg-surface-hover transition-colors cursor-pointer flex items-center justify-center text-xs"
                            >+</button>
                          </div>
                          <button
                            onClick={() => cartStore.removeByLineId(item.lineId)}
                            className="text-text-muted hover:text-red-400 transition-colors cursor-pointer text-xs"
                          >Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {items.length > 0 && (() => {
                const uncustomized = items.filter(
                  (i) => (i.product.kustomizerModelId || i.product.variationConfigId) && !i.kustomizerCode
                );
                return (
                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="flex justify-between text-sm font-semibold text-text-primary">
                      <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} item{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""})</span>
                      <span>CA${total.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-text-muted">Shipping calculated at next step.</p>

                    {uncustomized.length > 0 && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-1.5">
                        <p className="text-xs font-semibold text-red-400">⚠ Not customized yet:</p>
                        {uncustomized.map((i) => {
                          const link = customizeLink(i.product, i.lineId);
                          return (
                            <div key={i.lineId} className="flex items-center justify-between gap-2">
                              <span className="text-xs text-text-secondary">{i.product.name}</span>
                              {link && (
                                <Link to={link} onClick={onClose}
                                  className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2 shrink-0">
                                  Customize →
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <button
                      onClick={() => setStep("shipping")}
                      className="w-full py-3 bg-accent text-[#0f0f0f] font-semibold rounded-xl
                                 hover:bg-accent-hover transition-colors cursor-pointer"
                    >
                      Proceed to Shipping →
                    </button>
                  </div>
                );
              })()}
            </>
          )}

          {/* STEP: Shipping */}
          {step === "shipping" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-text-muted bg-surface rounded-lg px-3 py-2">
                <span>🇨🇦</span>
                <span>Shipped from <span className="text-text-secondary font-medium">Canada</span> — fill in the <span className="text-text-secondary font-medium">shipping label</span> details below</span>
              </div>

              <Field label="Full name" required>
                <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Jane Smith" className={inputCls} />
              </Field>

              <Field label="Email" required>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com" className={inputCls} />
                <p className="text-xs text-text-muted mt-1">Used to send your order receipt.</p>
              </Field>

              <Field label="Ship to" required>
                <CountrySelect value={countryCode} onChange={setCountryCode} />
              </Field>

              <Field label="Address" required>
                <input type="text" value={address1} onChange={(e) => setAddress1(e.target.value)}
                  placeholder="123 Main St" className={inputCls} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="City" required>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                    placeholder="Toronto" className={inputCls} />
                </Field>
                <Field label="Province / State">
                  <input type="text" value={provinceCode} onChange={(e) => setProvinceCode(e.target.value)}
                    placeholder="ON" className={inputCls} />
                </Field>
              </div>

              <Field label="Postal / ZIP code" required>
                <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="M5V 1A1" className={inputCls} />
              </Field>

              {requiresPhone && (
                <Field label="Phone number" required>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 416 555 0100" className={inputCls} />
                  <p className="text-xs text-text-muted mt-1">Include country code. Required by carriers for this destination.</p>
                </Field>
              )}

              {/* Gift option */}
              <div className="bg-surface rounded-xl p-3 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGift}
                    onChange={(e) => setIsGift(e.target.checked)}
                    className="w-4 h-4 accent-accent cursor-pointer"
                  />
                  <span className="text-sm text-text-primary">🎁 This is a gift</span>
                </label>
                {isGift && (
                  <div>
                    <label className="block text-xs text-text-secondary mb-1.5">Gift message <span className="text-text-muted">(optional — printed on the slip)</span></label>
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Happy Birthday! Hope you enjoy it 🎉"
                      rows={2}
                      className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm
                                 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
                    />
                  </div>
                )}
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
                onClick={() => {
                  notifyShippingTelegram({ items, total, shipping, countryCode, phone, recipientName, email }).catch(() => {});
                  setStep("payment");
                }}
                disabled={!canProceedToPayment}
                className="w-full py-3 bg-accent text-[#0f0f0f] font-semibold rounded-xl
                           hover:bg-accent-hover transition-colors cursor-pointer
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Payment →
              </button>
            </div>
          )}

          {/* STEP: Payment */}
          {step === "payment" && (
            <div className="space-y-4">
              <div className="bg-surface rounded-lg p-4 space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.lineId} className="flex justify-between text-text-secondary">
                    <span className="truncate mr-2">
                      {item.product.name}
                      {item.kustomizerCode && <span className="font-mono text-xs text-accent ml-1">[{item.kustomizerCode}]</span>}
                      {item.quantity > 1 && <span className="ml-1">×{item.quantity}</span>}
                    </span>
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
