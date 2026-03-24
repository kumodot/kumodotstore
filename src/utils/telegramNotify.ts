import { TELEGRAM } from "@/config/site.ts";
import type { CartItem } from "@/data/cartStore.ts";
import { ISO_COUNTRY_NAMES } from "@/data/shipping.ts";

async function sendMessage(text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM.chatId, text, parse_mode: "Markdown" }),
  });
}

async function sendDocument(filename: string, content: string, caption?: string): Promise<void> {
  const form = new FormData();
  form.append("chat_id", TELEGRAM.chatId);
  form.append("document", new Blob([content], { type: "text/csv" }), filename);
  if (caption) form.append("caption", caption);
  await fetch(`https://api.telegram.org/bot${TELEGRAM.botToken}/sendDocument`, {
    method: "POST",
    body: form,
  });
}

function buildChitChatsCsv(params: {
  orderId: string;
  items: CartItem[];
  countryCode: string;
  phone: string;
}): string {
  const { orderId, items, countryCode, phone } = params;
  const countryName = ISO_COUNTRY_NAMES[countryCode] ?? countryCode;

  // ChitChats Advanced CSV headers
  const headers = [
    "order_id", "recipient_name", "recipient_address1", "recipient_address2",
    "recipient_city", "recipient_province", "recipient_postal_code", "recipient_country",
    "recipient_phone", "item_description", "item_quantity", "item_value",
    "item_country_of_origin", "item_hs_code",
  ];

  const rows = items.map((item) => {
    const desc = item.kustomizerCode
      ? `${item.product.name} [${item.kustomizerCode}]`
      : item.product.name;
    return [
      orderId,
      "", // recipient_name — filled from PayPal
      "", // address1 — filled from PayPal
      "", // address2
      "", // city
      "", // province
      "", // postal
      countryName,
      phone,
      desc,
      String(item.quantity),
      item.product.price.toFixed(2),
      "CA", // country of origin
      "",   // HS code — fill manually
    ].map((v) => `"${v}"`).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export async function notifyOrderTelegram({
  orderId,
  items,
  total,
  shipping,
  countryCode,
  phone,
}: {
  orderId: string;
  items: CartItem[];
  total: number;
  shipping: number;
  countryCode: string;
  phone: string;
}): Promise<void> {
  const date = new Date().toLocaleString("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  const itemLines = items.map((item) => {
    const qty = item.quantity > 1 ? ` ×${item.quantity}` : "";
    const code = item.kustomizerCode ? `\n    Code: \`${item.kustomizerCode}\`` : "";
    return `• ${item.product.name}${qty} — CA$${(item.product.price * item.quantity).toFixed(2)}${code}`;
  }).join("\n");

  const countryName = ISO_COUNTRY_NAMES[countryCode] ?? countryCode;
  const shippingLine = shipping > 0 ? `CA$${shipping.toFixed(2)}` : "Free";

  const text = [
    `🛍 *New Order — ${orderId}*`,
    `📅 ${date}`,
    ``,
    `📦 *Items:*`,
    itemLines,
    ``,
    `🌍 Ship to: ${countryName} (${countryCode})`,
    phone ? `📞 ${phone}` : null,
    ``,
    `💰 Subtotal: CA$${total.toFixed(2)}`,
    `📮 Shipping: ${shippingLine}`,
    `💵 *Total: CA$${(total + shipping).toFixed(2)}*`,
  ].filter((l) => l !== null).join("\n");

  // Send text notification
  await sendMessage(text);

  // Send ChitChats CSV as a file
  const csv = buildChitChatsCsv({ orderId, items, countryCode, phone });
  const filename = `order-${orderId}.csv`;
  await sendDocument(filename, csv, `📋 ChitChats CSV — ${orderId}`);
}

// Send a test notification to verify the bot is working
export async function sendTelegramTest(): Promise<void> {
  await sendMessage(
    `✅ *Telegram connected!*\n\nKumodot Store bot is working correctly.\n_${new Date().toLocaleString("en-CA", { timeZone: "America/Toronto" })}_`
  );
}
