"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { ProductView } from "@/lib/catalog";
import { CATEGORIES } from "@/lib/constants";
import { discountPercent } from "@/lib/format";
import { ProductCard } from "./ProductCard";
import { SearchIcon } from "@/components/ui/Icons";

const SORTS = [
  { key: "popular", label: "Popular" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "discount", label: "Biggest Discount" },
] as const;

export function ShopClient({ products }: { products: ProductView[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const category = params.get("category") ?? "";
  const q = params.get("q") ?? "";
  const sort = params.get("sort") ?? "popular";
  const greenOnly = params.get("green") === "1";

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = products.filter(
      (p) =>
        (!category || p.category === category) &&
        (!greenOnly || p.isGreen) &&
        (!needle || `${p.name} ${p.brand} ${p.shortDesc}`.toLowerCase().includes(needle)),
    );
    switch (sort) {
      case "price-asc":
        return [...out].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...out].sort((a, b) => b.price - a.price);
      case "discount":
        return [...out].sort((a, b) => discountPercent(b.mrp, b.price) - discountPercent(a.mrp, a.price));
      default:
        return [...out].sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || a.sortOrder - b.sortOrder);
    }
  }, [products, category, q, sort, greenOnly]);

  return (
    <div>
      <div className="glass sticky top-[5.8rem] z-30 -mx-4 space-y-3 rounded-none px-4 py-3 sm:mx-0 sm:rounded-2xl sm:px-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search crackers</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50" width={18} height={18} />
            <input
              type="search"
              className="input pl-10"
              placeholder="Search anar, sky shot, sparklers…"
              defaultValue={q}
              onChange={(e) => update({ q: e.target.value })}
            />
          </label>
          <label className="sm:w-56">
            <span className="sr-only">Sort products</span>
            <select className="input" value={sort} onChange={(e) => update({ sort: e.target.value === "popular" ? "" : e.target.value })}>
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by category">
          {[{ key: "", label: "All", emoji: "🎇" }, ...CATEGORIES].map((c) => (
            <button
              key={c.key || "all"}
              type="button"
              aria-pressed={category === c.key}
              onClick={() => update({ category: c.key })}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                category === c.key
                  ? "border-gold-400 bg-gold-400 text-black"
                  : "border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
              }`}
            >
              <span aria-hidden="true">{c.emoji}</span> {c.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={greenOnly}
            onClick={() => update({ green: greenOnly ? "" : "1" })}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
              greenOnly ? "border-emerald-400 bg-emerald-500 text-black" : "border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
            }`}
          >
            🌿 Green only
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm text-white/60" role="status">
        {list.length} product{list.length === 1 ? "" : "s"}
      </p>
      {list.length === 0 ? (
        <div className="glass mt-4 rounded-2xl p-10 text-center text-white/70">No crackers match your search. Try another keyword.</div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p, i) => (
            <ProductCard key={p.id} p={p} priority={i < 2} />
          ))}
        </div>
      )}
    </div>
  );
}
