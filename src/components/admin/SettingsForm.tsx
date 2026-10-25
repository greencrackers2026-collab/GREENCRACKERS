import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { uploadProductImage } from "@/lib/images";
import type { Settings } from "@/lib/types";

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-white/50">{hint}</span>}
    </label>
  );
}

function Check({ name, label, def }: { name: string; label: string; def: boolean }) {
  return (
    <label className="flex items-center gap-3">
      <input type="checkbox" name={name} defaultChecked={def} className="h-5 w-5 accent-amber-400" />
      {label}
    </label>
  );
}

/** <input type="datetime-local"> has no timezone; the owner works in IST. */
const toIstLocal = (iso: string) => new Date(new Date(iso).getTime() + 5.5 * 3600_000).toISOString().slice(0, 16);

export function SettingsForm({ v, onSaved }: { v: Settings; onSaved: () => Promise<void> }) {
  const [state, setState] = useState<{ error?: string; message?: string }>({});
  const [pending, setPending] = useState(false);
  const [qr, setQr] = useState(v.upi_qr_image);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrErr, setQrErr] = useState<string | null>(null);

  async function uploadQr(file: File | undefined) {
    if (!file) return;
    setQrBusy(true);
    setQrErr(null);
    try {
      setQr(await uploadProductImage(file));
    } catch (e) {
      setQrErr(e instanceof Error ? e.message : "Upload failed");
    }
    setQrBusy(false);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => String(fd.get(k) ?? "").trim();
    const int = (k: string) => parseInt(str(k), 10) || 0;
    const bool = (k: string) => fd.get(k) === "on";

    const rawDate = str("diwali_date");
    const diwali = new Date(`${rawDate}:00+05:30`);
    if (Number.isNaN(diwali.getTime())) return setState({ error: "Enter a valid Diwali date/time." });
    const maxDiscount = int("max_discount_percent");
    if (maxDiscount < 0 || maxDiscount > 95) return setState({ error: "Max discount % must be between 0 and 95." });

    setPending(true);
    const { error } = await supabase
      .from("settings")
      .update({
        store_name: str("store_name") || "Diwali Crackers",
        announcement: str("announcement"),
        highlight_coupon: str("highlight_coupon").toUpperCase(),
        hero_title: str("hero_title"),
        hero_subtitle: str("hero_subtitle"),
        max_discount_percent: maxDiscount,
        taglines: str("taglines")
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean),
        diwali_date: diwali.toISOString(),
        auto_offer_threshold: Math.max(0, int("auto_offer_threshold")),
        auto_offer_percent: Math.min(50, Math.max(0, int("auto_offer_percent"))),
        shipping_fee: Math.max(0, int("shipping_fee")),
        cod_fee: Math.max(0, int("cod_fee")),
        upi_qr_image: qr,
        free_shipping_above: Math.max(0, int("free_shipping_above")),
        min_order_value: Math.max(0, int("min_order_value")),
        cod_enabled: bool("cod_enabled"),
        upi_enabled: bool("upi_enabled"),
        upi_id: str("upi_id"),
        upi_payee_name: str("upi_payee_name"),
        whatsapp_number: str("whatsapp_number").replace(/\D/g, ""),
        phone: str("phone"),
        email: str("email"),
        address: str("address"),
        licence_number: str("licence_number"),
        restriction_enabled: bool("restriction_enabled"),
        restriction_notice: str("restriction_notice"),
        blocked_pincode_prefixes: str("blocked_pincode_prefixes").replace(/[^\d,]/g, ""),
        serviceable_prefixes: str("serviceable_prefixes").replace(/[^\d,]/g, ""),
        seo_cities: str("seo_cities"),
        referral_enabled: bool("referral_enabled"),
        referral_min_order: Math.max(0, int("referral_min_order")),
        referral_reward_max: Math.max(0, int("referral_reward_max")),
        referral_friend_cashback_max: Math.max(0, int("referral_friend_cashback_max")),
        referral_require_purchase: bool("referral_require_purchase"),
        referral_cashback_on_diwali: bool("referral_cashback_on_diwali"),
      })
      .eq("id", 1);
    setPending(false);
    if (error) return setState({ error: error.message });
    setState({ message: "Settings saved. The site is updated." });
    await onSaved();
  }

  const section = "glass grid gap-4 rounded-2xl p-5 sm:grid-cols-2";
  const h = "text-lg font-semibold text-gold-300 sm:col-span-2";

  return (
    <form onSubmit={save} className="space-y-6">
      <section className={section}>
        <h2 className={h}>Offer banner &amp; countdown</h2>
        <Field label="Hero title" wide>
          <input name="hero_title" className="input" defaultValue={v.hero_title} />
        </Field>
        <Field label="Hero subtitle" wide>
          <input name="hero_subtitle" className="input" defaultValue={v.hero_subtitle} />
        </Field>
        <Field label="Rotating taglines (one per line)" wide>
          <textarea name="taglines" className="input min-h-28" defaultValue={v.taglines.join("\n")} />
        </Field>
        <Field label="Announcement bar text" wide>
          <input name="announcement" className="input" defaultValue={v.announcement} />
        </Field>
        <Field label="Highlighted coupon code" hint="Shown in the announcement bar and auto-applied at checkout">
          <input name="highlight_coupon" className="input uppercase" defaultValue={v.highlight_coupon} />
        </Field>
        <Field label="Headline max discount %" hint="Used in titles, e.g. “UP TO 70% OFF”">
          <input name="max_discount_percent" type="number" min={0} max={95} className="input" defaultValue={v.max_discount_percent} />
        </Field>
        <Field label="Diwali date & time (IST)" hint="Countdown target">
          <input name="diwali_date" type="datetime-local" className="input" defaultValue={toIstLocal(v.diwali_date)} required />
        </Field>
      </section>

      <section className={section}>
        <h2 className={h}>Pricing rules</h2>
        <Field label="Extra % off for orders above ₹X: X (₹)">
          <input name="auto_offer_threshold" type="number" min={0} className="input" defaultValue={v.auto_offer_threshold} />
        </Field>
        <Field label="Extra % off" hint="Set 0 to disable the automatic offer">
          <input name="auto_offer_percent" type="number" min={0} max={50} className="input" defaultValue={v.auto_offer_percent} />
        </Field>
        <Field label="COD charges per order (₹)" hint="Added to every Cash on Delivery order">
          <input name="cod_fee" type="number" min={0} className="input" defaultValue={v.cod_fee} />
        </Field>
        <Field label="Delivery fee (₹)" hint="Waived by a Free-delivery coupon such as DIWALI10">
          <input name="shipping_fee" type="number" min={0} className="input" defaultValue={v.shipping_fee} />
        </Field>
        <Field label="Free delivery above (₹)">
          <input name="free_shipping_above" type="number" min={0} className="input" defaultValue={v.free_shipping_above} />
        </Field>
        <Field label="Minimum order value (₹)">
          <input name="min_order_value" type="number" min={0} className="input" defaultValue={v.min_order_value} />
        </Field>
      </section>

      <section className={section}>
        <h2 className={h}>Refer &amp; earn</h2>
        <div className="space-y-3 sm:col-span-2">
          <Check name="referral_enabled" label="Referral codes work at checkout" def={v.referral_enabled} />
          <Check
            name="referral_require_purchase"
            label="Customer must order first: new codes start locked until you tap Activate"
            def={v.referral_require_purchase}
          />
          <Check
            name="referral_cashback_on_diwali"
            label="All cashback is paid on Diwali day (used in WhatsApp messages and checkout)"
            def={v.referral_cashback_on_diwali}
          />
        </div>
        <Field label="Minimum order for a referral (₹)" hint="Friend's sale-price total must be at least this">
          <input name="referral_min_order" type="number" min={0} className="input" defaultValue={v.referral_min_order} />
        </Field>
        <Field label="Referrer cashback: up to (₹)" hint="Per referred order. Shown in the WhatsApp message">
          <input name="referral_reward_max" type="number" min={0} className="input" defaultValue={v.referral_reward_max} />
        </Field>
        <Field label="Friend cashback: up to (₹)" hint="Friend also gets FREE delivery + no COD charges">
          <input name="referral_friend_cashback_max" type="number" min={0} className="input" defaultValue={v.referral_friend_cashback_max} />
        </Field>
      </section>

      <section className={section}>
        <h2 className={h}>Payments</h2>
        <div className="space-y-3 sm:col-span-2">
          <Check name="cod_enabled" label="Cash on Delivery enabled" def={v.cod_enabled} />
          <Check name="upi_enabled" label="Direct UPI (QR / UPI ID) enabled" def={v.upi_enabled} />
        </div>
        <div className="sm:col-span-2">
          <span className="label">UPI QR code (customers scan this, pay, then upload a screenshot)</span>
          <div className="flex flex-wrap items-center gap-4">
            {qr ? (
              <div className="w-36 rounded-xl bg-white p-2">
                <img src={qr} alt="Current UPI QR" width={280} height={280} className="h-auto w-full" />
              </div>
            ) : (
              <p className="text-sm text-saffron-400">No QR uploaded. The UPI option stays hidden until you add one (or a UPI ID).</p>
            )}
            <div className="flex flex-col gap-2">
              <label className="btn btn-ghost cursor-pointer text-sm">
                {qrBusy ? "Uploading…" : qr ? "Replace QR image" : "⬆ Upload QR image"}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => uploadQr(e.target.files?.[0])} />
              </label>
              {qr && (
                <button type="button" className="text-xs text-red-300 underline" onClick={() => setQr("")}>
                  Remove QR
                </button>
              )}
              {qrErr && <span className="text-xs text-red-300">{qrErr}</span>}
            </div>
          </div>
          <span className="mt-1 block text-xs text-white/50">Click “Save all settings” after uploading.</span>
        </div>
        <Field label="UPI ID (optional)">
          <input name="upi_id" className="input" defaultValue={v.upi_id} placeholder="shopname@okaxis" />
        </Field>
        <Field label="UPI payee name">
          <input name="upi_payee_name" className="input" defaultValue={v.upi_payee_name} />
        </Field>
      </section>

      <section className={section}>
        <h2 className={h}>Compliance &amp; delivery area</h2>
        <Field label="Licence number (shown in footer)" wide>
          <input name="licence_number" className="input" defaultValue={v.licence_number} placeholder="Licence No: E/SC/TN/..." />
        </Field>
        <div className="sm:col-span-2">
          <Check name="restriction_enabled" label="Show ban/restriction notice banner" def={v.restriction_enabled} />
        </div>
        <Field label="Restriction notice text" wide>
          <textarea name="restriction_notice" className="input min-h-20" defaultValue={v.restriction_notice} />
        </Field>
        <Field label="Blocked pincode prefixes" hint="Comma separated. e.g. 110,121,122,201 = Delhi-NCR">
          <input name="blocked_pincode_prefixes" className="input font-mono" defaultValue={v.blocked_pincode_prefixes} />
        </Field>
        <Field label="Serviceable pincode prefixes" hint="Comma separated. Leave empty to allow all non-blocked pincodes">
          <input name="serviceable_prefixes" className="input font-mono" defaultValue={v.serviceable_prefixes} />
        </Field>
      </section>

      <section className={section}>
        <h2 className={h}>Store &amp; SEO</h2>
        <Field label="Store name">
          <input name="store_name" className="input" defaultValue={v.store_name} />
        </Field>
        <Field label="WhatsApp number (with country code)" hint="e.g. 919876543210">
          <input name="whatsapp_number" className="input" defaultValue={v.whatsapp_number} />
        </Field>
        <Field label="Phone (display)">
          <input name="phone" className="input" defaultValue={v.phone} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" className="input" defaultValue={v.email} />
        </Field>
        <Field label="Shop address" wide>
          <input name="address" className="input" defaultValue={v.address} />
        </Field>
        <Field label="SEO target cities" hint="Comma separated; used for local keywords and footer copy" wide>
          <input name="seo_cities" className="input" defaultValue={v.seo_cities} />
        </Field>
      </section>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 flex flex-wrap items-center gap-3 lg:bottom-4">
        <button className="btn btn-primary px-8" disabled={pending || qrBusy}>
          {pending ? "Saving…" : "Save all settings"}
        </button>
        {state.message && (
          <p className="rounded-xl bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200" role="status">
            {state.message}
          </p>
        )}
        {state.error && (
          <p className="rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-200" role="alert">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
