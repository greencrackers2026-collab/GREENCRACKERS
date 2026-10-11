import { getSettings } from "@/lib/settings";
import { formatINR } from "@/lib/format";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/site/InfoPage";

export async function generateMetadata() {
  return pageMeta({
    title: "Shipping & Returns",
    description: "Delivery timelines, charges, restricted areas, and our return and cancellation policy for crackers orders.",
    path: "/shipping-returns",
  });
}

export default async function ShippingPage() {
  const s = await getSettings();
  return (
    <InfoPage title="Shipping & Returns" path="/shipping-returns">
      <h2>Delivery</h2>
      <ul>
        <li>Orders are dispatched within 1 to 3 working days after confirmation. Delivery usually takes 3 to 7 days depending on location.</li>
        <li>
          Delivery is <b>FREE</b> on orders above {formatINR(s.freeShippingAbove)}. Otherwise a flat {formatINR(s.shippingFee)} charge
          applies. Minimum order value is {formatINR(s.minOrderValue)}.
        </li>
        <li>Crackers are transported by licensed carriers as per explosives transport rules, so some remote pincodes may not be serviceable.</li>
        <li>We do not deliver to areas where the sale or use of crackers is banned or restricted (for example Delhi-NCR). Check your pincode before ordering.</li>
        <li>Pickup from our licensed shop is available. Choose it at checkout.</li>
      </ul>
      <h2>Cancellations</h2>
      <p>You can cancel an order before it is packed. Contact us on WhatsApp or by phone with your order ID. Prepaid orders are refunded to the original payment method within 5 to 7 working days.</p>
      <h2>Returns</h2>
      <p>
        For safety reasons crackers cannot be returned once delivered. If an item arrives damaged or is missing, share photos on WhatsApp
        within 24 hours of delivery and we will replace it or refund you.
      </p>
    </InfoPage>
  );
}
