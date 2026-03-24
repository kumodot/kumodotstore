import { useState, useEffect } from "react";
import { cartStore } from "@/data/cartStore.ts";
import type { CartItem } from "@/data/cartStore.ts";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => cartStore.getItems());
  const [count, setCount] = useState(() => cartStore.getCount());
  const [total, setTotal] = useState(() => cartStore.getTotal());

  useEffect(() => {
    const unsub = cartStore.subscribe(() => {
      setItems([...cartStore.getItems()]);
      setCount(cartStore.getCount());
      setTotal(cartStore.getTotal());
    });
    return () => { unsub(); };
  }, []);

  return { items, count, total };
}
