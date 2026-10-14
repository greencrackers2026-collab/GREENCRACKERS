import "server-only";
import { cache } from "react";
import { prisma } from "./db";
import { parseJSON } from "./format";

export type SiteSettings = Awaited<ReturnType<typeof loadSettings>>;

async function loadSettings() {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error("Settings row missing. Run `npm run seed`.");
  // The highlighted coupon is auto-applied at checkout when it is active and not expired.
  const c = s.highlightCoupon ? await prisma.coupon.findUnique({ where: { code: s.highlightCoupon } }) : null;
  const autoCoupon = c && c.active && (!c.expiresAt || c.expiresAt > new Date()) ? { code: c.code, type: c.type, value: c.value } : null;
  return {
    ...s,
    taglines: parseJSON<string[]>(s.taglines, []),
    seoCityList: s.seoCities
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
    razorpayEnabled: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    upiAvailable: s.upiEnabled && Boolean(s.upiQrImage || s.upiId),
    autoCoupon,
  };
}

export const getSettings = cache(loadSettings);

/** Subset that is safe and useful to send to client components. */
export function publicSettings(s: SiteSettings) {
  return {
    storeName: s.storeName,
    whatsappNumber: s.whatsappNumber,
    blockedPincodePrefixes: s.blockedPincodePrefixes,
    serviceablePrefixes: s.serviceablePrefixes,
    codEnabled: s.codEnabled,
    upiEnabled: s.upiEnabled,
    upiId: s.upiId,
    upiQrImage: s.upiQrImage,
    upiAvailable: s.upiAvailable,
    codFee: s.codFee,
    autoCoupon: s.autoCoupon,
    razorpayEnabled: s.razorpayEnabled,
    minOrderValue: s.minOrderValue,
    freeShippingAbove: s.freeShippingAbove,
    shippingFee: s.shippingFee,
    autoOfferThreshold: s.autoOfferThreshold,
    autoOfferPercent: s.autoOfferPercent,
  };
}

export type PublicSettings = ReturnType<typeof publicSettings>;
