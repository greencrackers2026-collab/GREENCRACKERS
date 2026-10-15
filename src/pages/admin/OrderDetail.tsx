import { Link, useNavigate, useParams } from "react-router";
import { useState } from "react";
import { markCodPaid, reviewPayment, updateOrder } from "@/lib/admin";
import { supabase } from "@/lib/supabase";
import { must, useLoad } from "@/lib/useLoad";
import { ORDER_STATUSES, PAYMENT_METHOD_LABEL, PAYMENT_STATUSES } from "@/lib/constants";
import { formatDateTime, formatINR, waLink } from "@/lib/format";
import { getCostMaps, itemUnitCost, orderProfit } from "@/lib/profit";
import type { OrderWithItems } from "@/lib/types";
import { PageTitle, StatusBadge } from "@/components/admin/ui";
import { ActionButton, LoadState } from "@/components/admin/FormBits";
import { DeleteOrderButton } from "@/components/admin/DeleteOrderButton";
import { NotFound } from "@/pages/site/NotFound";
import { useAdminOutlet } from "./AdminLayout";

async function loadOrder(id: string) {
  const [res, maps] = await Promise.all([
    supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle(),
    getCostMaps(),
  ]);
  const o = must(res) as OrderWithItems | null;
  if (!o) return null;
  const [orderCount, proof] = await Promise.all([
    o.customer_id ? supabase.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", o.customer_id) : null,
    // Screenshots live in a private bucket; a short-lived signed URL lets the admin view them.
    o.payment_proof ? supabase.storage.from("payment-proofs").createSignedUrl(o.payment_proof, 3600) : null,
  ]);
  return { o, maps, customerOrders: orderCount?.count ?? null, proofUrl: proof?.data?.signedUrl ?? null };
}

