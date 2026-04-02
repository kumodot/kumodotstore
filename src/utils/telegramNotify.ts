import { TELEGRAM } from "@/config/site.ts";
import type { CartItem } from "@/data/cartStore.ts";

const BACKEND_URL = "https://script.google.com/macros/s/AKfycbwbUQjeaYs8YpyLRpS4vqG4JD1g9wshOspzneff1rGrlLuxpxmSyZss2IXmTmrfcKlX/exec";

// ChitChats Advanced CSV column order (matches their official template exactly)
const CHITCHATS_HEADERS = [
  "order_id","order_store","name","address_1","address_2","city","province_code",
  "postal_code","country_code","phone","customer_email",
  "item_sku","item_description","item_quantity","item_unit_value","value_currency",
  "item_hs_code","item_steel_percentage","item_aluminum_percentage","item_copper_percentage",
  "item_weight","item_weight_unit","item_country_of_origin",
  "item_manufacturer_contact","item_manufacturer_address_1","item_manufacturer_address_2",
  "item_manufacturer_city","item_manufacturer_postal_code","item_manufacturer_province_code",
  "item_manufacturer_country_code","item_manufacturer_email","item_manufacturer_phone",
  "vat_reference","duties_paid_requested","package_contents","package_type",
  "size_x","size_y","size_z","size_unit","weight","weight_unit",
  "postage_type","signature_requested","insurance_requested","ship_date",
  "cheapest_postage_type_requested",
];

function csvRow(fields: string[]): string {
  return fields.map((v) => `"${v.replace(/"/g, '""')}"`).join(",");
}

export function buildChitChatsCsv(params: {
  orderId: string;
  items: CartItem[];
  countryCode: string;
  phone: string;
  recipientName?: string;
  email?: string;
  address1?: string;
  city?: string;
  provinceCode?: string;
  postalCode?: string;
}): string {
  const { orderId, items, countryCode, phone,
    recipientName = "", email = "", address1 = "", city = "",
    provinceCode = "", postalCode = "" } = params;

  const rows = items.map((item, idx) => {
    const isFirst = idx === 0;
    const desc = item.kustomizerCode
      ? `${item.product.name} [${item.kustomizerCode}]`
      : item.product.name;

    const fields: Record<string, string> = {
      order_id: orderId,
      order_store: "",
      name: isFirst ? recipientName : "",
      address_1: isFirst ? address1 : "",
      address_2: "",
      city: isFirst ? city : "",
      province_code: isFirst ? provinceCode : "",
      postal_code: isFirst ? postalCode : "",
      country_code: countryCode,
      phone: isFirst ? phone : "",
      customer_email: isFirst ? email : "",
      item_sku: item.product.id,
      item_description: desc,
      item_quantity: String(item.quantity),
      item_unit_value: item.product.price.toFixed(2),
      value_currency: "cad",
      item_hs_code: "4202.92.9400",
      item_steel_percentage: "", item_aluminum_percentage: "", item_copper_percentage: "",
      item_weight: "", item_weight_unit: "",
      item_country_of_origin: "CA",
      item_manufacturer_contact: "Marcelo Souza",
      item_manufacturer_address_1: "1183 Potters Wheel Cres",
      item_manufacturer_address_2: "",
      item_manufacturer_city: "Oakville",
      item_manufacturer_postal_code: "L6M1J3",
      item_manufacturer_province_code: "ON",
      item_manufacturer_country_code: "CA",
      item_manufacturer_email: "marcelo@3donline.com.br",
      item_manufacturer_phone: "",
      vat_reference: "", duties_paid_requested: "",
      package_contents: isFirst ? "merchandise" : "",
      package_type: isFirst ? "thick_envelope" : "",
      size_x: isFirst ? "9" : "", size_y: isFirst ? "10" : "", size_z: isFirst ? "1" : "", size_unit: isFirst ? "in" : "",
      weight: isFirst ? "20" : "", weight_unit: isFirst ? "g" : "",
      postage_type: "",
      signature_requested: "", insurance_requested: "",
      ship_date: isFirst ? "today" : "",
      cheapest_postage_type_requested: "",
    };

    return csvRow(CHITCHATS_HEADERS.map((h) => fields[h] ?? ""));
  });

  return [CHITCHATS_HEADERS.join(","), ...rows].join("\n");
}

function csvFilename(recipientName: string | undefined, countryCode: string): string {
  const dateStr = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).replace(/-/g, "");
  const firstName = (recipientName ?? "").trim().split(/\s+/)[0].toUpperCase().replace(/[^A-Z0-9]/g, "") || "CUSTOMER";
  return `ORDER_${dateStr}_${firstName}_${countryCode}.csv`;
}

// Pre-checkout notification — sent via backend to keep bot token server-side
export async function notifyShippingTelegram({
  items,
  total,
  shipping,
  countryCode,
  phone,
  recipientName,
  email,
}: {
  items: CartItem[];
  total: number;
  shipping: number;
  countryCode: string;
  phone: string;
  recipientName?: string;
  email?: string;
}): Promise<void> {
  fetch(BACKEND_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: import.meta.env.VITE_BACKEND_SECRET,
      action: "shipping_started",
      items: items.map((i) => ({ name: i.product.name, quantity: i.quantity, price: i.product.price })),
      total,
      shipping,
      countryCode,
      phone,
      recipientName,
      email,
    }),
  }).catch(() => {});
}

export function downloadTestCsv(): void {
  const csv = buildChitChatsCsv({
    orderId: "TEST-001",
    items: [
      {
        lineId: "test-1",
        product: { id: "pokz-02", slug: "pokz-02", name: "POKZ_02 Case", shortDescription: "", price: 65, currency: "CAD", categories: ["PO"], inStock: true },
        quantity: 1,
        kustomizerCode: "RD_BL_GN_YL/MG_WT_BK_OR/RD_BL_GN_YL/MG_WT_BK_OR",
      },
      {
        lineId: "test-2",
        product: { id: "op1ogstand", slug: "op1ogstand", name: "OP-1 Stands", shortDescription: "", price: 55, currency: "CAD", categories: ["OP-1"], inStock: true },
        quantity: 1,
        kustomizerCode: "combo/olive",
      },
    ],
    countryCode: "CA",
    phone: "+1 416 555 0100",
    recipientName: "Test Customer",
    address1: "123 Main St",
    city: "Toronto",
    provinceCode: "ON",
    postalCode: "M5V 1A1",
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = csvFilename("Test Customer", "CA");
  a.click();
  URL.revokeObjectURL(url);
}

// Admin-only: sends test message directly (local use only, bot token visible in bundle)
export async function sendTelegramTest(): Promise<void> {
  await fetch(`https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM.chatId,
      text: `✅ *Telegram connected!*\n\nKumodot Store bot is working correctly.\n_${new Date().toLocaleString("en-CA", { timeZone: "America/Toronto" })}_`,
      parse_mode: "Markdown",
    }),
  });
}
