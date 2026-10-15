import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { must, useLoad } from "@/lib/useLoad";
import { comboPricing } from "@/lib/catalog";
import { formatDateTime, formatINR } from "@/lib/format";
import type { Combo, Coupon, Product, Settings } from "@/lib/types";
import { PageTitle } from "@/components/admin/ui";
import { ActionButton, LoadState } from "@/components/admin/FormBits";
import { CouponForm } from "@/components/admin/CouponForm";
import { SettingsForm } from "@/components/admin/SettingsForm";

type ComboRow = Combo & { combo_items: { id: string; qty: number; product: Pick<Product, "brand" | "name" | "price" | "mrp"> }[] };

async function loadOffers() {
  const [settings, coupons, combos] = await Promise.all([
    supabase.from("settings").select("*").eq("id", 1).single(),
    supabase.from("coupons").select("*").order("created_at", { ascending: false }),
    supabase.from("combos").select("*, combo_items(id, qty, product:products(brand, name, price, mrp))").order("sort_order"),
  ]);
  return { settings: must(settings) as Settings, coupons: must(coupons) as Coupon[], combos: must(combos) as ComboRow[] };
}

export function OffersPage() {
  const store = useStore();
  const { data, error, reload } = useLoad(loadOffers, []);
  const refresh = async () => {
    await Promise.all([reload(), store.reload()]);
  };
  if (!data) return <LoadState error={error} onRetry={reload} />;
  const now = new Date();

  return (
    <>
      <title>Offers &amp; Settings · Admin</title>
      <PageTitle title="Offers & Settings" />

      <section className="glass mb-6 rounded-2xl p-5" aria-labelledby="coupons-title">
        <h2 id="coupons-title" className="mb-4 text-lg font-semibold text-gold-300">
          Coupons
        </h2>
        <CouponForm onSaved={refresh} />
        <ul className="mt-5 space-y-2 md:hidden">
          {data.coupons.map((c) => {
            const expired = c.expires_at && new Date(c.expires_at) < now;
            return (
              <li key={c.id} className="rounded-xl bg-white/5 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold">{c.code}</span>
                  <CouponToggle c={c} expired={Boolean(expired)} onSaved={refresh} />
                </div>
                <p className="mt-1 text-white/75">
                  {c.type === "FREESHIP" ? "Free delivery" : c.type === "PERCENT" ? `${c.value}% off` : `${formatINR(c.value)} off`}
                  {c.max_discount ? ` (max ${formatINR(c.max_discount)})` : ""} · min {formatINR(c.min_order)}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-white/55">
                  <span className={expired ? "text-red-300" : ""}>
                    {c.expires_at ? `Expires ${formatDateTime(c.expires_at)}` : "Never expires"} · used {c.usage_count}
                  </span>
                  <CouponDelete c={c} onSaved={refresh} />
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 hidden overflow-x-auto md:block">
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
              {data.coupons.map((c) => {
                const expired = c.expires_at && new Date(c.expires_at) < now;
                return (
                  <tr key={c.id}>
                    <td className="py-2 font-mono font-semibold">{c.code}</td>
                    <td className="py-2">
                      {c.type === "FREESHIP" ? "Free delivery" : c.type === "PERCENT" ? `${c.value}%` : formatINR(c.value)}
                      {c.max_discount ? <span className="text-white/50"> (max {formatINR(c.max_discount)})</span> : null}
                    </td>
                    <td className="py-2">{formatINR(c.min_order)}</td>
                    <td className={`py-2 ${expired ? "text-red-300" : ""}`}>{c.expires_at ? formatDateTime(c.expires_at) : "Never"}</td>
                    <td className="py-2">{c.usage_count}</td>
                    <td className="py-2">
                      <CouponToggle c={c} expired={Boolean(expired)} onSaved={refresh} />
                    </td>
                    <td className="py-2 text-right">
                      <CouponDelete c={c} onSaved={refresh} />
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
          {data.combos.map((c) => (
            <ComboEditor key={`${c.id}-${c.extra_discount}-${c.is_visible}`} c={c} onSaved={refresh} />
          ))}
        </div>
      </section>

      <SettingsForm key={data.settings.updated_at} v={data.settings} onSaved={refresh} />
    </>
  );
}

function ComboEditor({ c, onSaved }: { c: ComboRow; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(c.name);
  const [tagline, setTagline] = useState(c.tagline);
  const [extra, setExtra] = useState(String(c.extra_discount));
  const [visible, setVisible] = useState(c.is_visible);
  const pr = comboPricing(c.combo_items, Math.min(50, Math.max(0, parseInt(extra, 10) || 0)));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
      <label className="block">
        <span className="label">Name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="mt-2 block">
        <span className="label">Tagline</span>
        <input className="input" value={tagline} onChange={(e) => setTagline(e.target.value)} />
      </label>
      <ul className="my-3 space-y-0.5 text-white/70">
        {c.combo_items.map((i) => (
          <li key={i.id}>
            {i.product.brand} {i.product.name} × {i.qty}
          </li>
        ))}
      </ul>
      <div className="flex items-end gap-3">
        <label className="w-28">
          <span className="label">Extra % off</span>
          <input type="number" min={0} max={50} className="input" value={extra} onChange={(e) => setExtra(e.target.value)} />
        </label>
        <label className="mb-3 flex items-center gap-2">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="h-5 w-5 accent-amber-400" /> Visible
        </label>
      </div>
      <p className="mt-2 text-white/70">
        Now: <b className="text-gold-300">{formatINR(pr.price)}</b> <span className="line-through">{formatINR(pr.mrp)}</span>
      </p>
      <ActionButton
        className="btn btn-ghost mt-3 w-full text-sm"
        onClick={async () => {
          must(
            await supabase
              .from("combos")
              .update({
                name: name.trim() || c.name,
                tagline: tagline.trim(),
                extra_discount: Math.min(50, Math.max(0, parseInt(extra, 10) || 0)),
                is_visible: visible,
              })
              .eq("id", c.id),
          );
          await onSaved();
        }}
      >
        Save combo
      </ActionButton>
    </div>
  );
}

function CouponToggle({ c, expired, onSaved }: { c: Coupon; expired: boolean; onSaved: () => Promise<void> }) {
  return (
    <ActionButton
      className={`badge cursor-pointer ${c.active && !expired ? "bg-emerald-700 text-white" : "bg-white/15"}`}
      onClick={async () => {
        must(await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id));
        await onSaved();
      }}
    >
      {expired ? "Expired" : c.active ? "Active" : "Paused"}
    </ActionButton>
  );
}

function CouponDelete({ c, onSaved }: { c: Coupon; onSaved: () => Promise<void> }) {
  return (
    <ActionButton
      className="text-xs text-red-300 hover:underline"
      confirm={`Delete coupon ${c.code}?`}
      onClick={async () => {
        must(await supabase.from("coupons").delete().eq("id", c.id));
        await onSaved();
      }}
    >
      Delete
    </ActionButton>
  );
}
