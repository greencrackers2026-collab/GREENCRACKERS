import { useParams, useSearchParams } from "react-router";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { must, useLoad } from "@/lib/useLoad";
import { formatDateTime, formatINR } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import type { OrderWithItems } from "@/lib/types";
import { LoadState, PrintButton } from "@/components/admin/FormBits";
import { NotFound } from "@/pages/site/NotFound";

export function PrintPage() {
  const { id = "" } = useParams();
  const [sp] = useSearchParams();
  const { settings: s } = useStore();
  const { data: o, error, loading, reload } = useLoad(
    async () => must(await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle()) as OrderWithItems | null,
    [id],
  );
  if (!o) return loading || error ? <LoadState error={error} onRetry={reload} /> : <NotFound />;
  const slip = sp.get("type") === "slip";

  return (
    <div className="min-h-dvh bg-white p-6 text-black print:p-0">
      <title>{`${slip ? "Packing slip" : "Invoice"} ${o.order_number}`}</title>
      <div className="mx-auto max-w-3xl">
        <div className="no-print mb-6 flex justify-end">
          <PrintButton />
        </div>
        <header className="flex items-start justify-between border-b-2 border-black pb-4">
          <div>
            <h1 className="text-2xl font-bold">{s.store_name}</h1>
            <p className="text-sm">{s.address}</p>
            <p className="text-sm">
              {s.phone} {s.email && `· ${s.email}`}
            </p>
            {s.licence_number && <p className="text-xs">{s.licence_number}</p>}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold uppercase">{slip ? "Packing Slip" : "Invoice"}</p>
            <p className="font-mono">{o.order_number}</p>
            <p className="text-sm">{formatDateTime(o.created_at)}</p>
          </div>
        </header>

        <section className="mt-4 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-bold">{o.delivery_mode === "PICKUP" ? "Customer (Pickup)" : "Ship to"}</p>
            <p>{o.name}</p>
            <p>{o.address1}</p>
            {o.address2 && <p>{o.address2}</p>}
            <p>
              {o.city}, {o.state} – {o.pincode}
            </p>
            <p>Phone: {o.phone}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">Payment</p>
            <p>{PAYMENT_METHOD_LABEL[o.payment_method]}</p>
            <p>Status: {o.payment_status.replace(/_/g, " ")}</p>
            {o.payment_method === "COD" && o.payment_status !== "PAID" && <p className="mt-1 text-lg font-bold">Collect: {formatINR(o.total)}</p>}
          </div>
        </section>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black text-left">
              <th className="py-2">#</th>
              <th className="py-2">Item</th>
              {!slip && <th className="py-2 text-right">Rate</th>}
              <th className="py-2 text-right">Qty</th>
              {!slip && <th className="py-2 text-right">Amount</th>}
              {slip && <th className="py-2 text-right">Packed ✓</th>}
            </tr>
          </thead>
          <tbody>
            {o.order_items.map((i, n) => (
              <tr key={i.id} className="border-b border-gray-300">
                <td className="py-2">{n + 1}</td>
                <td className="py-2">{i.name}</td>
                {!slip && <td className="py-2 text-right">{formatINR(i.unit_price)}</td>}
                <td className="py-2 text-right">
                  {i.qty} {i.unit}
                </td>
                {!slip && <td className="py-2 text-right">{formatINR(i.line_total)}</td>}
                {slip && <td className="py-2 text-right">☐</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {!slip && (
          <dl className="ml-auto mt-4 w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatINR(o.subtotal)}</dd>
            </div>
            {o.coupon_discount > 0 && (
              <div className="flex justify-between">
                <dt>Coupon ({o.coupon_code})</dt>
                <dd>− {formatINR(o.coupon_discount)}</dd>
              </div>
            )}
            {o.auto_discount > 0 && (
              <div className="flex justify-between">
                <dt>Extra offer</dt>
                <dd>− {formatINR(o.auto_discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{formatINR(o.shipping_fee)}</dd>
            </div>
            {o.cod_fee > 0 && (
              <div className="flex justify-between">
                <dt>COD charges</dt>
                <dd>{formatINR(o.cod_fee)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-black pt-1 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatINR(o.total)}</dd>
            </div>
          </dl>
        )}
        {o.notes && <p className="mt-6 text-sm">Notes: {o.notes}</p>}
        <footer className="mt-10 border-t border-gray-300 pt-3 text-xs text-gray-600">
          Contains fireworks (Class 7). Handle with care, keep away from fire and heat. Use only in permitted areas and time slots.
        </footer>
      </div>
    </div>
  );
}
