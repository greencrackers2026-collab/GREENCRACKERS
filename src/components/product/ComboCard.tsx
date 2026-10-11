import Image from "next/image";
import type { ComboView } from "@/lib/catalog";
import { discountPercent, formatINR } from "@/lib/format";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export function ComboCard({ c }: { c: ComboView }) {
  const off = discountPercent(c.mrp, c.price);
  return (
    <article className="glass glow-gold group flex flex-col overflow-hidden rounded-3xl transition duration-300 hover:-translate-y-1.5">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={c.image}
          alt={`${c.name}: crackers combo pack`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="badge bg-gradient-to-r from-gold-400 to-saffron-500 text-black">{off}% OFF</span>
          <span className="badge bg-fuchsia-600/90 text-white">COMBO +{c.extraDiscount}% extra</span>
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-display text-2xl text-white drop-shadow">{c.name}</h3>
          <p className="text-sm text-gold-300">{c.tagline}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <ul className="space-y-1 text-sm text-white/80">
          {c.items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-2">
              <span className="truncate">
                {i.brand} {i.name}
              </span>
              <span className="shrink-0 text-white/55">× {i.qty}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold text-gold-300">{formatINR(c.price)}</p>
            <p className="text-sm text-white/50">
              <span className="line-through">{formatINR(c.mrp)}</span>
              <span className="ml-2 text-festive-green">Save {formatINR(c.mrp - c.price)}</span>
            </p>
          </div>
        </div>
        <AddToCartButton
          disabled={!c.available}
          label="Add Combo"
          item={{
            kind: "COMBO",
            id: c.id,
            slug: c.slug,
            name: `${c.name} (Combo)`,
            image: c.image,
            price: c.price,
            mrp: c.mrp,
            unit: "pack",
            step: 1,
            min: 1,
          }}
          className="w-full"
        />
      </div>
    </article>
  );
}
