import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime, formatINR } from "@/lib/format";
import { PageTitle, StatCard, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

const IST_OFFSET = 5.5 * 3600_000;
/** Start of the given day in IST, as a UTC Date. */
function istDayStart(d: Date, daysAgo = 0) {
  const ist = new Date(d.getTime() + IST_OFFSET);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET - daysAgo * 86400_000);
}

export default async function Dashboard() {
  const now = new Date();
  const today = istDayStart(now);
  const weekStart = istDayStart(now, 6);
  const notCancelled = { status: { not: "CANCELLED" } };

  const [todayAgg, allAgg, pending, awaitingPay, newQuotes, lowStock, recent, week, customers] = await Promise.all([
    prisma.order.aggregate({ where: { createdAt: { gte: today }, ...notCancelled }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: notCancelled, _sum: { total: true }, _count: true }),
    prisma.order.count({ where: { status: { in: ["NEW", "CONFIRMED", "PACKED"] } } }),
    prisma.order.count({ where: { paymentStatus: "AWAITING_VERIFICATION", status: { not: "CANCELLED" } } }),
    prisma.quote.count({ where: { status: "NEW" } }),
    prisma.product.findMany({ where: { stock: { lt: 25 } }, orderBy: { stock: "asc" }, take: 5 }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.order.findMany({ where: { createdAt: { gte: weekStart }, ...notCancelled }, select: { createdAt: true, total: true } }),
    prisma.customer.count(),
  ]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const start = istDayStart(now, 6 - i);
    const end = new Date(start.getTime() + 86400_000);
    const rows = week.filter((o) => o.createdAt >= start && o.createdAt < end);
    return {
      label: new Date(start.getTime() + IST_OFFSET).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", timeZone: "UTC" }),
      total: rows.reduce((a, o) => a + o.total, 0),
      count: rows.length,
    };
  });
  const max = Math.max(1, ...days.map((d) => d.total));

  return (
    <>
      <PageTitle title="Dashboard">
        <Link href="/admin/orders" className="btn btn-primary text-sm">
          View orders
        </Link>
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Today's orders" value={todayAgg._count} />
        <StatCard label="Today's revenue" value={formatINR(todayAgg._sum.total ?? 0)} />
        <StatCard label="Pending (to ship)" value={pending} hint="New + Confirmed + Packed" />
        <StatCard label="UPI to verify" value={awaitingPay} hint="Check UTR in your bank app" />
        <StatCard label="Total orders" value={allAgg._count} hint="Excluding cancelled" />
        <StatCard label="Total revenue" value={formatINR(allAgg._sum.total ?? 0)} />
        <StatCard label="New quote requests" value={newQuotes} />
        <StatCard label="Customers" value={customers} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="glass rounded-2xl p-5" aria-labelledby="rev-title">
          <h2 id="rev-title" className="font-semibold">
            Revenue, last 7 days
          </h2>
          <div className="mt-6 flex h-48 items-end gap-3 border-b border-white/15" aria-hidden="true">
            {days.map((d) => (
              <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className="mx-auto w-full max-w-10 rounded-t bg-gold-400 transition-opacity group-hover:opacity-80"
                  style={{ height: `${Math.max(d.total ? 2 : 0, (d.total / max) * 100)}%` }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/90 px-2 py-1 text-xs text-white group-hover:block">
                  {d.label}: {formatINR(d.total)} · {d.count} order{d.count === 1 ? "" : "s"}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-3 text-center text-[11px] text-white/55" aria-hidden="true">
            {days.map((d) => (
              <span key={d.label} className="flex-1">
                {d.label}
              </span>
            ))}
          </div>
          <table className="sr-only">
            <caption>Revenue by day</caption>
            <thead>
              <tr>
                <th>Day</th>
                <th>Revenue</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.label}>
                  <td>{d.label}</td>
                  <td>{formatINR(d.total)}</td>
                  <td>{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="glass rounded-2xl p-5" aria-labelledby="stock-title">
          <h2 id="stock-title" className="font-semibold">
            Low stock
          </h2>
          {lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-white/60">All products are well stocked.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/10 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between py-2">
                  <Link href={`/admin/products/${p.id}`} className="hover:underline">
                    {p.brand} {p.name}
                  </Link>
                  <span className={p.stock === 0 ? "font-bold text-red-300" : "text-saffron-400"}>{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="glass mt-6 overflow-hidden rounded-2xl" aria-labelledby="recent-title">
        <h2 id="recent-title" className="p-5 pb-0 font-semibold">
          Recent orders
        </h2>
        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-white/55">
              <tr>
                <th className="pb-2 font-medium">Order</th>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Total</th>
                <th className="pb-2 font-medium">Payment</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {recent.map((o) => (
                <tr key={o.id} className="hover:bg-white/5">
                  <td className="py-2.5">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-gold-300 hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td>
                    {o.name}
                    <span className="block text-xs text-white/50">{o.phone}</span>
                  </td>
                  <td className="font-semibold">{formatINR(o.total)}</td>
                  <td>
                    <span className="text-xs text-white/60">{o.paymentMethod}</span> <StatusBadge value={o.paymentStatus} />
                  </td>
                  <td>
                    <StatusBadge value={o.status} />
                  </td>
                  <td className="text-white/60">{formatDateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
