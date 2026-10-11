import { Suspense } from "react";
import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { getVisibleProducts } from "@/lib/catalog";
import { absoluteUrl, cityKeywords, pageMeta } from "@/lib/seo";
import { ShopClient } from "@/components/product/ShopClient";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/site/JsonLd";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return pageMeta({
    title: `Shop Diwali Crackers Online: Sivakasi Crackers at ${s.maxDiscountPercent}% OFF`,
    description:
      "Browse all Diwali crackers: sound crackers, ground chakkar, sky shots, sparklers (fuljhadi) and fountains (anar). Genuine Sivakasi brands at up to 70% off.",
    path: "/products",
    keywords: ["buy Diwali crackers online", "Sivakasi crackers price list", "crackers online shopping", ...cityKeywords(s.seoCityList)],
  });
}

export default async function ProductsPage() {
  const products = await getVisibleProducts();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ name: "Shop", href: "/products" }]} />
      <h1 className="mt-3 font-display text-3xl sm:text-4xl">
        Buy Diwali Crackers <span className="text-gradient">Online</span>
      </h1>
      <p className="mt-2 max-w-2xl text-white/70">
        Genuine Sivakasi crackers at pre-Diwali prices. Filter by category, search, and add to cart in one tap.
      </p>
      <div className="mt-6">
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          }
        >
          <ShopClient products={products} />
        </Suspense>
      </div>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: products.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: absoluteUrl(`/products/${p.slug}`),
              name: `${p.brand} ${p.name}`,
            })),
          },
        ]}
      />
    </div>
  );
}
