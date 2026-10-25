import { absoluteUrl } from "./seo";
import { formatINR } from "./format";
import type { Order, ReferralCode, Settings } from "./types";

type ReferralSettings = Pick<Settings, "store_name" | "referral_min_order" | "referral_reward_max" | "referral_friend_cashback_max">;

/** Suggested code from the referrer's first name, e.g. "Ravi Kumar" → RAVI482. */
export function suggestReferralCode(name: string) {
  const base = (name.trim().split(/\s+/)[0] ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8);
  return `${base.length >= 2 ? base : "REF"}${100 + Math.floor(Math.random() * 900)}`;
}

export const formatDay = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** Short WhatsApp message that hands a customer their referral code. */
export function referralInviteMessage(r: Pick<ReferralCode, "code" | "referrer_name" | "expires_at">, s: ReferralSettings) {
  return [
    `Hi ${firstName(r.referrer_name)} 🪔`,
    `Your referral code from *${s.store_name}*: *${r.code}*`,
    "",
    `💰 Share it with friends. Earn up to *${formatINR(s.referral_reward_max)} cashback* for every friend who orders ${formatINR(s.referral_min_order)}+ with your code.`,
    `🎁 Your friend gets FREE delivery + no COD charges + up to ${formatINR(s.referral_friend_cashback_max)} cashback.`,
    "",
    `${r.expires_at ? `Valid till ${formatDay(r.expires_at)}. ` : ""}Shop: ${absoluteUrl("/")}`,
  ].join("\n");
}

/** Tells the referrer their cashback for a friend's order has been sent. */
export function referrerCashbackMessage(r: Pick<ReferralCode, "code" | "referrer_name">, o: Pick<Order, "name" | "referrer_cashback">, storeName: string) {
  return [
    `Hi ${firstName(r.referrer_name)} 🎉`,
    `Your friend ${firstName(o.name)} ordered with your code *${r.code}*. We've sent you *${formatINR(o.referrer_cashback)} cashback*.`,
    "Keep sharing your code to earn more! Happy Diwali 🪔",
    `- ${storeName}`,
  ].join("\n");
}

/** Tells the friend their cashback for using a referral code has been sent. */
export function friendCashbackMessage(o: Pick<Order, "name" | "order_number" | "referral_code" | "friend_cashback">, storeName: string) {
  return [
    `Hi ${firstName(o.name)} 🎉`,
    `Thanks for ordering with referral code *${o.referral_code}*. We've sent you *${formatINR(o.friend_cashback)} cashback* for order ${o.order_number}.`,
    "Happy Diwali 🪔",
    `- ${storeName}`,
  ].join("\n");
}
