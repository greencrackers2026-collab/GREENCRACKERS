import { useStore } from "@/lib/store";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { Seo } from "@/components/site/Seo";

export function CheckoutPage() {
  const { settings } = useStore();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Seo title="Checkout" description="Secure checkout for your Diwali crackers order." path="/checkout" noindex />
      <h1 className="font-display text-3xl sm:text-4xl">
        Secure <span className="text-gradient">Checkout</span>
      </h1>
      <p className="mt-1 text-white/65">Prices are verified on our server. Coupons and extra offers are applied automatically.</p>
      <div className="mt-6">
        <CheckoutClient s={settings} />
      </div>
    </div>
  );
}
