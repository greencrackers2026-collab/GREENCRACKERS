import { Link, useSearchParams } from "react-router";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { must, useLoad } from "@/lib/useLoad";
import { categoryLabel, PLACEHOLDER_IMAGE } from "@/lib/constants";
import { discountPercent, formatINR } from "@/lib/format";
import type { Product, ProductCost } from "@/lib/types";
import { PageTitle } from "@/components/admin/ui";
import { ActionButton, LoadState } from "@/components/admin/FormBits";

export type ProductWithCost = Product & { product_costs: Pick<ProductCost, "cost_price" | "price_note"> | null };

/** product_costs is one-to-one; normalise in case PostgREST returns it as a list. */
export const costOf = (p: { product_costs: unknown }) =>
  (Array.isArray(p.product_costs) ? p.product_costs[0] : p.product_costs) as ProductWithCost["product_costs"];

export function AdminProducts() {
  const [sp] = useSearchParams();
  const store = useStore();
  const { data, error, reload } = useLoad(
    async () =>
      must(await supabase.from("products").select("*, product_costs(cost_price, price_note)").order("sort_order").order("created_at")) as ProductWithCost[],
    [],
  );

  return (
    <>
      <title>Products · Admin</title>
      <PageTitle title={`Products (${data?.length ?? "…"})`}>
        <Link to="/admin/products/new" className="btn btn-primary text-sm">
          + Add product
        </Link>
      </PageTitle>
      {sp.get("saved") && (
        <p className="mb-4 rounded-xl bg-emerald-500/15 p-3 text-sm text-emerald-200" role="status">
          ✓ Product saved. The storefront has been updated.
        </p>
      )}
      {!data ? (
        <LoadState error={error} onRetry={reload} />
      ) : (
        <>
        <div className="space-y-3 md:hidden">
          {data.map((p) => {
            const cost = costOf(p)?.cost_price ?? 0;
            return (
              <article key={p.id} className={`glass flex gap-3 rounded-2xl p-3 ${p.is_visible ? "" : "opacity-60"}`}>
                <img src={p.images[0] ?? PLACEHOLDER_IMAGE} alt="" width={64} height={64} loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/products/${p.id}`} className="block truncate font-medium hover:underline">
                    {p.name}
                  </Link>
                  <p className="truncate text-xs text-white/55">
                    {p.brand} · {categoryLabel(p.category)}
                  </p>
                  <p className="mt-1 text-sm">
                    <b>{formatINR(p.price)}</b> <span className="text-white/50 line-through">{formatINR(p.mrp)}</span>
                    {cost > 0 ? (
                      <span className={`ml-2 text-xs font-semibold ${p.price - cost >= 0 ? "text-festive-green" : "text-red-300"}`}>
                        {p.price - cost >= 0 ? "+" : "−"}
                        {formatINR(Math.abs(p.price - cost))}
                      </span>
                    ) : (
                      <span className="ml-2 text-xs text-saffron-400">cost not set</span>
                    )}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-xs ${p.stock < 25 ? "text-saffron-400" : "text-white/60"}`}>Stock {p.stock}</span>
                    <ActionButton
                      className={`badge ml-auto cursor-pointer ${p.is_visible ? "bg-emerald-700 text-white" : "bg-white/15"}`}
                      onClick={async () => {
                        must(await supabase.from("products").update({ is_visible: !p.is_visible }).eq("id", p.id));
                        await Promise.all([reload(), store.reload()]);
                      }}
                    >
                      {p.is_visible ? "Visible" : "Hidden"}
                    </ActionButton>
                    <Link to={`/admin/products/${p.id}`} className="btn btn-ghost !min-h-8 !px-3 !py-1 text-xs">
                      Edit
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <div className="glass hidden overflow-x-auto rounded-2xl md:block">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="bg-white/5 text-white/60">
              <tr>
                <th className="p-3 font-medium">Product</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Price / MRP</th>
                <th className="p-3 font-medium">Cost / Profit per unit</th>
                <th className="p-3 font-medium">Stock</th>
                <th className="p-3 font-medium">Visible</th>
                <th className="p-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {data.map((p) => {
                const c = costOf(p);
                const cost = c?.cost_price ?? 0;
                return (
                  <tr key={p.id} className={p.is_visible ? "" : "opacity-60"}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images[0] ?? PLACEHOLDER_IMAGE} alt="" width={48} height={48} loading="lazy" className="h-12 w-12 rounded-lg object-cover" />
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-white/55">
                            {p.brand} · per {p.unit}
                            {p.is_best_seller && " · ★ Best seller"}
                            {p.is_green && " · 🌿"}
                          </p>
                          {c?.price_note && <p className="text-xs text-saffron-400">Note: {c.price_note}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{categoryLabel(p.category)}</td>
                    <td className="p-3">
                      <b>{formatINR(p.price)}</b> <span className="text-white/50 line-through">{formatINR(p.mrp)}</span>
                      <span className="block text-xs text-festive-green">{discountPercent(p.mrp, p.price)}% off</span>
                    </td>
                    <td className="p-3">
                      {cost > 0 ? (
                        <>
                          {formatINR(cost)}
                          <span className={`block text-xs font-semibold ${p.price - cost >= 0 ? "text-festive-green" : "text-red-300"}`}>
                            {p.price - cost >= 0 ? "+" : "−"}
                            {formatINR(Math.abs(p.price - cost))} ({(((p.price - cost) / p.price) * 100).toFixed(0)}%)
                          </span>
                        </>
                      ) : (
                        <Link to={`/admin/products/${p.id}`} className="text-xs text-saffron-400 underline">
                          Set cost
                        </Link>
                      )}
                    </td>
                    <td className={`p-3 ${p.stock < 25 ? "text-saffron-400" : ""}`}>{p.stock}</td>
                    <td className="p-3">
                      <ActionButton
                        className={`badge cursor-pointer ${p.is_visible ? "bg-emerald-700 text-white" : "bg-white/15"}`}
                        onClick={async () => {
                          must(await supabase.from("products").update({ is_visible: !p.is_visible }).eq("id", p.id));
                          await Promise.all([reload(), store.reload()]);
                        }}
                      >
                        {p.is_visible ? "Visible" : "Hidden"}
                      </ActionButton>
                    </td>
                    <td className="p-3 text-right">
                      <Link to={`/admin/products/${p.id}`} className="btn btn-ghost !min-h-9 !py-1 text-sm">
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </>
  );
}
