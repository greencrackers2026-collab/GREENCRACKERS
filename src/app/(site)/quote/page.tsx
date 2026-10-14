import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { getVisibleCombos, getVisibleProducts } from "@/lib/catalog";
import { pageMeta } from "@/lib/seo";
import { QuoteForm } from "@/components/quote/QuoteForm";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const metadata: Metadata = pageMeta({
  title: "Get a Bulk / Wholesale Crackers Quote",
  description:
    "Request wholesale and bulk prices for Diwali crackers: shops, apartments, corporate events and community celebrations. Direct Sivakasi rates.",
  path: "/quote",
  keywords: ["wholesale crackers", "bulk crackers order", "Sivakasi crackers wholesale price"],
});

export default async function QuotePage() {
  const [s, products, combos] = await Promise.all([getSettings(), getVisibleProducts(), getVisibleCombos()]);
  const options = [...products.map((p) => `${p.brand} ${p.name}`), ...combos.map((c) => `${c.name} (Combo)`)];
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ name: "Get a Quote", href: "/quote" }]} />
      <h1 className="mt-3 font-display text-3xl sm:text-4xl">
        Bulk &amp; Wholesale <span className="text-gradient">Quote</span>
      </h1>
      <p className="mb-6 mt-2 text-white/70">
        Buying for a shop, apartment, company or temple festival? Tell us what you need and we&apos;ll send our best Sivakasi
        wholesale price.
      </p>
      <QuoteForm productOptions={options} storeName={s.storeName} />
    </div>
  );
}
