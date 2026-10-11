import Link from "next/link";
import { prisma } from "@/lib/db";
import { buildOrderWhere, type OrderFilters } from "@/lib/admin-queries";
import { ORDER_STATUSES, PAYMENT_METHODS } from "@/lib/constants";
import { formatDateTime, formatINR } from "@/lib/format";
import { PageTitle, StatusBadge } from "@/components/admin/ui";
import { AutoSubmitSelect } from "@/components/admin/FormBits";
import { updateOrder } from "../../actions";

export const metadata = { title: "Orders" };
const PER_PAGE = 25;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<OrderFilters & { page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const where = buildOrderWhere(sp);
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.order.count({ where }),
  ]);
  const filterQs = new URLSearchParams(
    Object.entries({ q: sp.q, status: sp.status, payment: sp.payment, from: sp.from, to: sp.to }).filter(([, v]) => v) as [string, string][],
  ).toString();
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <PageTitle title={`Orders (${total})`}>
        <a href={`/api/admin/orders/export${filterQs ? `?${filterQs}` : ""}`} className="btn btn-ghost text-sm">
          ⬇ Export CSV
        </a>
      </PageTitle>

      <form className="glass mb-5 grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-6" method="get">
        <label className="lg:col-span-2">
          <span className="label">Search</span>
          <input name="q" defaultValue={sp.q} className="input" placeholder="Order no, name, phone, city, pincode" />
        </label>
        <label>
          <span className="label">Status</span>
          <select name="status" defaultValue={sp.status ?? ""} className="input">
            <option value="">All</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Payment</span>
          <select name="payment" defaultValue={sp.payment ?? ""} className="input">
            <option value="">All</option>
            {PAYMENT_METHODS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">From</span>
          <input type="date" name="from" defaultValue={sp.from} className="input" />
        </label>
        <label>
          <span className="label">To</span>
          <input type="date" name="to" defaultValue={sp.to} className="input" />
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <button className="btn btn-primary text-sm">Apply filters</button>
          <Link href="/admin/orders" className="btn btn-ghost text-sm">
            Reset
          </Link>
        </div>
      </form>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="p-3 font-medium">Order</th>
              <th className="p-3 font-medium">Customer</th>
              <th className="p-3 font-medium">Delivery address</th>
              <th className="p-3 font-medium">Items</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Payment</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 align-top">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-white/5">
                <td className="p-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-gold-300 hover:underline">
                    {o.orderNumber}
                  </Link>
                  <span className="block text-xs text-white/50">{formatDateTime(o.createdAt)}</span>
                </td>
                <td className="p-3">
                  <span className="font-medium">{o.name}</span>
                  <a href={`tel:${o.phone}`} className="block text-white/70 hover:underline">
                    {o.phone}
                  </a>
                  {o.email && <span className="block text-xs text-white/50">{o.email}</span>}
                </td>
                <td className="max-w-56 p-3 text-white/75">
                  {o.deliveryMode === "PICKUP" && <span className="badge mb-1 bg-white/10">PICKUP</span>}
                  <span className="block">
                    {o.address1}
                    {o.address2 && `, ${o.address2}`}
                  </span>
                  <span className="block">
                    {o.city}, {o.state} – {o.pincode}
                  </span>
                </td>
                <td className="max-w-56 p-3 text-white/75">
                  {o.items.map((i) => (
                    <span key={i.id} className="block truncate">
                      {i.name} × {i.qty}
                    </span>
                  ))}
                </td>
                <td className="p-3">
                  <span className="font-semibold">{formatINR(o.total)}</span>
                  {o.couponCode && <span className="block text-xs text-festive-green">{o.couponCode}</span>}
                </td>
                <td className="p-3">
                  <span className="block text-xs text-white/60">{o.paymentMethod}</span>
                  <StatusBadge value={o.paymentStatus} />
                </td>
                <td className="p-3">
                  {o.status === "CANCELLED" ? (
                    <StatusBadge value="CANCELLED" />
                  ) : (
                    <form action={updateOrder}>
                      <input type="hidden" name="id" value={o.id} />
                      <AutoSubmitSelect name="status" defaultValue={o.status} options={ORDER_STATUSES} label={`Status for ${o.orderNumber}`} />
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-white/60">
                  No orders match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <Link className="btn btn-ghost text-sm" href={`?${filterQs}${filterQs ? "&" : ""}page=${page - 1}`}>
              ← Prev
            </Link>
          )}
          <span className="text-sm text-white/60">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link className="btn btn-ghost text-sm" href={`?${filterQs}${filterQs ? "&" : ""}page=${page + 1}`}>
              Next →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
