import { Link, useSearchParams } from "react-router";
import { useState } from "react";
import { downloadOrdersCsv, markCodPaid, ordersQuery, updateOrder, type OrderFilters } from "@/lib/admin";
import { must, useLoad } from "@/lib/useLoad";
import { ORDER_STATUSES, PAYMENT_METHODS } from "@/lib/constants";
import { formatDateTime, formatINR } from "@/lib/format";
import { getCostMaps, orderProfit, type CostMaps } from "@/lib/profit";
import type { OrderWithItems } from "@/lib/types";
import { PageTitle, StatusBadge } from "@/components/admin/ui";
import { ActionButton, AutoSaveSelect, LoadState } from "@/components/admin/FormBits";
import { DeleteOrderButton } from "@/components/admin/DeleteOrderButton";
import { TrashIcon } from "@/components/ui/Icons";
import { WhatsAppConfirmButton } from "@/components/admin/WhatsAppConfirm";
import { useAdminOutlet } from "./AdminLayout";

const PER_PAGE = 25;
const FILTER_KEYS = ["q", "status", "payment", "from", "to"] as const;

export function OrdersPage() {
  const [sp, setSp] = useSearchParams();
  const { refreshCounts } = useAdminOutlet();
  const filters: OrderFilters = Object.fromEntries(FILTER_KEYS.map((k) => [k, sp.get(k) ?? undefined]));
  const activeFilters = FILTER_KEYS.filter((k) => sp.get(k)).length;
  const [showFilters, setShowFilters] = useState(false);
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const key = sp.toString();

  const { data, error, reload } = useLoad(async () => {
    const [res, maps] = await Promise.all([
      ordersQuery(filters, { count: true }).range((page - 1) * PER_PAGE, page * PER_PAGE - 1),
      getCostMaps(),
    ]);
    return { orders: must(res) as OrderWithItems[], total: res.count ?? 0, maps };
  }, [key]);

  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / PER_PAGE));
  const goPage = (n: number) => {
    const next = new URLSearchParams(sp);
    next.set("page", String(n));
    setSp(next);
  };
  const after = async () => {
    await reload();
    refreshCounts();
  };

  return (
    <>
      <title>Orders · Admin</title>
      <PageTitle title={`Orders (${data?.total ?? "…"})`}>
        <button type="button" className="btn btn-ghost text-sm md:hidden" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
          🔍 Filters{activeFilters > 0 && ` (${activeFilters})`}
        </button>
        <ActionButton
          className="btn btn-ghost text-sm"
          onClick={async () => {
            const [orders, maps] = await Promise.all([ordersQuery(filters), getCostMaps()]);
            downloadOrdersCsv(must(orders) as OrderWithItems[], maps);
          }}
        >
          ⬇ Export CSV
        </ActionButton>
      </PageTitle>

      <form
        key={key}
        className={`glass mb-5 gap-3 rounded-2xl p-4 sm:grid-cols-2 md:grid lg:grid-cols-6 ${showFilters ? "grid" : "hidden"}`}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const next = new URLSearchParams();
          for (const k of FILTER_KEYS) {
            const v = String(fd.get(k) ?? "").trim();
            if (v) next.set(k, v);
          }
          setSp(next);
          setShowFilters(false);
        }}
      >
        <label className="sm:col-span-2">
          <span className="label">Search</span>
          <input name="q" type="search" defaultValue={filters.q} className="input" placeholder="Order no, name, phone, city, pincode" />
        </label>
        <label>
          <span className="label">Status</span>
          <select name="status" defaultValue={filters.status ?? ""} className="input">
            <option value="">All</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Payment</span>
          <select name="payment" defaultValue={filters.payment ?? ""} className="input">
            <option value="">All</option>
            {PAYMENT_METHODS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">From</span>
          <input type="date" name="from" defaultValue={filters.from} className="input" />
        </label>
        <label>
          <span className="label">To</span>
          <input type="date" name="to" defaultValue={filters.to} className="input" />
        </label>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <button className="btn btn-primary flex-1 text-sm sm:flex-none">Apply filters</button>
          <Link to="/admin/orders" className="btn btn-ghost text-sm" onClick={() => setShowFilters(false)}>
            Reset
          </Link>
        </div>
      </form>

      {!data ? (
        <LoadState error={error} onRetry={reload} />
      ) : data.orders.length === 0 ? (
        <p className="glass rounded-2xl p-8 text-center text-white/60">No orders match these filters.</p>
      ) : (
        <>
          {/* Phones: one card per order */}
          <div className="space-y-3 md:hidden">
            {data.orders.map((o) => (
              <OrderCard key={o.id} o={o} maps={data.maps} onChanged={after} />
            ))}
          </div>

          {/* Tablets and up: table */}
          <div className="glass hidden overflow-x-auto rounded-2xl md:block">
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
                  <th className="p-3 font-medium">
                    <span className="sr-only">Delete</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 align-top">
                {data.orders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/5">
                    <td className="p-3">
                      <Link to={`/admin/orders/${o.id}`} className="font-mono font-semibold text-gold-300 hover:underline">
                        {o.order_number}
                      </Link>
                      <span className="block text-xs text-white/50">{formatDateTime(o.created_at)}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{o.name}</span>
                      <a href={`tel:${o.phone}`} className="block text-white/70 hover:underline">
                        {o.phone}
                      </a>
                      {o.email && <span className="block text-xs text-white/50">{o.email}</span>}
                      <WhatsAppConfirmButton
                        o={o}
                        className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#25D366] px-2.5 py-1 text-xs font-semibold text-[#06290f]"
                      />
                    </td>
                    <td className="max-w-56 p-3 text-white/75">
                      {o.delivery_mode === "PICKUP" && <span className="badge mb-1 bg-white/10">PICKUP</span>}
                      <span className="block">
                        {o.address1}
                        {o.address2 && `, ${o.address2}`}
                      </span>
                      <span className="block">
                        {o.city}, {o.state} – {o.pincode}
                      </span>
                    </td>
                    <td className="max-w-56 p-3 text-white/75">
                      {o.order_items.map((i) => (
                        <span key={i.id} className="block truncate">
                          {i.name} × {i.qty}
                        </span>
                      ))}
                    </td>
                    <td className="p-3">
                      <TotalCell o={o} maps={data.maps} />
                    </td>
                    <td className="p-3">
                      <PaymentCell o={o} onChanged={after} />
                    </td>
                    <td className="p-3">
                      <StatusControl o={o} onChanged={after} />
                    </td>
                    <td className="p-3 text-right">
                      <DeleteOrderButton
                        order={o}
                        onDeleted={after}
                        className="grid h-9 w-9 place-items-center rounded-full text-white/50 hover:bg-red-500/15 hover:text-red-300"
                        label={<TrashIcon width={16} height={16} />}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-2" aria-label="Pagination">
          {page > 1 && (
            <button className="btn btn-ghost text-sm" onClick={() => goPage(page - 1)}>
              ← Prev
            </button>
          )}
          <span className="text-sm text-white/60">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <button className="btn btn-ghost text-sm" onClick={() => goPage(page + 1)}>
              Next →
            </button>
          )}
        </nav>
      )}
    </>
  );
}

