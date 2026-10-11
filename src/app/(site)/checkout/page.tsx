import type { Metadata } from "next";
import { getSettings, publicSettings } from "@/lib/settings";
import { pageMeta } from "@/lib/seo";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = pageMeta({
  title: "Checkout",
  description: "Secure checkout for your Diwali crackers order.",
  path: "/checkout",
  noindex: true,
});

export default async function CheckoutPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl sm:text-4xl">
        Secure <span className="text-gradient">Checkout</span>
      </h1>
      <p className="mt-1 text-white/65">Prices are verified on our server. Coupons and extra offers are applied automatically.</p>
      <div className="mt-6">
        <CheckoutClient s={publicSettings(s)} />
      </div>
    </div>
  );
}
