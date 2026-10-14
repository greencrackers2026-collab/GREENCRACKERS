"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { useEffect, useRef } from "react";
import { cartMrp, cartSubtotal, useCart, useHydrated } from "./cart-store";
import { QtyStepper } from "./QtyStepper";
import { CloseIcon, TrashIcon } from "@/components/ui/Icons";
import { formatINR, unitLabel } from "@/lib/format";

export function CartDrawer({
  freeShippingAbove,
  minOrderValue,
  freeDeliveryCode,
}: {
  freeShippingAbove: number;
  minOrderValue: number;
  /** When a free-delivery coupon is auto-applied, show it instead of the threshold bar. */
  freeDeliveryCode?: string | null;
}) {
  const { items, isOpen, close, setQty, remove } = useCart();
  const hydrated = useHydrated();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  const subtotal = cartSubtotal(items);
  const savings = cartMrp(items) - subtotal;
  const toFree = Math.max(0, freeShippingAbove - subtotal);

  return (
    <AnimatePresence>
      {hydrated && isOpen && (
        <>
          <m.div
            className="fixed inset-0 z-[60] bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            aria-hidden="true"
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            tabIndex={-1}
            className="glass-strong fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col shadow-2xl outline-none"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-bold">Your Cart</h2>
              <button className="btn btn-ghost !min-h-10 !px-3" onClick={close} aria-label="Close cart">
                <CloseIcon />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <p className="text-5xl" aria-hidden="true">🪔</p>
                <p className="text-white/80">Your cart is empty. Let&apos;s light it up!</p>
                <Link href="/products" className="btn btn-primary" onClick={close}>
                  Shop Crackers
                </Link>
              </div>
            ) : (
              <>
                <div className="px-5 pt-3">
                  {freeDeliveryCode ? (
                    <p className="rounded-xl bg-emerald-500/15 px-3 py-2 text-sm text-festive-green">
                      🎉 FREE delivery with <b>{freeDeliveryCode}</b>, applied automatically at checkout
                    </p>
                  ) : (
                  <div className="rounded-xl bg-white/5 px-3 py-2 text-sm">
                    {toFree > 0 ? (
                      <span>
                        Add <b className="text-gold-400">{formatINR(toFree)}</b> more for <b>FREE delivery</b>
                      </span>
                    ) : (
                      <span className="text-festive-green">You&apos;ve unlocked FREE delivery 🎉</span>
                    )}
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-400 to-saffron-500 transition-[width] duration-500"
                        style={{ width: `${Math.min(100, (subtotal / freeShippingAbove) * 100)}%` }}
                      />
                    </div>
                  </div>
                  )}
                </div>
                <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {items.map((i) => (
                    <li key={`${i.kind}-${i.id}`} className="glass flex gap-3 rounded-2xl p-3">
                      <Image
                        src={i.image}
                        alt={i.name}
                        width={72}
                        height={72}
                        className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug">{i.name}</p>
                        <p className="mt-0.5 text-sm">
                          <span className="font-bold text-gold-400">{formatINR(i.price)}</span>
                          <span className="ml-1 text-xs text-white/50">/ {unitLabel(i.unit)}</span>
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <QtyStepper
                            size="sm"
                            value={i.qty}
                            step={i.step}
                            onChange={(n) => setQty(i.kind, i.id, n)}
                            label={`Quantity of ${i.name}`}
                          />
                          <button
                            onClick={() => remove(i.kind, i.id)}
                            className="grid h-9 w-9 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
                            aria-label={`Remove ${i.name}`}
                          >
                            <TrashIcon width={16} height={16} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="space-y-2 border-t border-white/10 px-5 py-4">
                  {savings > 0 && (
                    <p className="flex justify-between text-sm text-festive-green">
                      <span>You save</span>
                      <span className="font-semibold">{formatINR(savings)}</span>
                    </p>
                  )}
                  <p className="flex justify-between text-lg font-bold">
                    <span>Subtotal</span>
                    <span>{formatINR(subtotal)}</span>
                  </p>
                  {subtotal < minOrderValue && (
                    <p className="text-xs text-saffron-400">Minimum order value is {formatINR(minOrderValue)}.</p>
                  )}
                  <Link
                    href="/checkout"
                    onClick={close}
                    className={`btn btn-primary w-full ${subtotal < minOrderValue ? "pointer-events-none opacity-50" : ""}`}
                    aria-disabled={subtotal < minOrderValue}
                  >
                    Checkout Securely
                  </Link>
                  <p className="text-center text-xs text-white/50">Coupons &amp; extra offers applied at checkout</p>
                </div>
              </>
            )}
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
