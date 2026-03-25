import emailjs from "@emailjs/browser";
import { EMAILJS } from "@/config/site.ts";
import type { CartItem } from "@/data/cartStore.ts";
import { ISO_COUNTRY_NAMES } from "@/data/shipping.ts";

export async function sendOrderConfirmationEmail({
  orderId,
  orderDate,
  items,
  total,
  shipping,
  countryCode,
  recipientName,
  email,
  phone,
  address1,
  city,
  provinceCode,
  postalCode,
}: {
  orderId: string;
  orderDate: string;
  items: CartItem[];
  total: number;
  shipping: number;
  countryCode: string;
  recipientName: string;
  email: string;
  phone?: string;
  address1?: string;
  city?: string;
  provinceCode?: string;
  postalCode?: string;
}): Promise<void> {
  const countryName = ISO_COUNTRY_NAMES[countryCode] ?? countryCode;
  const orderTotal = total + shipping;
  const shippingLine = shipping > 0 ? `CA$${shipping.toFixed(2)}` : "Free";

  const itemLines = items.map((item) => {
    const qty = item.quantity > 1 ? ` ×${item.quantity}` : "";
    const code = item.kustomizerCode ? ` [${item.kustomizerCode}]` : "";
    return `• ${item.product.name}${code}${qty} — CA$${(item.product.price * item.quantity).toFixed(2)}`;
  }).join("\n");

  const addressLines = [
    address1,
    [city, provinceCode].filter(Boolean).join(" "),
    postalCode,
    countryName,
  ].filter(Boolean).join(", ");

  await emailjs.send(
    EMAILJS.serviceId,
    EMAILJS.templateClient,
    {
      to_name: recipientName,
      to_email: email,
      order_id: orderId,
      order_date: orderDate,
      items: itemLines,
      address: addressLines,
      country: countryName,
      phone: phone || "—",
      total: `CA$${orderTotal.toFixed(2)}`,
      subtotal: `CA$${total.toFixed(2)}`,
      shipping: shippingLine,
    },
    { publicKey: EMAILJS.publicKey }
  );
}
