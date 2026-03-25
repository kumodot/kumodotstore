import type { CartItem } from "@/data/cartStore.ts";
import { ISO_COUNTRY_NAMES } from "@/data/shipping.ts";

const SITE_URL = "https://store.kumodot.art";

export interface OrderSlipParams {
  orderId: string;
  orderDate: string;
  items: CartItem[];
  total: number;
  shipping: number;
  countryCode: string;
  phone?: string;
  recipientName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  provinceCode?: string;
  postalCode?: string;
  paymentMethod?: string;
  isGift?: boolean;
  giftMessage?: string;
  giftFrom?: string;
}

function formatAddress(p: OrderSlipParams): string {
  const lines = [
    p.recipientName ?? "",
    p.address1 ?? "",
    p.address2 ?? "",
    [p.city, p.provinceCode].filter(Boolean).join(" ") + (p.postalCode ? ` ${p.postalCode}` : ""),
    ISO_COUNTRY_NAMES[p.countryCode] ?? p.countryCode,
  ].filter(Boolean);
  return lines.join("<br>");
}

function dispatchDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
    day: "numeric", month: "short", year: "numeric",
  });
}

export function buildOrderSlipHtml(p: OrderSlipParams, baseUrl = SITE_URL): string {
  const orderTotal = p.total + p.shipping;
  const countryName = ISO_COUNTRY_NAMES[p.countryCode] ?? p.countryCode;
  const shippingLine = p.shipping > 0 ? `CA$${p.shipping.toFixed(2)}` : "Free";
  const itemCount = p.items.reduce((s, i) => s + i.quantity, 0);
  const hidePrice = p.isGift === true;

  const itemRows = p.items.map((item) => {
    const customization = item.kustomizerCode
      ? `<div class="item-code">Customization: <span class="mono">${item.kustomizerCode}</span></div>`
      : `<div class="item-personalization">Personalization: Not requested on this item.</div>`;
    const img = item.product.images?.[0]
      ? `<img src="${baseUrl}${item.product.images[0]}" class="item-img" />`
      : `<div class="item-img-placeholder"></div>`;
    const price = hidePrice ? "" : `<div class="item-price">${item.quantity} x CA$${item.product.price.toFixed(2)}</div>`;
    return `
      <div class="item-row">
        ${img}
        <div class="item-info">
          <div class="item-name">${item.product.name}</div>
          ${customization}
        </div>
        ${price}
      </div>`;
  }).join("");

  const totalsSection = hidePrice ? "" : `
      <div class="totals">
        <div class="totals-row"><span>Item total</span><span>CA$${p.total.toFixed(2)}</span></div>
        <div class="totals-row"><span>Shipping</span><span>${shippingLine}</span></div>
        <div class="totals-row bold"><span>Order total</span><span>CA$${orderTotal.toFixed(2)}</span></div>
      </div>`;

  const giftBanner = p.isGift ? `
  <div class="gift-banner">
    <img src="${baseUrl}/images/gift.svg" class="gift-icon" alt="Gift" />
    <div>
      <div class="gift-title">🎁 You received a gift from <strong>${p.giftFrom ?? "a friend"}</strong>!</div>
      ${p.giftMessage ? `<div class="gift-message">"${p.giftMessage}"</div>` : ""}
    </div>
  </div>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Order ${p.orderId} — Kumodot Store</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      font-size: 13px;
      color: #111;
      background: #fff;
      padding: 24px 40px;
      max-width: 720px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #111;
    }
    .header img { height: 44px; }
    .header-text h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header-text p { font-size: 12px; color: #666; margin-top: 2px; }

    /* Gift banner */
    .gift-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #fff8e1;
      border: 1.5px solid #ffd54f;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 24px;
    }
    .gift-icon { width: 32px; height: 32px; flex-shrink: 0; margin-top: 2px; }
    .gift-title { font-size: 14px; font-weight: 600; color: #111; }
    .gift-message { font-size: 13px; color: #555; margin-top: 4px; font-style: italic; }

    .body {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 32px;
      margin-bottom: 8px;
    }
    .meta-block { margin-bottom: 20px; }
    .meta-block strong {
      display: block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
      color: #111;
    }
    .meta-block p { line-height: 1.6; color: #333; }
    .dispatch-divider { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
    .items-header { font-size: 13px; font-weight: 600; margin-bottom: 12px; }
    .item-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-top: 1px solid #e5e5e5;
    }
    .item-img {
      width: 52px; height: 52px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #e5e5e5;
      flex-shrink: 0;
    }
    .item-img-placeholder {
      width: 52px; height: 52px;
      background: #f0f0f0;
      border-radius: 6px;
      flex-shrink: 0;
    }
    .item-info { flex: 1; }
    .item-name { font-weight: 600; margin-bottom: 3px; }
    .item-personalization { color: #666; font-size: 12px; }
    .item-code { color: #555; font-size: 11px; margin-top: 2px; }
    .mono { font-family: "SF Mono", "Fira Code", monospace; color: #c00; }
    .item-price { font-size: 13px; white-space: nowrap; padding-top: 1px; }
    .totals { margin-left: auto; width: 260px; margin-top: 8px; }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      color: #444;
      font-size: 13px;
    }
    .totals-row.bold {
      font-weight: 700;
      color: #111;
      font-size: 14px;
      border-top: 1px solid #111;
      margin-top: 6px;
      padding-top: 8px;
    }

    /* Footer */
    .footer {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #ddd;
      display: flex;
      align-items: flex-end;
      justify-content: flex-start;
      gap: 0;
    }
    .footer img.qrcode { height: 270px; width: 270px; object-fit: contain; margin-left: -40px; }
    .footer img.manual { height: 270px; object-fit: contain; margin-left: -8px; }
    .footer-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      padding-bottom: 4px;
      margin-left: auto;
    }
    .footer-logo { height: 24px; opacity: 0.5; }
    .footer-url { font-size: 11px; color: #aaa; }

    /* Gift banner compact */
    .gift-banner {
      padding: 10px 14px;
      margin-bottom: 16px;
    }

    @media print {
      body { padding: 20px 28px; }
      @page { margin: 0.5cm; }
    }
  </style>
</head>
<body>

  <div class="header">
    <img src="${baseUrl}/images/Kumodot_LOGO_RED.png" alt="K" />
    <div class="header-text">
      <h1>kumodot store</h1>
      <p>store.kumodot.art</p>
    </div>
  </div>

  ${giftBanner}

  <div class="body">
    <div class="left">
      <div class="meta-block">
        <strong>Deliver to</strong>
        <p>${formatAddress(p) || "—"}</p>
        ${p.phone ? `<p style="margin-top:4px;color:#666;">${p.phone}</p>` : ""}
      </div>
      <div class="meta-block">
        <strong>Scheduled to dispatch by</strong>
        <p>${dispatchDate()}</p>
      </div>
      <hr class="dispatch-divider" />
      <div class="meta-block">
        <strong>From</strong>
        <p>MARCELO SOUZA<br>1183 POTTERS WHEEL CRES<br>OAKVILLE ON L6M1J3<br>Canada</p>
      </div>
      <div class="meta-block">
        <strong>Order</strong>
        <p>#${p.orderId}</p>
      </div>
      <div class="meta-block">
        <strong>Order date</strong>
        <p>${p.orderDate}</p>
      </div>
      <div class="meta-block">
        <strong>Ship to</strong>
        <p>${countryName}</p>
      </div>
      ${hidePrice ? "" : `
      <div class="meta-block">
        <strong>Payment method</strong>
        <p>${p.paymentMethod ?? "PayPal"}</p>
      </div>`}
    </div>

    <div class="right">
      <div class="items-header">${itemCount} item${itemCount !== 1 ? "s" : ""}</div>
      ${itemRows}
      ${totalsSection}
    </div>
  </div>

  <div class="footer">
    <img src="${baseUrl}/images/QRCODE.png" class="qrcode" alt="QR Code" />
    <img src="${baseUrl}/images/manual.png" class="manual" alt="Manual" />
    <div class="footer-right">
      <img src="${baseUrl}/images/KUMODOT_LOGOTYPE_BLACK.png" class="footer-logo" alt="kumodot" />
      <span class="footer-url">store.kumodot.art</span>
    </div>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
}

export function printOrderSlip(p: OrderSlipParams): void {
  const html = buildOrderSlipHtml(p, window.location.origin);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

export function printTestOrderSlip(gift = false): void {
  printOrderSlip({
    orderId: "TEST-001",
    orderDate: new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Toronto",
      day: "numeric", month: "short", year: "numeric",
    }),
    items: [
      {
        lineId: "test-1",
        product: {
          id: "pokz-02", slug: "pokz-02", name: "POKZ_02 Case",
          shortDescription: "", price: 65, currency: "CAD",
          categories: ["PO"], inStock: true,
          images: ["/images/products/POKZ_KOII-01.jpg"],
        },
        quantity: 1,
        kustomizerCode: "RD_BL_GN_YL/MG_WT_BK_OR/RD_BL_GN_YL/MG_WT_BK_OR",
      },
      {
        lineId: "test-2",
        product: {
          id: "op1ogstand", slug: "op1ogstand", name: "OP-1 Stands",
          shortDescription: "", price: 55, currency: "CAD",
          categories: ["OP-1"], inStock: true,
        },
        quantity: 1,
        kustomizerCode: "combo/olive",
      },
    ],
    total: 120,
    shipping: 10,
    countryCode: "CA",
    phone: "+1 416 555 0100",
    recipientName: "Test Customer",
    address1: "123 Main St",
    city: "Toronto",
    provinceCode: "ON",
    postalCode: "M5V 1A1",
    paymentMethod: "PayPal",
    isGift: gift,
    giftMessage: gift ? "Happy Birthday! Hope you enjoy your new case 🎉" : undefined,
    giftFrom: gift ? "Marcelo" : undefined,
  });
}