export function OrderDetail() {
  const { id = "" } = useParams();
  const { refreshCounts } = useAdminOutlet();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useLoad(() => loadOrder(id), [id]);
  if (!data) return loading || error ? <LoadState error={error} onRetry={reload} /> : <NotFound />;

  const { o, maps } = data;
  const pl = orderProfit(o, maps);
  const after = async () => {
    await reload();
    refreshCounts();
  };

  return (
    <>
      <title>{`Order ${o.order_number} · Admin`}</title>
      <PageTitle title={`Order ${o.order_number}`}>
        <Link to={`/admin/print/${o.id}?type=invoice`} target="_blank" className="btn btn-ghost text-sm">
          🖨️ Invoice
        </Link>
        <Link to={`/admin/print/${o.id}?type=slip`} target="_blank" className="btn btn-ghost text-sm">
          📦 Packing slip
        </Link>
        <a
          href={waLink(`91${o.phone}`, `Hi ${o.name}, this is regarding your Diwali crackers order ${o.order_number}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-[#25D366] text-sm text-[#06290f]"
        >
          WhatsApp customer
        </a>
        <DeleteOrderButton
          order={o}
          onDeleted={() => {
            refreshCounts();
            navigate("/admin/orders", { replace: true });
          }}
        />
      </PageTitle>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={o.status} />
              <StatusBadge value={o.payment_status} />
              <span className="text-sm text-white/60">· {formatDateTime(o.created_at)}</span>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-white/55">
                <tr>
                  <th className="pb-2 font-medium">Item</th>
                  <th className="hidden pb-2 text-right font-medium sm:table-cell">Price</th>
                  <th className="pb-2 text-right font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                  <th className="hidden pb-2 text-right font-medium sm:table-cell">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {o.order_items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2">
                      {i.name}
                      {i.kind === "COMBO" && <span className="badge ml-2 bg-fuchsia-600/40">COMBO</span>}
                      <span className="block text-xs text-white/50 sm:hidden">{formatINR(i.unit_price)} each</span>
                    </td>
                    <td className="hidden py-2 text-right sm:table-cell">{formatINR(i.unit_price)}</td>
                    <td className="py-2 text-right">{i.qty}</td>
                    <td className="py-2 text-right font-semibold">{formatINR(i.line_total)}</td>
                    <td className="hidden py-2 text-right text-white/60 sm:table-cell">{itemUnitCost(i, maps) ? formatINR(itemUnitCost(i, maps) * i.qty) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ml-auto mt-4 space-y-1 sm:max-w-xs border-t border-white/10 pt-3 text-sm">
              <div className="flex justify-between text-white/50">
                <dt>MRP total</dt>
                <dd className="line-through">{formatINR(o.mrp_total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatINR(o.subtotal)}</dd>
              </div>
              {o.coupon_discount > 0 && (
                <div className="flex justify-between text-festive-green">
                  <dt>Coupon {o.coupon_code}</dt>
                  <dd>− {formatINR(o.coupon_discount)}</dd>
                </div>
              )}
              {o.auto_discount > 0 && (
                <div className="flex justify-between text-festive-green">
                  <dt>Auto offer</dt>
                  <dd>− {formatINR(o.auto_discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd>{o.shipping_fee ? formatINR(o.shipping_fee) : "FREE"}</dd>
              </div>
              {o.cod_fee > 0 && (
                <div className="flex justify-between">
                  <dt>COD charges</dt>
                  <dd>{formatINR(o.cod_fee)}</dd>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatINR(o.total)}</dd>
              </div>
            </dl>
          </section>

          <section className="glass rounded-2xl p-5 text-sm" aria-labelledby="pl-title">
            <h2 id="pl-title" className="font-semibold text-gold-300">Profit &amp; loss</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div><dt className="text-white/55">Revenue</dt><dd className="text-lg font-bold">{formatINR(pl.revenue)}</dd></div>
              <div><dt className="text-white/55">Your cost</dt><dd className="text-lg font-bold">{formatINR(pl.cost)}</dd></div>
              <div>
                <dt className="text-white/55">{pl.profit >= 0 ? "Profit" : "Loss"}</dt>
                <dd className={`text-lg font-bold ${pl.profit >= 0 ? "text-festive-green" : "text-red-300"}`}>{formatINR(Math.abs(pl.profit))}</dd>
              </div>
              <div><dt className="text-white/55">Margin</dt><dd className="text-lg font-bold">{pl.margin.toFixed(1)}%</dd></div>
            </dl>
            <p className="mt-2 text-xs text-white/50">Revenue = items after discounts (delivery fee excluded).</p>
            {pl.missing && <p className="mt-1 text-xs text-saffron-400">Some items have no cost price, so profit is overstated. Set costs in Products.</p>}
          </section>

          <section className="glass grid gap-5 rounded-2xl p-5 text-sm sm:grid-cols-2">
            <div>
              <h2 className="font-semibold text-gold-300">Customer</h2>
              <p className="mt-2">{o.name}</p>
              <p>
                <a href={`tel:${o.phone}`} className="hover:underline">
                  {o.phone}
                </a>
              </p>
              {o.email && <p className="text-white/70">{o.email}</p>}
              {data.customerOrders !== null && <p className="mt-1 text-xs text-white/50">{data.customerOrders} order(s) from this number</p>}
            </div>
            <div>
              <h2 className="font-semibold text-gold-300">{o.delivery_mode === "PICKUP" ? "Pickup (address on file)" : "Delivery address"}</h2>
              <address className="mt-2 not-italic text-white/80">
                {o.address1}
                {o.address2 && (
                  <>
                    <br />
                    {o.address2}
                  </>
                )}
                <br />
                {o.city}, {o.state} – {o.pincode}
              </address>
              {o.notes && <p className="mt-2 rounded-lg bg-white/5 p-2 text-white/75">📝 {o.notes}</p>}
            </div>
            <div className="sm:col-span-2">
              <h2 className="font-semibold text-gold-300">Payment</h2>
              <p className="mt-2">{PAYMENT_METHOD_LABEL[o.payment_method]}</p>
              {o.upi_ref && (
                <p className="text-white/75">
                  UPI ref / UTR: <b className="font-mono">{o.upi_ref}</b>
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {o.payment_method === "COD" && (
            <section className="glass rounded-2xl p-5" aria-labelledby="cod-title">
              <h2 id="cod-title" className="font-semibold">
                Cash on Delivery
              </h2>
              {o.payment_status === "PAID" ? (
                <p className="mt-2 text-sm font-semibold text-festive-green">✓ Cash received ({formatINR(o.total)})</p>
              ) : o.status === "CANCELLED" ? (
                <p className="mt-2 text-sm text-red-300">Order cancelled</p>
              ) : (
                <>
                  <p className="mt-1 text-sm text-white/60">
                    Collect <b className="text-lg text-gold-300">{formatINR(o.total)}</b> in cash on delivery / pickup, then mark it paid.
                  </p>
                  <ActionButton
                    className="btn mt-4 w-full bg-emerald-600 text-white"
                    confirm={`Mark ${o.order_number} as PAID? Only do this once you have received ${formatINR(o.total)} in cash.`}
                    onClick={async () => {
                      await markCodPaid(o);
                      await after();
                    }}
                  >
                    ✓ Cash received, mark as PAID
                  </ActionButton>
                </>
              )}
            </section>
          )}
          {o.payment_method === "UPI" && (
            <section className="glass rounded-2xl p-5" aria-labelledby="proof-title">
              <h2 id="proof-title" className="font-semibold">
                UPI payment proof
              </h2>
              <p className="mt-1 text-sm text-white/60">
                Check that <b className="text-gold-300">{formatINR(o.total)}</b> was received in your bank / UPI app before approving.
              </p>
              {data.proofUrl ? (
                <a href={data.proofUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                  <img
                    src={data.proofUrl}
                    alt={`Payment screenshot for ${o.order_number}`}
                    className="max-h-[480px] w-full rounded-xl border border-white/15 bg-black/30 object-contain"
                  />
                  <span className="mt-1 block text-xs text-white/50">Tap to open full size</span>
                </a>
              ) : (
                <p className="mt-3 rounded-xl bg-saffron-500/15 p-3 text-sm text-saffron-300">No screenshot uploaded yet.</p>
              )}
              {o.upi_ref && (
                <p className="mt-2 text-sm">
                  UTR: <b className="font-mono">{o.upi_ref}</b>
                </p>
              )}
              {o.payment_status === "PAID" ? (
                <p className="mt-3 text-sm font-semibold text-festive-green">✓ Payment approved</p>
              ) : o.status === "CANCELLED" ? (
                <p className="mt-3 text-sm text-red-300">Order cancelled</p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <ActionButton
                    className="btn w-full bg-emerald-600 text-white"
                    confirm={`Approve payment of ${formatINR(o.total)} and confirm this order?`}
                    onClick={async () => {
                      await reviewPayment(o, "approve");
                      await after();
                    }}
                  >
                    ✓ Approve
                  </ActionButton>
                  <ActionButton
                    className="btn btn-ghost w-full text-red-300"
                    confirm="Reject this payment? The order will be cancelled and stock returned."
                    onClick={async () => {
                      await reviewPayment(o, "reject");
                      await after();
                    }}
                  >
                    ✕ Reject
                  </ActionButton>
                </div>
              )}
            </section>
          )}
          <UpdateOrderForm key={o.updated_at} o={o} onSaved={after} />
        </div>
      </div>
    </>
  );
}

function UpdateOrderForm({ o, onSaved }: { o: OrderWithItems; onSaved: () => Promise<void> }) {
  const [status, setStatus] = useState(o.status);
  const [paymentStatus, setPaymentStatus] = useState(o.payment_status);
  const [note, setNote] = useState(o.admin_note ?? "");
  const cancelled = o.status === "CANCELLED";

  return (
    <section className="glass h-fit rounded-2xl p-5">
      <h2 className="font-semibold">Update order</h2>
      <div className="mt-4 space-y-4">
        <label className="block">
          <span className="label">Order status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input" disabled={cancelled}>
            {ORDER_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {cancelled && <span className="mt-1 block text-xs text-white/50">Cancelled orders are locked (stock was returned).</span>}
        </label>
        <label className="block">
          <span className="label">Payment status</span>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="input">
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Internal note</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} className="input min-h-24" placeholder="Courier, tracking no., call notes…" />
        </label>
        <ActionButton
          className="btn btn-primary w-full"
          confirm={status === "CANCELLED" && !cancelled ? "Cancel this order? Its items go back into stock." : undefined}
          onClick={async () => {
            await updateOrder(o.id, { ...(!cancelled && { status }), payment_status: paymentStatus, admin_note: note.trim() || null });
            await onSaved();
          }}
        >
          Save changes
        </ActionButton>
        <p className="text-xs text-white/50">Setting status to CANCELLED returns the items to stock.</p>
      </div>
    </section>
  );
}