function OrderCard({ o, maps, onChanged }: { o: OrderWithItems; maps: CostMaps; onChanged: () => Promise<void> }) {
  return (
    <article className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/admin/orders/${o.id}`} className="font-mono font-semibold text-gold-300 underline-offset-2 hover:underline">
            {o.order_number}
          </Link>
          <p className="text-xs text-white/50">{formatDateTime(o.created_at)}</p>
        </div>
        <div className="text-right">
          <TotalCell o={o} maps={maps} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <div className="min-w-0">
          <p className="truncate font-medium">{o.name}</p>
          <p className="truncate text-xs text-white/55">
            {o.delivery_mode === "PICKUP" ? "🏪 Pickup" : `${o.city}, ${o.pincode}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a href={`tel:${o.phone}`} className="btn btn-ghost !min-h-9 !px-3 text-xs">
            📞 {o.phone}
          </a>
          <WhatsAppConfirmButton o={o} compact className="grid h-9 w-9 place-items-center rounded-full bg-[#25D366] text-[#06290f]" />
        </div>
      </div>

      <ul className="mt-3 space-y-0.5 rounded-xl bg-white/5 p-2.5 text-sm text-white/80">
        {o.order_items.map((i) => (
          <li key={i.id} className="flex justify-between gap-2">
            <span className="truncate">{i.name}</span>
            <span className="shrink-0 text-white/55">× {i.qty}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PaymentCell o={o} onChanged={onChanged} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1">
          <StatusControl o={o} onChanged={onChanged} />
        </div>
        <Link to={`/admin/orders/${o.id}`} className="btn btn-ghost !min-h-10 !px-4 text-sm">
          Open
        </Link>
        <DeleteOrderButton
          order={o}
          onDeleted={onChanged}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 text-red-300 hover:bg-red-500/15"
          label={<TrashIcon width={16} height={16} />}
        />
      </div>
    </article>
  );
}

function TotalCell({ o, maps }: { o: OrderWithItems; maps: CostMaps }) {
  const pl = orderProfit(o, maps);
  return (
    <>
      <span className="font-semibold">{formatINR(o.total)}</span>
      {o.coupon_code && <span className="block text-xs text-festive-green">{o.coupon_code}</span>}
      {o.referral_code && <span className="block text-xs text-fuchsia-300">🎁 {o.referral_code}</span>}
      <span className={`block text-xs ${pl.profit >= 0 ? "text-festive-green" : "text-red-300"}`} title="Profit after your cost">
        {pl.profit >= 0 ? "Profit " : "Loss "}
        {formatINR(Math.abs(pl.profit))}
        {pl.missing && "*"}
      </span>
    </>
  );
}

function PaymentCell({ o, onChanged }: { o: OrderWithItems; onChanged: () => Promise<void> }) {
  return (
    <>
      <span className="text-xs text-white/60 md:block">{o.payment_method}</span> <StatusBadge value={o.payment_status} />
      {o.payment_method === "UPI" && o.payment_proof && o.payment_status === "AWAITING_VERIFICATION" && (
        <Link to={`/admin/orders/${o.id}`} className="text-xs font-semibold text-gold-300 underline md:mt-1 md:block">
          Review screenshot →
        </Link>
      )}
      {o.payment_method === "COD" && o.payment_status !== "PAID" && o.status !== "CANCELLED" && (
        <ActionButton
          className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 md:mt-1.5 md:block"
          confirm={`Mark ${o.order_number} as PAID? Only do this once you have received ${formatINR(o.total)} in cash.`}
          onClick={async () => {
            await markCodPaid(o);
            await onChanged();
          }}
        >
          ✓ Mark paid
        </ActionButton>
      )}
    </>
  );
}

function StatusControl({ o, onChanged }: { o: OrderWithItems; onChanged: () => Promise<void> }) {
  if (o.status === "CANCELLED") return <StatusBadge value="CANCELLED" />;
  return (
    <AutoSaveSelect
      value={o.status}
      options={ORDER_STATUSES}
      label={`Status for ${o.order_number}`}
      onSave={async (status) => {
        if (status === "CANCELLED" && !window.confirm(`Cancel ${o.order_number}? Its items go back into stock.`)) return;
        await updateOrder(o.id, { status });
        await onChanged();
      }}
    />
  );
}
