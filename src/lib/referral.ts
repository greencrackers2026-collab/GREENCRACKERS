import { absoluteUrl } from "./seo";
import { formatINR } from "./format";
import type { Order, ReferralCode, Settings } from "./types";

type ReferralSettings = Pick<
  Settings,
  | "store_name"
  | "diwali_date"
  | "referral_min_order"
  | "referral_reward_max"
  | "referral_friend_cashback_max"
  | "referral_cashback_on_diwali"
>;

/** Suggested code from the referrer's first name, e.g. "Ravi Kumar" → RAVI482. */
export function suggestReferralCode(name: string) {
  const base = (name.trim().split(/\s+/)[0] ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8);
  return `${base.length >= 2 ? base : "REF"}${100 + Math.floor(Math.random() * 900)}`;
}

export const formatDay = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** When customers get their cashback, e.g. "on Diwali day (8 Nov)". */
export const cashbackWhen = (s: Pick<Settings, "diwali_date" | "referral_cashback_on_diwali">) =>
  s.referral_cashback_on_diwali ? `on Diwali day (${formatDay(s.diwali_date)})` : "after delivery";

/**
 * WhatsApp message that explains the whole offer to the customer.
 * A locked code asks them to place their own order first; an active code tells them to start sharing.
 */
export function referralInviteMessage(r: Pick<ReferralCode, "code" | "referrer_name" | "expires_at" | "active">, s: ReferralSettings) {
  const min = formatINR(s.referral_min_order);
  return [
    `Hi ${firstName(r.referrer_name)} 🪔`,
    "",
    r.active
      ? `🎉 Your referral code *${r.code}* is now *ACTIVE* ✅`
      : `Thank you for choosing *${s.store_name}*! 🎆 Here is your personal referral code: *${r.code}*`,
    "",
    "*🎁 REFER & EARN – DIWALI OFFER*",
    `💰 *You earn up to ${formatINR(s.referral_reward_max)} cashback* for every friend who orders crackers worth ${min} or more with your code.`,
    "👫 *Your friend gets:*",
    "   • FREE home delivery",
    "   • NO Cash-on-Delivery charges",
    `   • Up to ${formatINR(s.referral_friend_cashback_max)} cashback`,
    "",
    "*How it works:*",
    ...(r.active
      ? []
      : [`1️⃣ First place your own crackers order with us. Once your order is placed, we will *activate your code* and message you.`]),
    `${r.active ? "1️⃣" : "2️⃣"} Share your code *${r.code}* with friends & family.`,
    `${r.active ? "2️⃣" : "3️⃣"} Your friend types *${r.code}* in the coupon box at checkout (order of ${min}+).`,
    `${r.active ? "3️⃣" : "4️⃣"} ${
      s.referral_cashback_on_diwali
        ? `All your cashback is credited together *on Diwali day (${formatDay(s.diwali_date)})* to your UPI / this mobile number.`
        : "Your cashback is credited after your friend's order is delivered, to your UPI / this mobile number."
    }`,
    "",
    ...(r.expires_at ? [`⏳ Offer valid till ${formatDay(r.expires_at)}.`] : []),
    `🛒 Shop now: ${absoluteUrl("/")}`,
    "",
    `Happy Diwali! 🪔 – ${s.store_name}`,
  ].join("\n");
}

/** Tells the referrer their cashback for a friend's order: earned (credited later) or sent. */
export function referrerCashbackMessage(
  r: Pick<ReferralCode, "code" | "referrer_name">,
  o: Pick<Order, "name" | "referrer_cashback" | "referrer_cashback_paid">,
  s: ReferralSettings,
) {
  return [
    `Hi ${firstName(r.referrer_name)} 🎉`,
    o.referrer_cashback_paid
      ? `Your friend ${firstName(o.name)} ordered with your code *${r.code}*. We've sent you *${formatINR(o.referrer_cashback)} cashback*.`
      : `Your friend ${firstName(o.name)} ordered with your code *${r.code}*. You've earned *${formatINR(o.referrer_cashback)} cashback*, credited ${cashbackWhen(s)}.`,
    "Keep sharing your code to earn more! Happy Diwali 🪔",
    `- ${s.store_name}`,
  ].join("\n");
}

/** Tells the friend their cashback for using a referral code: earned (credited later) or sent. */
export function friendCashbackMessage(
  o: Pick<Order, "name" | "order_number" | "referral_code" | "friend_cashback" | "friend_cashback_paid">,
  s: ReferralSettings,
) {
  return [
    `Hi ${firstName(o.name)} 🎉`,
    o.friend_cashback_paid
      ? `Thanks for ordering with referral code *${o.referral_code}*. We've sent you *${formatINR(o.friend_cashback)} cashback* for order ${o.order_number}.`
      : `Thanks for ordering with referral code *${o.referral_code}*. You've earned *${formatINR(o.friend_cashback)} cashback* on order ${o.order_number}, credited ${cashbackWhen(s)}.`,
    "Happy Diwali 🪔",
    `- ${s.store_name}`,
  ].join("\n");
}
