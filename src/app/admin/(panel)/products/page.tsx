import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { toProductView } from "@/lib/catalog";
import { categoryLabel } from "@/lib/constants";
import { discountPercent, formatINR } from "@/lib/format";
import { PageTitle } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/FormBits";
import { toggleProductVisibility } from "../../actions";

export const metadata = { title: "Products" };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { saved } = await searchParams;
  const rows = await prisma.product.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });

  return (
    <>
      <PageTitle title={`Products (${rows.length})`}>
        <Link href="/admin/products/new" className="btn btn-primary text-sm">
          + Add product
        </Link>
      </PageTitle>
      {saved && (
        <p className="mb-4 rounded-xl bg-emerald-500/15 p-3 text-sm text-emerald-200" role="status">
          ✓ Product saved. The storefront has been updated.
        </p>
      )}
      <div className="glass overflow-x-auto rounded-2xl">
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
            {rows.map((r) => {
              const p = toProductView(r);
              return (
                <tr key={p.id} className={p.isVisible ? "" : "opacity-60"}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Image src={p.image} alt="" width={48} height={48} className="h-12 w-12 rounded-lg object-cover" />
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-white/55">
                          {p.brand} · per {p.unit}
                          {p.isBestSeller && " · ★ Best seller"}
                          {p.isGreen && " · 🌿"}
                        </p>
                        {r.priceNote && <p className="text-xs text-saffron-400">Note: {r.priceNote}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{categoryLabel(p.category)}</td>
                  <td className="p-3">
                    <b>{formatINR(p.price)}</b> <span className="text-white/50 line-through">{formatINR(p.mrp)}</span>
                    <span className="block text-xs text-festive-green">{discountPercent(p.mrp, p.price)}% off</span>
                  </td>
                  <td className="p-3">
                    {r.costPrice > 0 ? (
                      <>
                        {formatINR(r.costPrice)}
                        <span className={`block text-xs font-semibold ${p.price - r.costPrice >= 0 ? "text-festive-green" : "text-red-300"}`}>
                          {p.price - r.costPrice >= 0 ? "+" : "−"}
                          {formatINR(Math.abs(p.price - r.costPrice))} ({(((p.price - r.costPrice) / p.price) * 100).toFixed(0)}%)
                        </span>
                      </>
                    ) : (
                      <Link href={`/admin/products/${p.id}`} className="text-xs text-saffron-400 underline">
                        Set cost
                      </Link>
                    )}
                  </td>
                  <td className={`p-3 ${p.stock < 25 ? "text-saffron-400" : ""}`}>{p.stock}</td>
                  <td className="p-3">
                    <form action={toggleProductVisibility}>
                      <input type="hidden" name="id" value={p.id} />
                      <SubmitButton className={`badge cursor-pointer ${p.isVisible ? "bg-emerald-700 text-white" : "bg-white/15"}`}>
                        {p.isVisible ? "Visible" : "Hidden"}
                      </SubmitButton>
                    </form>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="btn btn-ghost !min-h-9 !py-1 text-sm">
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
  );
}
