"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { saveSettings } from "@/app/admin/actions";

export type SettingsFormValues = {
  storeName: string;
  announcement: string;
  highlightCoupon: string;
  heroTitle: string;
  heroSubtitle: string;
  maxDiscountPercent: number;
  taglines: string[];
  diwaliDateLocal: string;
  autoOfferThreshold: number;
  autoOfferPercent: number;
  shippingFee: number;
  codFee: number;
  upiQrImage: string;
  freeShippingAbove: number;
  minOrderValue: number;
  codEnabled: boolean;
  upiEnabled: boolean;
  upiId: string;
  upiPayeeName: string;
  whatsappNumber: string;
  phone: string;
  email: string;
  address: string;
  licenceNumber: string;
  restrictionEnabled: boolean;
  restrictionNotice: string;
  blockedPincodePrefixes: string;
  serviceablePrefixes: string;
  seoCities: string;
  razorpayEnabled: boolean;
};

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

export function SettingsForm({ v }: { v: SettingsFormValues }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  const [qr, setQr] = useState(v.upiQrImage);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrErr, setQrErr] = useState<string | null>(null);
  async function uploadQr(file: File | undefined) {
    if (!file) return;
    setQrBusy(true);
    setQrErr(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    setQrBusy(false);
    if (res.ok) setQr(data.url);
    else setQrErr(data.error ?? "Upload failed");
  }
  const section = "glass grid gap-4 rounded-2xl p-5 sm:grid-cols-2";
  const h = "text-lg font-semibold text-gold-300 sm:col-span-2";

  return (
    <form action={action} className="space-y-6">
      <section className={section}>
        <h2 className={h}>Offer banner &amp; countdown</h2>
        <Field label="Hero title" wide>
          <input name="heroTitle" className="input" defaultValue={v.heroTitle} />
        </Field>
        <Field label="Hero subtitle" wide>
          <input name="heroSubtitle" className="input" defaultValue={v.heroSubtitle} />
        </Field>
        <Field label="Rotating taglines (one per line)" wide>
          <textarea name="taglines" className="input min-h-28" defaultValue={v.taglines.join("\n")} />
        </Field>
        <Field label="Announcement bar text" wide>
          <input name="announcement" className="input" defaultValue={v.announcement} />
        </Field>
        <Field label="Highlighted coupon code" hint="Shown in the announcement bar and FAQ">
          <input name="highlightCoupon" className="input uppercase" defaultValue={v.highlightCoupon} />
        </Field>
        <Field label="Headline max discount %" hint="Used in titles, e.g. “UP TO 70% OFF”">
          <input name="maxDiscountPercent" type="number" min={0} max={95} className="input" defaultValue={v.maxDiscountPercent} />
        </Field>
        <Field label="Diwali date & time (IST)" hint="Countdown target">
          <input name="diwaliDate" type="datetime-local" className="input" defaultValue={v.diwaliDateLocal} required />
        </Field>
      </section>

      <section className={section}>
        <h2 className={h}>Pricing rules</h2>
        <Field label="Extra % off for orders above ₹X: X (₹)">
          <input name="autoOfferThreshold" type="number" min={0} className="input" defaultValue={v.autoOfferThreshold} />
        </Field>
        <Field label="Extra % off" hint="Set 0 to disable the automatic offer">
          <input name="autoOfferPercent" type="number" min={0} max={50} className="input" defaultValue={v.autoOfferPercent} />
        </Field>
        <Field label="COD charges per order (₹)" hint="Added to every Cash on Delivery order">
          <input name="codFee" type="number" min={0} className="input" defaultValue={v.codFee} />
        </Field>
        <Field label="Delivery fee (₹)" hint="Waived by a Free-delivery coupon such as DIWALI10">
          <input name="shippingFee" type="number" min={0} className="input" defaultValue={v.shippingFee} />
        </Field>
        <Field label="Free delivery above (₹)">
          <input name="freeShippingAbove" type="number" min={0} className="input" defaultValue={v.freeShippingAbove} />
        </Field>
        <Field label="Minimum order value (₹)">
          <input name="minOrderValue" type="number" min={0} className="input" defaultValue={v.minOrderValue} />
        </Field>
      </section>

      <section className={section}>
        <h2 className={h}>Payments</h2>
        <div className="space-y-3 sm:col-span-2">
          <Check name="codEnabled" label="Cash on Delivery enabled" def={v.codEnabled} />
          <Check name="upiEnabled" label="Direct UPI (QR / UPI ID) enabled" def={v.upiEnabled} />
          <p className="text-sm text-white/60">
            Razorpay: {v.razorpayEnabled ? <span className="text-festive-green">connected ✓</span> : "not configured (add RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET to .env)"}
          </p>
        </div>
        <div className="sm:col-span-2">
          <span className="label">UPI QR code (customers scan this, pay, then upload a screenshot)</span>
          <input type="hidden" name="upiQrImage" value={qr} />
          <div className="flex flex-wrap items-center gap-4">
            {qr ? (
              <div className="w-36 rounded-xl bg-white p-2">
                <Image src={qr} alt="Current UPI QR" width={280} height={280} className="h-auto w-full" />
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
          <input name="upiId" className="input" defaultValue={v.upiId} placeholder="shopname@okaxis" />
        </Field>
        <Field label="UPI payee name">
          <input name="upiPayeeName" className="input" defaultValue={v.upiPayeeName} />
        </Field>
      </section>

      <section className={section}>
        <h2 className={h}>Compliance &amp; delivery area</h2>
        <Field label="Licence number (shown in footer)" wide>
          <input name="licenceNumber" className="input" defaultValue={v.licenceNumber} placeholder="Licence No: E/SC/TN/..." />
        </Field>
        <div className="sm:col-span-2">
          <Check name="restrictionEnabled" label="Show ban/restriction notice banner" def={v.restrictionEnabled} />
        </div>
        <Field label="Restriction notice text" wide>
          <textarea name="restrictionNotice" className="input min-h-20" defaultValue={v.restrictionNotice} />
        </Field>
        <Field label="Blocked pincode prefixes" hint="Comma separated. e.g. 110,121,122,201 = Delhi-NCR">
          <input name="blockedPincodePrefixes" className="input font-mono" defaultValue={v.blockedPincodePrefixes} />
        </Field>
        <Field label="Serviceable pincode prefixes" hint="Comma separated. Leave empty to allow all non-blocked pincodes">
          <input name="serviceablePrefixes" className="input font-mono" defaultValue={v.serviceablePrefixes} />
        </Field>
      </section>

      <section className={section}>
        <h2 className={h}>Store &amp; SEO</h2>
        <Field label="Store name">
          <input name="storeName" className="input" defaultValue={v.storeName} />
        </Field>
        <Field label="WhatsApp number (with country code)" hint="e.g. 919876543210">
          <input name="whatsappNumber" className="input" defaultValue={v.whatsappNumber} />
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
          <input name="seoCities" className="input" defaultValue={v.seoCities} />
        </Field>
      </section>

      <div className="sticky bottom-4 z-10 flex items-center gap-4">
        <button className="btn btn-primary px-8" disabled={pending}>
          {pending ? "Saving…" : "Save all settings"}
        </button>
        {state?.message && (
          <p className="rounded-xl bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200" role="status">
            {state.message}
          </p>
        )}
        {state?.error && (
          <p className="rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-200" role="alert">
            {state.error}
          </p>
        )}
      </div>
    </form>
  );
}
