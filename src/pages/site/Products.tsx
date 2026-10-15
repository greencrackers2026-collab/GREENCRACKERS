import { useStore } from "@/lib/store";
import { absoluteUrl, cityKeywords } from "@/lib/seo";
import { splitList } from "@/lib/format";
import { ShopClient } from "@/components/product/ShopClient";
import { JsonLd } from "@/components/site/JsonLd";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Seo } from "@/components/site/Seo";

export function ProductsPage() {
  const { settings: s, products } = useStore();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Seo
        title={`Shop Diwali Crackers Online: Sivakasi Crackers at ${s.max_discount_percent}% OFF`}
        description="Browse all Diwali crackers: sound crackers, ground chakkar, sky shots, sparklers (fuljhadi) and fountains (anar). Genuine Sivakasi brands at up to 70% off."
        path="/products"
        keywords={["buy Diwali crackers online", "Sivakasi crackers price list", "crackers online shopping", ...cityKeywords(splitList(s.seo_cities))]}
      />
      <Breadcrumbs items={[{ name: "Shop", href: "/products" }]} />
      <h1 className="mt-3 font-display text-3xl sm:text-4xl">
        Buy Diwali Crackers <span className="text-gradient">Online</span>
      </h1>
      <p className="mt-2 max-w-2xl text-white/70">
        Genuine Sivakasi crackers at pre-Diwali prices. Filter by category, search, and add to cart in one tap.
      </p>
      <div className="mt-6">
        <ShopClient products={products} />
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
