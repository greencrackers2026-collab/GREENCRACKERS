import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ORDER_STATUSES, PAYMENT_METHOD_LABEL, PAYMENT_STATUSES } from "@/lib/constants";
import { formatDateTime, formatINR, waLink } from "@/lib/format";
import { PageTitle, StatusBadge } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/FormBits";
import { updateOrder } from "../../../actions";

export const metadata = { title: "Order details" };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await prisma.order.findUnique({ where: { id }, include: { items: true, customer: { include: { _count: { select: { orders: true } } } } } });
  if (!o) notFound();

  return (
    <>
      <PageTitle title={`Order ${o.orderNumber}`}>
        <Link href={`/admin/print/${o.id}?type=invoice`} target="_blank" className="btn btn-ghost text-sm">
          🖨️ Invoice
        </Link>
        <Link href={`/admin/print/${o.id}?type=slip`} target="_blank" className="btn btn-ghost text-sm">
          📦 Packing slip
        </Link>
        <a
          href={waLink(`91${o.phone}`, `Hi ${o.name}, this is regarding your Diwali crackers order ${o.orderNumber}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn bg-[#25D366] text-sm text-[#06290f]"
        >
          WhatsApp customer
        </a>
      </PageTitle>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={o.status} />
              <StatusBadge value={o.paymentStatus} />
              <span className="text-sm text-white/60">· {formatDateTime(o.createdAt)}</span>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-white/55">
                <tr>
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 text-right font-medium">Price</th>
                  <th className="pb-2 text-right font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {o.items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2">
                      {i.name}
                      {i.kind === "COMBO" && <span className="badge ml-2 bg-fuchsia-600/40">COMBO</span>}
                    </td>
                    <td className="py-2 text-right">{formatINR(i.unitPrice)}</td>
                    <td className="py-2 text-right">{i.qty}</td>
                    <td className="py-2 text-right font-semibold">{formatINR(i.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="ml-auto mt-4 max-w-xs space-y-1 border-t border-white/10 pt-3 text-sm">
              <div className="flex justify-between text-white/50">
                <dt>MRP total</dt>
                <dd className="line-through">{formatINR(o.mrpTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatINR(o.subtotal)}</dd>
              </div>
              {o.couponDiscount > 0 && (
                <div className="flex justify-between text-festive-green">
                  <dt>Coupon {o.couponCode}</dt>
                  <dd>− {formatINR(o.couponDiscount)}</dd>
                </div>
              )}
              {o.autoDiscount > 0 && (
                <div className="flex justify-between text-festive-green">
                  <dt>Auto offer</dt>
                  <dd>− {formatINR(o.autoDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd>{o.shippingFee ? formatINR(o.shippingFee) : "FREE"}</dd>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <dt>Total</dt>
                <dd>{formatINR(o.total)}</dd>
              </div>
            </dl>
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
              {o.customer && <p className="mt-1 text-xs text-white/50">{o.customer._count.orders} order(s) from this number</p>}
            </div>
            <div>
              <h2 className="font-semibold text-gold-300">{o.deliveryMode === "PICKUP" ? "Pickup (address on file)" : "Delivery address"}</h2>
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
              <p className="mt-2">{PAYMENT_METHOD_LABEL[o.paymentMethod]}</p>
              {o.upiRef && (
                <p className="text-white/75">
                  UPI ref / UTR: <b className="font-mono">{o.upiRef}</b>
                </p>
              )}
              {o.razorpayPaymentId && <p className="text-white/75">Razorpay payment: <span className="font-mono">{o.razorpayPaymentId}</span></p>}
              {o.razorpayOrderId && <p className="text-white/50">Razorpay order: <span className="font-mono">{o.razorpayOrderId}</span></p>}
            </div>
          </section>
        </div>

        <section className="glass h-fit rounded-2xl p-5">
          <h2 className="font-semibold">Update order</h2>
          <form action={updateOrder} className="mt-4 space-y-4">
            <input type="hidden" name="id" value={o.id} />
            <label className="block">
              <span className="label">Order status</span>
              <select name="status" defaultValue={o.status} className="input" disabled={o.status === "CANCELLED"}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              {o.status === "CANCELLED" && <span className="mt-1 block text-xs text-white/50">Cancelled orders are locked (stock was returned).</span>}
            </label>
            <label className="block">
              <span className="label">Payment status</span>
              <select name="paymentStatus" defaultValue={o.paymentStatus} className="input">
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Internal note</span>
              <textarea name="adminNote" defaultValue={o.adminNote ?? ""} className="input min-h-24" placeholder="Courier, tracking no., call notes…" />
            </label>
            <SubmitButton className="btn btn-primary w-full">Save changes</SubmitButton>
            <p className="text-xs text-white/50">Setting status to CANCELLED returns the items to stock.</p>
          </form>
        </section>
      </div>
    </>
  );
}
