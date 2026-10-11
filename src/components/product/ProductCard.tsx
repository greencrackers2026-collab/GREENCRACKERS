import Image from "next/image";
import Link from "next/link";
import type { ProductView } from "@/lib/catalog";
import { categoryLabel } from "@/lib/constants";
import { discountPercent, formatINR, unitLabel } from "@/lib/format";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export function toCartItem(p: ProductView) {
  return {
    kind: "PRODUCT" as const,
    id: p.id,
    slug: p.slug,
    name: `${p.brand} ${p.name}`,
    image: p.image,
    price: p.price,
    mrp: p.mrp,
    unit: p.unit,
    step: p.qtyStep,
    min: p.minQty,
  };
}

export function ProductCard({ p, priority = false }: { p: ProductView; priority?: boolean }) {
  const off = discountPercent(p.mrp, p.price);
  const out = p.stock <= 0;
  return (
    <article className="glass group relative flex flex-col overflow-hidden rounded-3xl transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-15px_rgba(255,160,60,0.45)]">
      <Link href={`/products/${p.slug}`} className="relative block aspect-square overflow-hidden" tabIndex={-1} aria-hidden="true">
        <Image
          src={p.image}
          alt={`${p.brand} ${p.name}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={priority}
        />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {off > 0 && <span className="badge bg-gradient-to-r from-gold-400 to-saffron-500 text-black shadow">{off}% OFF</span>}
          {p.isBestSeller && <span className="badge bg-maroon-800/90 text-gold-300 ring-1 ring-gold-400/40">★ Best Seller</span>}
        </div>
        {p.isGreen && (
          <span className="badge absolute right-2 top-2 bg-emerald-700 text-white" title="Green cracker">
            🌿 Green
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-white/55">
          {p.brand} · {categoryLabel(p.category)}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">
          <Link href={`/products/${p.slug}`} className="after:absolute after:inset-0 hover:text-gold-300 focus-visible:outline-none focus-visible:after:rounded-3xl focus-visible:after:ring-2 focus-visible:after:ring-gold-400">
            {p.name}
          </Link>
        </h3>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-bold text-gold-300 sm:text-xl">{formatINR(p.price)}</span>
          {p.mrp > p.price && (
            <span className="text-sm text-white/45 line-through">
              <span className="sr-only">MRP </span>
              {formatINR(p.mrp)}
            </span>
          )}
          <span className="text-xs text-white/50">/ {unitLabel(p.unit)}</span>
        </div>
        <div className="relative z-10">
          <AddToCartButton item={toCartItem(p)} disabled={out} className="w-full !min-h-10 !py-2 text-sm" />
        </div>
      </div>
    </article>
  );
}
