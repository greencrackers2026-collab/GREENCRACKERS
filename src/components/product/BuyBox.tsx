import { useNavigate } from "react-router";
import { useState } from "react";
import { QtyStepper } from "@/components/cart/QtyStepper";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { useCart, type CartItem } from "@/components/cart/cart-store";
import { formatINR, unitLabel } from "@/lib/format";

export function BuyBox({ item, stock, bulk }: { item: Omit<CartItem, "qty">; stock: number; bulk: boolean }) {
  const [qty, setQty] = useState(item.min);
  const add = useCart((s) => s.add);
  const close = useCart((s) => s.close);
  const navigate = useNavigate();
  const out = stock <= 0;
  const q = Math.max(qty, item.min);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <QtyStepper value={qty} onChange={(n) => setQty(Math.max(n, item.min))} min={item.min} step={item.step} max={Math.max(stock, 1)} />
        <p className="text-sm text-white/70">
          Total: <b className="text-lg text-gold-300">{formatINR(item.price * q)}</b>
        </p>
      </div>
      {bulk && (
        <div className="flex flex-wrap gap-2" aria-label="Quick bulk quantities">
          {[10, 25, 50, 100].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQty(Math.min(n, stock))}
              className={`rounded-full border px-3 py-1.5 text-sm ${qty === n ? "border-gold-400 bg-gold-400/20 text-gold-300" : "border-white/15 bg-white/5 hover:bg-white/10"}`}
            >
              {n} {unitLabel(item.unit)}s
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <AddToCartButton item={item} qty={q} disabled={out} className="w-full text-base" />
        <button
          type="button"
          disabled={out}
          className="btn btn-ghost w-full text-base"
          onClick={() => {
            add(item, q);
            close();
            navigate("/checkout");
          }}
        >
          Buy Now
        </button>
      </div>
      {!out && stock < 20 && <p className="text-sm text-saffron-400">Hurry! Only {stock} left in stock.</p>}
    </div>
  );
}
