import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatDateTime, formatINR } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { RazorpayPay } from "@/components/checkout/RazorpayPay";
import { UpiRefForm } from "@/components/checkout/UpiRefForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order Confirmation", robots: { index: false, follow: false } };

const PAY_STATUS: Record<string, string> = {
  PENDING: "Payment pending",
  AWAITING_VERIFICATION: "Payment being verified",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pay?: string }>;
}) {
  const [{ id }, { pay }] = await Promise.all([params, searchParams]);
  const [order, s] = await Promise.all([prisma.order.findUnique({ where: { id }, include: { items: true } }), getSettings()]);
  if (!order) notFound();

  const needsRazorpay = order.paymentMethod === "RAZORPAY" && order.paymentStatus !== "PAID" && order.status !== "CANCELLED";
  const showUpi = order.paymentMethod === "UPI" && order.paymentStatus !== "PAID" && order.status !== "CANCELLED";
  const upiUri = `upi://pay?pa=${encodeURIComponent(s.upiId)}&pn=${encodeURIComponent(s.upiPayeeName || s.storeName)}&am=${order.total}&cu=INR&tn=${encodeURIComponent(order.orderNumber)}`;
  const qr = showUpi && s.upiId && !s.upiQrImage ? await QRCode.toDataURL(upiUri, { margin: 1, width: 240 }) : null;
  const savings = order.mrpTotal - order.subtotal + order.couponDiscount + order.autoDiscount;


  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="glass glow-gold rounded-3xl p-6 text-center sm:p-8">
        <p className="text-5xl" aria-hidden="true">
          {needsRazorpay ? "🧾" : "🎉"}
        </p>
        <h1 className="mt-3 font-display text-3xl text-gradient sm:text-4xl">
          {needsRazorpay
            ? "Complete your payment"
            : order.paymentMethod === "UPI" && order.paymentStatus !== "PAID" && order.status !== "CANCELLED"
              ? "Order received!"
              : "Thank you! Order placed"}
        </h1>
        <p className="mt-2 text-white/75">
          Order ID: <b className="font-mono text-gold-300">{order.orderNumber}</b>
        </p>
        <p className="text-sm text-white/55">{formatDateTime(order.createdAt)}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
          <span className="badge bg-white/10 text-white">Status: {order.status}</span>
          <span className={`badge ${order.paymentStatus === "PAID" ? "bg-emerald-700 text-white" : "bg-saffron-500/80 text-black"}`}>
            {PAY_STATUS[order.paymentStatus] ?? order.paymentStatus}
          </span>
        </div>
        <p className="mt-3 text-sm text-white/60">Please save your order ID. We will call you on {order.phone} to confirm.</p>
      </div>

      {needsRazorpay && (
        <section className="glass mt-6 rounded-3xl p-6" aria-label="Payment">
          <p className="mb-3 text-white/80">
            Amount to pay: <b className="text-xl text-gold-300">{formatINR(order.total)}</b>
          </p>
          <RazorpayPay orderId={order.id} autoOpen={pay === "1"} />
        </section>
      )}

      {showUpi &&
        (order.paymentProof && order.paymentStatus === "AWAITING_VERIFICATION" ? (
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
            {(s.upiQrImage || qr) && (
              <div className="mx-auto w-48 rounded-2xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.upiQrImage || qr!} alt={`UPI QR code to pay ${formatINR(order.total)}`} className="h-auto w-full" />
              </div>
            )}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-gold-300">Pay {formatINR(order.total)} via UPI</h2>
              <p className="text-sm text-white/75">
                Scan the QR with GPay, PhonePe, Paytm or any UPI app
                {s.upiId && (
                  <>
                    {" "}or pay to UPI ID <b className="font-mono text-white">{s.upiId}</b>
                  </>
                )}
                , then upload the payment screenshot below.
              </p>
              {s.upiId && (
                <a href={upiUri} className="btn btn-ghost sm:hidden">
                  Open UPI app
                </a>
              )}
              <UpiRefForm orderId={order.id} />
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
              {i.image && <Image src={i.image} alt="" width={52} height={52} className="h-13 w-13 rounded-xl object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{i.name}</p>
                <p className="text-sm text-white/60">
                  {formatINR(i.unitPrice)} × {i.qty}
                </p>
              </div>
              <p className="font-semibold">{formatINR(i.lineTotal)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatINR(order.subtotal)}</dd>
          </div>
          {order.couponDiscount > 0 && (
            <div className="flex justify-between text-festive-green">
              <dt>Coupon ({order.couponCode})</dt>
              <dd>− {formatINR(order.couponDiscount)}</dd>
            </div>
          )}
          {order.autoDiscount > 0 && (
            <div className="flex justify-between text-festive-green">
              <dt>Extra offer</dt>
              <dd>− {formatINR(order.autoDiscount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{order.shippingFee ? formatINR(order.shippingFee) : "FREE"}</dd>
          </div>
          {order.codFee > 0 && (
            <div className="flex justify-between">
              <dt>COD charges</dt>
              <dd>{formatINR(order.codFee)}</dd>
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
          <h2 className="font-semibold text-gold-300">{order.deliveryMode === "PICKUP" ? "Pickup from shop" : "Delivery address"}</h2>
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
          <p className="mt-2 text-white/75">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/products" className="btn btn-ghost">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
