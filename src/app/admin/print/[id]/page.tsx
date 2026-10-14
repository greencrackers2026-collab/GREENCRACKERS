import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatDateTime, formatINR } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { PrintButton } from "@/components/admin/FormBits";

export const dynamic = "force-dynamic";
export const metadata = { title: "Print" };

export default async function PrintPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> }) {
  await requireAdmin();
  const [{ id }, { type }] = await Promise.all([params, searchParams]);
  const [o, s] = await Promise.all([prisma.order.findUnique({ where: { id }, include: { items: true } }), getSettings()]);
  if (!o) notFound();
  const slip = type === "slip";

  return (
    <div className="min-h-dvh bg-white p-6 text-black print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="no-print mb-6 flex justify-end">
          <PrintButton />
        </div>
        <header className="flex items-start justify-between border-b-2 border-black pb-4">
          <div>
            <h1 className="text-2xl font-bold">{s.storeName}</h1>
            <p className="text-sm">{s.address}</p>
            <p className="text-sm">
              {s.phone} {s.email && `· ${s.email}`}
            </p>
            {s.licenceNumber && <p className="text-xs">{s.licenceNumber}</p>}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold uppercase">{slip ? "Packing Slip" : "Invoice"}</p>
            <p className="font-mono">{o.orderNumber}</p>
            <p className="text-sm">{formatDateTime(o.createdAt)}</p>
          </div>
        </header>

        <section className="mt-4 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-bold">{o.deliveryMode === "PICKUP" ? "Customer (Pickup)" : "Ship to"}</p>
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
            <p>{PAYMENT_METHOD_LABEL[o.paymentMethod]}</p>
            <p>Status: {o.paymentStatus.replace(/_/g, " ")}</p>
            {o.paymentMethod === "COD" && o.paymentStatus !== "PAID" && <p className="mt-1 text-lg font-bold">Collect: {formatINR(o.total)}</p>}
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
            {o.items.map((i, n) => (
              <tr key={i.id} className="border-b border-gray-300">
                <td className="py-2">{n + 1}</td>
                <td className="py-2">{i.name}</td>
                {!slip && <td className="py-2 text-right">{formatINR(i.unitPrice)}</td>}
                <td className="py-2 text-right">
                  {i.qty} {i.unit}
                </td>
                {!slip && <td className="py-2 text-right">{formatINR(i.lineTotal)}</td>}
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
            {o.couponDiscount > 0 && (
              <div className="flex justify-between">
                <dt>Coupon ({o.couponCode})</dt>
                <dd>− {formatINR(o.couponDiscount)}</dd>
              </div>
            )}
            {o.autoDiscount > 0 && (
              <div className="flex justify-between">
                <dt>Extra offer</dt>
                <dd>− {formatINR(o.autoDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{formatINR(o.shippingFee)}</dd>
            </div>
            {o.codFee > 0 && (
              <div className="flex justify-between">
                <dt>COD charges</dt>
                <dd>{formatINR(o.codFee)}</dd>
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
