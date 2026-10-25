import { useStore } from "@/lib/store";
import { absoluteUrl } from "@/lib/seo";
import { formatINR, waLink } from "@/lib/format";
import type { OrderWithItems } from "@/lib/types";
import { WhatsAppIcon } from "@/components/ui/Icons";

/** Order confirmation text, ready to send to the customer on WhatsApp. */
export function confirmationMessage(o: OrderWithItems, storeName: string) {
  const payment =
    o.payment_method === "COD"
      ? o.payment_status === "PAID"
        ? "Cash on Delivery: payment received ✅"
        : `Cash on Delivery: please keep ${formatINR(o.total)} ready`
      : o.payment_status === "PAID"
        ? "UPI: payment received ✅"
        : "UPI: we're verifying your payment";
  const delivery =
    o.delivery_mode === "PICKUP"
      ? "Pickup from our shop. We'll call you when it's packed."
      : [o.address1, o.address2, `${o.city}, ${o.state} - ${o.pincode}`].filter(Boolean).join(", ");
  const discounts = o.coupon_discount + o.auto_discount;

  return [
    `Hi ${o.name} 🪔`,
    `Thank you for your order with *${storeName}*! Your order is confirmed.`,
    "",
    `*Order:* ${o.order_number}`,
    ...o.order_items.map((i) => `• ${i.name} × ${i.qty} = ${formatINR(i.line_total)}`),
    ...(discounts > 0 ? [`Discount: −${formatINR(discounts)}`] : []),
    `Delivery: ${o.shipping_fee ? formatINR(o.shipping_fee) : "FREE"}`,
    ...(o.cod_fee ? [`COD charges: ${formatINR(o.cod_fee)}`] : []),
    `*Total: ${formatINR(o.total)}*`,
    ...(o.referral_code ? [`🎁 Referral code ${o.referral_code}: FREE delivery + no COD charges. Your cashback comes after delivery.`] : []),
    "",
    `*Payment:* ${payment}`,
    `*${o.delivery_mode === "PICKUP" ? "Pickup" : "Delivery to"}:* ${delivery}`,
    "",
    `View your order: ${absoluteUrl(`/order/${o.id}`)}`,
    "",
    "We'll update you when it's on the way. Happy Diwali! 🎆",
  ].join("\n");
}

/** Opens WhatsApp with the confirmation pre-typed; the admin just presses Send. */
export function WhatsAppConfirmButton({ o, className, compact = false }: { o: OrderWithItems; className?: string; compact?: boolean }) {
  const { settings } = useStore();
  return (
    <a
      href={waLink(`91${o.phone}`, confirmationMessage(o, settings.store_name))}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "btn bg-[#25D366] text-sm text-[#06290f]"}
      aria-label={`Send order confirmation to ${o.name} on WhatsApp`}
      title="Send order confirmation on WhatsApp"
    >
      <WhatsAppIcon width={compact ? 18 : 20} height={compact ? 18 : 20} />
      {!compact && "Send confirmation"}
    </a>
  );
}
