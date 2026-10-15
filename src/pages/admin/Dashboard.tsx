import { Link } from "react-router";
import { supabase } from "@/lib/supabase";
import { must, useLoad } from "@/lib/useLoad";
import { formatDateTime, formatINR } from "@/lib/format";
import { getCostMaps, itemUnitCost, sumProfit } from "@/lib/profit";
import type { Order, OrderWithItems, Product } from "@/lib/types";
import { PageTitle, StatCard, StatusBadge } from "@/components/admin/ui";
import { LoadState } from "@/components/admin/FormBits";

const IST_OFFSET = 5.5 * 3600_000;
/** Start of the given day in IST, as a UTC Date. */
function istDayStart(d: Date, daysAgo = 0) {
  const ist = new Date(d.getTime() + IST_OFFSET);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET - daysAgo * 86400_000);
}

const count = (res: { count: number | null; error: unknown }) => {
  if (res.error) throw res.error;
  return res.count ?? 0;
};

async function loadDashboard() {
  const head = { count: "exact" as const, head: true };
  const [maps, live, pending, awaitingPay, newQuotes, lowStock, recent, customers] = await Promise.all([
    getCostMaps(),
    supabase.from("orders").select("*, order_items(*)").neq("status", "CANCELLED"),
    supabase.from("orders").select("id", head).in("status", ["NEW", "CONFIRMED", "PACKED"]),
    supabase.from("orders").select("id", head).eq("payment_status", "AWAITING_VERIFICATION").neq("status", "CANCELLED"),
    supabase.from("quotes").select("id", head).eq("status", "NEW"),
    supabase.from("products").select("id, name, brand, stock").lt("stock", 25).order("stock").limit(5),
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("customers").select("id", head),
  ]);
  return {
    maps,
    orders: must(live) as OrderWithItems[],
    pending: count(pending),
    awaitingPay: count(awaitingPay),
    newQuotes: count(newQuotes),
    lowStock: must(lowStock) as Pick<Product, "id" | "name" | "brand" | "stock">[],
    recent: must(recent) as Order[],
    customers: count(customers),
  };
}

export function Dashboard() {
  const { data, error, reload } = useLoad(loadDashboard, []);
  if (!data) return <LoadState error={error} onRetry={reload} />;

  const { maps, orders } = data;
  const now = new Date();
  const today = istDayStart(now);
  const weekStart = istDayStart(now, 6);
  const at = (o: Order) => new Date(o.created_at);
  const todayOrders = orders.filter((o) => at(o) >= today);
  const weekOrders = orders.filter((o) => at(o) >= weekStart);

  const plAll = sumProfit(orders, maps);
  const plToday = sumProfit(todayOrders, maps);
  const plWeek = sumProfit(weekOrders, maps);
  const byItem = new Map<string, { name: string; qty: number; revenue: number; cost: number; missing: boolean }>();
  for (const o of orders) {
    // Spread order-level discounts across lines in proportion to their value.
    const factor = o.subtotal ? (o.subtotal - o.coupon_discount - o.auto_discount) / o.subtotal : 1;
    for (const i of o.order_items) {
      const key = `${i.kind}:${i.ref_id}`;
      const row = byItem.get(key) ?? { name: i.name, qty: 0, revenue: 0, cost: 0, missing: false };
      const u = itemUnitCost(i, maps);
      row.qty += i.qty;
      row.revenue += i.line_total * factor;
      row.cost += u * i.qty;
      row.missing ||= !u;
      byItem.set(key, row);
    }
  }
  const itemRows = [...byItem.values()].sort((a, b) => b.revenue - b.cost - (a.revenue - a.cost));
  const pc = (n: number) => (n >= 0 ? "text-festive-green" : "text-red-300");
  const sumTotal = (list: Order[]) => list.reduce((a, o) => a + o.total, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const start = istDayStart(now, 6 - i);
    const end = new Date(start.getTime() + 86400_000);
    const rows = weekOrders.filter((o) => at(o) >= start && at(o) < end);
    return {
      label: new Date(start.getTime() + IST_OFFSET).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", timeZone: "UTC" }),
      total: sumTotal(rows),
      count: rows.length,
    };
  });
  const max = Math.max(1, ...days.map((d) => d.total));

  return (
    <>
      <title>Dashboard · Admin</title>
      <PageTitle title="Dashboard">
        <Link to="/admin/orders" className="btn btn-primary text-sm">
          View orders
        </Link>
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Today's orders" value={todayOrders.length} />
        <StatCard label="Today's revenue" value={formatINR(sumTotal(todayOrders))} />
        <StatCard label="Pending (to ship)" value={data.pending} hint="New + Confirmed + Packed" />
        <StatCard label="UPI to verify" value={data.awaitingPay} hint="Check UTR in your bank app" />
        <StatCard label="Total orders" value={orders.length} hint="Excluding cancelled" />
        <StatCard label="Total revenue" value={formatINR(sumTotal(orders))} />
        <StatCard label="New quote requests" value={data.newQuotes} />
        <StatCard label="Customers" value={data.customers} />
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
            <Link to="/admin/products" className="underline">Set cost prices in Products</Link>.
          </p>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Profit by product</caption>
            <thead className="text-white/55">
              <tr>
                <th className="py-2 font-medium">Product / combo</th>
                <th className="py-2 text-right font-medium">Units</th>
                <th className="hidden py-2 text-right font-medium sm:table-cell">Revenue</th>
                <th className="hidden py-2 text-right font-medium sm:table-cell">Cost</th>
                <th className="py-2 text-right font-medium">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {itemRows.map((r) => (
                <tr key={r.name}>
                  <td className="py-2">{r.name}</td>
                  <td className="py-2 text-right">{r.qty}</td>
                  <td className="hidden py-2 text-right sm:table-cell">{formatINR(Math.round(r.revenue))}</td>
                  <td className="hidden py-2 text-right sm:table-cell">{r.missing ? <span className="text-saffron-400">not set</span> : formatINR(r.cost)}</td>
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
          {data.lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-white/60">All products are well stocked.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/10 text-sm">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex justify-between py-2">
                  <Link to={`/admin/products/${p.id}`} className="hover:underline">
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
        <ul className="divide-y divide-white/10 px-5 pb-3 pt-2 text-sm md:hidden">
          {data.recent.map((o) => (
            <li key={o.id}>
              <Link to={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block font-mono text-gold-300">{o.order_number}</span>
                  <span className="block truncate text-white/70">
                    {o.name} · {formatDateTime(o.created_at)}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <b className="block">{formatINR(o.total)}</b>
                  <StatusBadge value={o.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto p-5 md:block">
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
              {data.recent.map((o) => (
                <tr key={o.id} className="hover:bg-white/5">
                  <td className="py-2.5">
                    <Link to={`/admin/orders/${o.id}`} className="font-mono text-gold-300 hover:underline">
                      {o.order_number}
                    </Link>
                  </td>
                  <td>
                    {o.name}
                    <span className="block text-xs text-white/50">{o.phone}</span>
                  </td>
                  <td className="font-semibold">{formatINR(o.total)}</td>
                  <td>
                    <span className="text-xs text-white/60">{o.payment_method}</span> <StatusBadge value={o.payment_status} />
                  </td>
                  <td>
                    <StatusBadge value={o.status} />
                  </td>
                  <td className="text-white/60">{formatDateTime(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
