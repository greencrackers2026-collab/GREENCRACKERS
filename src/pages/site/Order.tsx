import { Link, useParams } from "react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";
import { formatDateTime, formatINR } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import type { PublicOrder } from "@/lib/types";
import { UpiRefForm } from "@/components/checkout/UpiRefForm";
import { NotFound } from "./NotFound";

const PAY_STATUS: Record<string, string> = {
  PENDING: "Payment pending",
  AWAITING_VERIFICATION: "Payment being verified",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function OrderPage() {
  const { id = "" } = useParams();
  const { settings: s } = useStore();
  const { data: order, error, loading, reload } = useLoad(async () => {
    if (!UUID_RE.test(id)) return null;
    const { data, error } = await supabase.rpc("get_order", { p_id: id });
    if (error) throw error;
    return data as PublicOrder | null;
  }, [id]);
  const [qr, setQr] = useState<string | null>(null);

  const showUpi = order?.payment_method === "UPI" && order.payment_status !== "PAID" && order.status !== "CANCELLED";
  const upiUri = order
    ? `upi://pay?pa=${encodeURIComponent(s.upi_id)}&pn=${encodeURIComponent(s.upi_payee_name || s.store_name)}&am=${order.total}&cu=INR&tn=${encodeURIComponent(order.order_number)}`
    : "";

  useEffect(() => {
    if (!showUpi || !s.upi_id || s.upi_qr_image) return;
    import("qrcode")
      .then((QRCode) => QRCode.toDataURL(upiUri, { margin: 1, width: 240 }))
      .then(setQr, () => setQr(null));
  }, [showUpi, s.upi_id, s.upi_qr_image, upiUri]);

  if (loading && !order) return <div className="mx-auto mt-10 h-96 max-w-3xl animate-pulse rounded-3xl bg-white/5 px-4" aria-busy="true" />;
  if (error)
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-white/75">{error}</p>
        <button className="btn btn-primary mt-4" onClick={reload}>
          Try again
        </button>
      </div>
    );
  if (!order) return <NotFound />;

  const savings = order.mrp_total - order.subtotal + order.coupon_discount + order.auto_discount;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <title>{`Order ${order.order_number}`}</title>
      <meta name="robots" content="noindex, nofollow" />
      <div className="glass glow-gold rounded-3xl p-6 text-center sm:p-8">
        <p className="text-5xl" aria-hidden="true">
          🎉
        </p>
        <h1 className="mt-3 font-display text-3xl text-gradient sm:text-4xl">{showUpi ? "Order received!" : "Thank you! Order placed"}</h1>
        <p className="mt-2 text-white/75">
          Order ID: <b className="font-mono text-gold-300">{order.order_number}</b>
        </p>
        <p className="text-sm text-white/55">{formatDateTime(order.created_at)}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
          <span className="badge bg-white/10 text-white">Status: {order.status}</span>
          <span className={`badge ${order.payment_status === "PAID" ? "bg-emerald-700 text-white" : "bg-saffron-500/80 text-black"}`}>
            {PAY_STATUS[order.payment_status] ?? order.payment_status}
          </span>
        </div>
        <p className="mt-3 text-sm text-white/60">Please save your order ID. We will call you on {order.phone} to confirm.</p>
      </div>

      {showUpi &&
        (order.has_payment_proof && order.payment_status === "AWAITING_VERIFICATION" ? (
          <section className="glass mt-6 rounded-3xl p-6 text-center" aria-label="Payment verification">
            <p className="text-3xl" aria-hidden="true">
              🔍
            </p>
            <h2 className="mt-2 text-lg font-bold text-gold-300">Payment screenshot received</h2>
            <p className="mt-1 text-sm text-white/75">
              We&apos;re verifying your UPI payment of <b>{formatINR(order.total)}</b>. Your order will be confirmed once it&apos;s
              verified, usually within a few hours. We&apos;ll update you shortly.
            </p>
          </section>
        ) : (
          <section className="glass mt-6 grid gap-6 rounded-3xl p-6 sm:grid-cols-[auto_1fr]" aria-label="Pay by UPI">
            {(s.upi_qr_image || qr) && (
              <div className="mx-auto w-48 rounded-2xl bg-white p-3">
                <img src={s.upi_qr_image || qr!} alt={`UPI QR code to pay ${formatINR(order.total)}`} className="h-auto w-full" />
              </div>
            )}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-gold-300">Pay {formatINR(order.total)} via UPI</h2>
              <p className="text-sm text-white/75">
                Scan the QR with GPay, PhonePe, Paytm or any UPI app
                {s.upi_id && (
                  <>
                    {" "}or pay to UPI ID <b className="font-mono text-white">{s.upi_id}</b>
                  </>
                )}
                , then upload the payment screenshot below.
              </p>
              {s.upi_id && (
                <a href={upiUri} className="btn btn-ghost sm:hidden">
                  Open UPI app
                </a>
              )}
              <UpiRefForm orderId={order.id} onSaved={reload} />
            </div>
          </section>
        ))}

      <section className="glass mt-6 rounded-3xl p-6" aria-labelledby="items-title">
        <h2 id="items-title" className="text-lg font-bold text-gold-300">
          Items
        </h2>
        <ul className="mt-4 divide-y divide-white/10">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-3">
              {i.image && <img src={i.image} alt="" width={52} height={52} loading="lazy" className="h-13 w-13 rounded-xl object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{i.name}</p>
                <p className="text-sm text-white/60">
                  {formatINR(i.unit_price)} × {i.qty}
                </p>
              </div>
              <p className="font-semibold">{formatINR(i.line_total)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatINR(order.subtotal)}</dd>
          </div>
          {order.coupon_discount > 0 && (
            <div className="flex justify-between text-festive-green">
              <dt>Coupon ({order.coupon_code})</dt>
              <dd>− {formatINR(order.coupon_discount)}</dd>
            </div>
          )}
          {order.auto_discount > 0 && (
            <div className="flex justify-between text-festive-green">
              <dt>Extra offer</dt>
              <dd>− {formatINR(order.auto_discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{order.shipping_fee ? formatINR(order.shipping_fee) : "FREE"}</dd>
          </div>
          {order.cod_fee > 0 && (
            <div className="flex justify-between">
              <dt>COD charges</dt>
              <dd>{formatINR(order.cod_fee)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-white/10 pt-2 text-lg font-bold">
            <dt>Total</dt>
            <dd>{formatINR(order.total)}</dd>
          </div>
          {savings > 0 && <p className="text-right text-festive-green">You saved {formatINR(savings)} 🎉</p>}
        </dl>
      </section>

      <section className="glass mt-6 grid gap-4 rounded-3xl p-6 text-sm sm:grid-cols-2">
        <div>
          <h2 className="font-semibold text-gold-300">{order.delivery_mode === "PICKUP" ? "Pickup from shop" : "Delivery address"}</h2>
          <address className="mt-2 not-italic text-white/75">
            {order.name}
            <br />
            {order.address1}
            {order.address2 && <>, {order.address2}</>}
            <br />
            {order.city}, {order.state} {order.pincode}
          </address>
        </div>
        <div>
          <h2 className="font-semibold text-gold-300">Payment</h2>
          <p className="mt-2 text-white/75">{PAYMENT_METHOD_LABEL[order.payment_method]}</p>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/products" className="btn btn-ghost">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
