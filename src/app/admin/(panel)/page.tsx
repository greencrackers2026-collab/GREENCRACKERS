import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime, formatINR } from "@/lib/format";
import { PageTitle, StatCard, StatusBadge } from "@/components/admin/ui";
import { getCostMaps, itemUnitCost, sumProfit } from "@/lib/profit";

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

  const [maps, plOrders] = await Promise.all([
    getCostMaps(),
    prisma.order.findMany({ where: { status: { not: "CANCELLED" } }, include: { items: true } }),
  ]);
  const plAll = sumProfit(plOrders, maps);
  const plToday = sumProfit(plOrders.filter((o) => o.createdAt >= today), maps);
  const plWeek = sumProfit(plOrders.filter((o) => o.createdAt >= weekStart), maps);
  const byItem = new Map<string, { name: string; qty: number; revenue: number; cost: number; missing: boolean }>();
  for (const o of plOrders) {
    // Spread order-level discounts across lines in proportion to their value.
    const factor = o.subtotal ? (o.subtotal - o.couponDiscount - o.autoDiscount) / o.subtotal : 1;
    for (const i of o.items) {
      const key = `${i.kind}:${i.refId}`;
      const row = byItem.get(key) ?? { name: i.name, qty: 0, revenue: 0, cost: 0, missing: false };
      const u = itemUnitCost(i, maps);
      row.qty += i.qty;
      row.revenue += i.lineTotal * factor;
      row.cost += u * i.qty;
      row.missing ||= !u;
      byItem.set(key, row);
    }
  }
  const itemRows = [...byItem.values()].sort((a, b) => b.revenue - b.cost - (a.revenue - a.cost));
  const pc = (n: number) => (n >= 0 ? "text-festive-green" : "text-red-300");

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

      <section className="glass mt-6 rounded-2xl p-5" aria-labelledby="pl-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="pl-title" className="font-semibold">Profit &amp; loss</h2>
          <p className="text-xs text-white/50">Revenue after discounts, excluding delivery fees and cancelled orders</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-sm text-white/60">Today&apos;s profit</p>
            <p className={`text-2xl font-bold ${pc(plToday.profit)}`}>{formatINR(plToday.profit)}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-sm text-white/60">Last 7 days profit</p>
            <p className={`text-2xl font-bold ${pc(plWeek.profit)}`}>{formatINR(plWeek.profit)}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-sm text-white/60">Total profit</p>
            <p className={`text-2xl font-bold ${pc(plAll.profit)}`}>{formatINR(plAll.profit)}</p>
            <p className="text-xs text-white/50">{plAll.revenue ? ((plAll.profit / plAll.revenue) * 100).toFixed(1) : "0"}% margin</p>
          </div>
          <div className="rounded-xl bg-white/5 p-4 text-sm">
            <p className="flex justify-between"><span className="text-white/60">Revenue</span><b>{formatINR(plAll.revenue)}</b></p>
            <p className="flex justify-between"><span className="text-white/60">Your cost</span><b>{formatINR(plAll.cost)}</b></p>
            <p className="flex justify-between"><span className="text-white/60">Discounts given</span><b>{formatINR(plAll.discounts)}</b></p>
          </div>
        </div>
        {plAll.missingCount > 0 && (
          <p className="mt-3 rounded-xl bg-saffron-500/15 p-3 text-sm text-saffron-300">
            ⚠️ {plAll.missingCount} order(s) contain products without a cost price, so profit is overstated.{" "}
            <Link href="/admin/products" className="underline">Set cost prices in Products</Link>.
          </p>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Profit by product</caption>
            <thead className="text-white/55">
              <tr>
                <th className="py-2 font-medium">Product / combo</th>
                <th className="py-2 text-right font-medium">Units sold</th>
                <th className="py-2 text-right font-medium">Revenue</th>
                <th className="py-2 text-right font-medium">Cost</th>
                <th className="py-2 text-right font-medium">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {itemRows.map((r) => (
                <tr key={r.name}>
                  <td className="py-2">{r.name}</td>
                  <td className="py-2 text-right">{r.qty}</td>
                  <td className="py-2 text-right">{formatINR(Math.round(r.revenue))}</td>
                  <td className="py-2 text-right">{r.missing ? <span className="text-saffron-400">not set</span> : formatINR(r.cost)}</td>
                  <td className={`py-2 text-right font-semibold ${pc(r.revenue - r.cost)}`}>{formatINR(Math.round(r.revenue - r.cost))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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
