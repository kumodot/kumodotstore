import type { Product } from "@/types/index.ts";

export interface CartItem {
  product: Product;
  quantity: number;
  kustomizerCode?: string;
}

const STORAGE_KEY = "kumodot_cart_v1";

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

  add(product: Product, kustomizerCode?: string) {
    const existing = _items.find(
      (i) => i.product.id === product.id && i.kustomizerCode === kustomizerCode
    );
    if (existing) {
      _items = _items.map((i) =>
        i === existing ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      _items = [..._items, { product, quantity: 1, kustomizerCode }];
    }
    save(_items);
    notify();
  },

  updateQuantity(productId: string, kustomizerCode: string | undefined, qty: number) {
    if (qty <= 0) {
      cartStore.remove(productId, kustomizerCode);
      return;
    }
    _items = _items.map((i) =>
      i.product.id === productId && i.kustomizerCode === kustomizerCode
        ? { ...i, quantity: qty }
        : i
    );
    save(_items);
    notify();
  },

  remove(productId: string, kustomizerCode: string | undefined) {
    _items = _items.filter(
      (i) => !(i.product.id === productId && i.kustomizerCode === kustomizerCode)
    );
    save(_items);
    notify();
  },

  clear() {
    _items = [];
    save(_items);
    notify();
  },
};
