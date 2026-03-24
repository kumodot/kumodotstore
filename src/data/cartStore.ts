import type { Product } from "@/types/index.ts";

export interface CartItem {
  lineId: string;
  product: Product;
  quantity: number;
  kustomizerCode?: string;
}

const STORAGE_KEY = "kumodot_cart_v2";

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() { listeners.forEach((l) => l()); }

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function save(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

let _items: CartItem[] = load();

export const cartStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getItems(): CartItem[] { return _items; },

  getCount(): number { return _items.reduce((sum, i) => sum + i.quantity, 0); },

  getTotal(): number {
    return _items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  },

  // Always creates a new line — each item can have its own customization
  add(product: Product, kustomizerCode?: string) {
    const lineId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    _items = [..._items, { lineId, product, quantity: 1, kustomizerCode }];
    save(_items);
    notify();
  },

  updateQuantity(lineId: string, qty: number) {
    if (qty <= 0) {
      cartStore.removeByLineId(lineId);
      return;
    }
    _items = _items.map((i) => i.lineId === lineId ? { ...i, quantity: qty } : i);
    save(_items);
    notify();
  },

  updateLine(lineId: string, product: Product, kustomizerCode?: string) {
    _items = _items.map((i) =>
      i.lineId === lineId ? { ...i, product, kustomizerCode } : i
    );
    save(_items);
    notify();
  },

  removeByLineId(lineId: string) {
    _items = _items.filter((i) => i.lineId !== lineId);
    save(_items);
    notify();
  },

  clear() {
    _items = [];
    save(_items);
    notify();
  },
};
