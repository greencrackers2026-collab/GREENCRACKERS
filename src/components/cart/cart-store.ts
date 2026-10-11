"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";

export type CartItem = {
  kind: "PRODUCT" | "COMBO";
  id: string;
  slug: string;
  name: string;
  image: string;
  /** Display-only snapshot; the server re-prices everything at checkout. */
  price: number;
  mrp: number;
  unit: string;
  qty: number;
  step: number;
  min: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  lastAddedAt: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (kind: CartItem["kind"], id: string, qty: number) => void;
  remove: (kind: CartItem["kind"], id: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
};

const same = (a: Pick<CartItem, "kind" | "id">, kind: CartItem["kind"], id: string) => a.kind === kind && a.id === id;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      lastAddedAt: 0,
      add: (item, qty = item.min) =>
        set((s) => {
          const existing = s.items.find((i) => same(i, item.kind, item.id));
          const items = existing
            ? s.items.map((i) => (same(i, item.kind, item.id) ? { ...i, ...item, qty: i.qty + qty } : i))
            : [...s.items, { ...item, qty }];
          return { items, isOpen: true, lastAddedAt: Date.now() };
        }),
      setQty: (kind, id, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (same(i, kind, id) ? { ...i, qty: Math.max(0, Math.min(10000, qty)) } : i))
            .filter((i) => i.qty > 0),
        })),
      remove: (kind, id) => set((s) => ({ items: s.items.filter((i) => !same(i, kind, id)) })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "diwali-cart-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    },
  ),
);

/** Avoids hydration mismatches for values that come from localStorage. */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}

export const cartCount = (items: CartItem[]) => items.reduce((a, i) => a + (i.unit === "piece" ? 1 : i.qty), 0);
export const cartSubtotal = (items: CartItem[]) => items.reduce((a, i) => a + i.price * i.qty, 0);
export const cartMrp = (items: CartItem[]) => items.reduce((a, i) => a + i.mrp * i.qty, 0);
