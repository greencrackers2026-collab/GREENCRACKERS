"use client";

import { AnimatePresence, m } from "framer-motion";
import { useState } from "react";
import { useCart, type CartItem } from "./cart-store";
import { CartIcon, CheckIcon } from "@/components/ui/Icons";

export function AddToCartButton({
  item,
  qty,
  disabled,
  className = "",
  label = "Add to Cart",
}: {
  item: Omit<CartItem, "qty">;
  qty?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      className={`btn btn-primary relative overflow-hidden ${className}`}
      onClick={() => {
        add(item, qty ?? item.min);
        setAdded(true);
        setTimeout(() => setAdded(false), 1400);
      }}
      aria-label={disabled ? "Out of stock" : `${label}: ${item.name}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {added ? (
          <m.span
            key="added"
            className="flex items-center gap-1.5"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
          >
            <CheckIcon width={18} height={18} /> Added
          </m.span>
        ) : (
          <m.span
            key="add"
            className="flex items-center gap-1.5"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
          >
            <CartIcon width={18} height={18} /> {disabled ? "Out of stock" : label}
          </m.span>
        )}
      </AnimatePresence>
    </button>
  );
}
