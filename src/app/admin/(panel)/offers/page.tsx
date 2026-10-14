import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { comboPricing } from "@/lib/catalog";
import { formatDateTime, formatINR } from "@/lib/format";
import { PageTitle } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { CouponForm } from "@/components/admin/CouponForm";
import { SubmitButton } from "@/components/admin/FormBits";
import { deleteCoupon, saveCombo, toggleCoupon } from "../../actions";

export const metadata = { title: "Offers & Settings" };

function toIstLocal(d: Date) {
  return new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 16);
}

export default async function OffersPage() {
  const [s, coupons, combos] = await Promise.all([
    getSettings(),
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.combo.findMany({ include: { items: { include: { product: true } } }, orderBy: { sortOrder: "asc" } }),
  ]);
  const now = new Date();

  return (
    <>
      <PageTitle title="Offers & Settings" />

      <section className="glass mb-6 rounded-2xl p-5" aria-labelledby="coupons-title">
        <h2 id="coupons-title" className="mb-4 text-lg font-semibold text-gold-300">
          Coupons
        </h2>
        <CouponForm />
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-white/55">
              <tr>
                <th className="py-2 font-medium">Code</th>
                <th className="py-2 font-medium">Discount</th>
                <th className="py-2 font-medium">Min order</th>
                <th className="py-2 font-medium">Expires</th>
                <th className="py-2 font-medium">Used</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {coupons.map((c) => {
                const expired = c.expiresAt && c.expiresAt < now;
                return (
                  <tr key={c.id}>
                    <td className="py-2 font-mono font-semibold">{c.code}</td>
                    <td className="py-2">
                      {c.type === "FREESHIP" ? "Free delivery" : c.type === "PERCENT" ? `${c.value}%` : formatINR(c.value)}
                      {c.maxDiscount ? <span className="text-white/50"> (max {formatINR(c.maxDiscount)})</span> : null}
                    </td>
                    <td className="py-2">{formatINR(c.minOrder)}</td>
                    <td className={`py-2 ${expired ? "text-red-300" : ""}`}>{c.expiresAt ? formatDateTime(c.expiresAt) : "Never"}</td>
                    <td className="py-2">{c.usageCount}</td>
                    <td className="py-2">
                      <form action={toggleCoupon}>
                        <input type="hidden" name="id" value={c.id} />
                        <SubmitButton className={`badge cursor-pointer ${c.active && !expired ? "bg-emerald-700 text-white" : "bg-white/15"}`}>
                          {expired ? "Expired" : c.active ? "Active" : "Paused"}
                        </SubmitButton>
                      </form>
                    </td>
                    <td className="py-2 text-right">
                      <form action={deleteCoupon}>
                        <input type="hidden" name="id" value={c.id} />
                        <SubmitButton className="text-xs text-red-300 hover:underline" confirm={`Delete coupon ${c.code}?`}>
                          Delete
                        </SubmitButton>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass mb-6 rounded-2xl p-5" aria-labelledby="combos-title">
        <h2 id="combos-title" className="mb-1 text-lg font-semibold text-gold-300">
          Combo packs
        </h2>
        <p className="mb-4 text-sm text-white/55">Combo price = sum of product sale prices − extra combo discount %. It updates automatically when product prices change.</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {combos.map((c) => {
            const pr = comboPricing(c.items, c.extraDiscount);
            return (
              <form key={c.id} action={saveCombo} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                <input type="hidden" name="id" value={c.id} />
                <label className="block">
                  <span className="label">Name</span>
                  <input name="name" className="input" defaultValue={c.name} />
                </label>
                <label className="mt-2 block">
                  <span className="label">Tagline</span>
                  <input name="tagline" className="input" defaultValue={c.tagline} />
                </label>
                <ul className="my-3 space-y-0.5 text-white/70">
                  {c.items.map((i) => (
                    <li key={i.id}>
                      {i.product.brand} {i.product.name} × {i.qty}
                    </li>
                  ))}
                </ul>
                <div className="flex items-end gap-3">
                  <label className="w-28">
                    <span className="label">Extra % off</span>
                    <input name="extraDiscount" type="number" min={0} max={50} className="input" defaultValue={c.extraDiscount} />
                  </label>
                  <label className="mb-3 flex items-center gap-2">
                    <input type="checkbox" name="isVisible" defaultChecked={c.isVisible} className="h-5 w-5 accent-amber-400" /> Visible
                  </label>
                </div>
                <p className="mt-2 text-white/70">
                  Now: <b className="text-gold-300">{formatINR(pr.price)}</b> <span className="line-through">{formatINR(pr.mrp)}</span>
                </p>
                <SubmitButton className="btn btn-ghost mt-3 w-full text-sm">Save combo</SubmitButton>
              </form>
            );
          })}
        </div>
      </section>

      <SettingsForm
        v={{
          storeName: s.storeName,
          announcement: s.announcement,
          highlightCoupon: s.highlightCoupon,
          heroTitle: s.heroTitle,
          heroSubtitle: s.heroSubtitle,
          maxDiscountPercent: s.maxDiscountPercent,
          taglines: s.taglines,
          diwaliDateLocal: toIstLocal(s.diwaliDate),
          autoOfferThreshold: s.autoOfferThreshold,
          autoOfferPercent: s.autoOfferPercent,
          shippingFee: s.shippingFee,
          codFee: s.codFee,
          upiQrImage: s.upiQrImage,
          freeShippingAbove: s.freeShippingAbove,
          minOrderValue: s.minOrderValue,
          codEnabled: s.codEnabled,
          upiEnabled: s.upiEnabled,
          upiId: s.upiId,
          upiPayeeName: s.upiPayeeName,
          whatsappNumber: s.whatsappNumber,
          phone: s.phone,
          email: s.email,
          address: s.address,
          licenceNumber: s.licenceNumber,
          restrictionEnabled: s.restrictionEnabled,
          restrictionNotice: s.restrictionNotice,
          blockedPincodePrefixes: s.blockedPincodePrefixes,
          serviceablePrefixes: s.serviceablePrefixes,
          seoCities: s.seoCities,
          razorpayEnabled: s.razorpayEnabled,
        }}
      />
    </>
  );
}
