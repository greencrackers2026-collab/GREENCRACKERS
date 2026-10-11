import "server-only";
import { cache } from "react";
import { prisma } from "./db";
import { parseJSON } from "./format";

export type SiteSettings = Awaited<ReturnType<typeof loadSettings>>;

async function loadSettings() {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error("Settings row missing. Run `npm run seed`.");
  return {
    ...s,
    taglines: parseJSON<string[]>(s.taglines, []),
    seoCityList: s.seoCities
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
    razorpayEnabled: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
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
    razorpayEnabled: s.razorpayEnabled,
    minOrderValue: s.minOrderValue,
    freeShippingAbove: s.freeShippingAbove,
    shippingFee: s.shippingFee,
    autoOfferThreshold: s.autoOfferThreshold,
    autoOfferPercent: s.autoOfferPercent,
  };
}

export type PublicSettings = ReturnType<typeof publicSettings>;
