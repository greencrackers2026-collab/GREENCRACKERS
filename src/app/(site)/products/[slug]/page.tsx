import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getProductBySlug, getVisibleProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { categoryLabel } from "@/lib/constants";
import { discountPercent, formatINR, unitLabel } from "@/lib/format";
import { absoluteUrl, pageMeta } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { ProductGallery } from "@/components/product/ProductGallery";
import { BuyBox } from "@/components/product/BuyBox";
import { ProductCard, toCartItem } from "@/components/product/ProductCard";
import { PincodeChecker } from "@/components/home/PincodeChecker";
import { Countdown } from "@/components/home/Countdown";
import { LeafIcon, ShieldIcon, TruckIcon } from "@/components/ui/Icons";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const rows = await prisma.product.findMany({ where: { isVisible: true }, select: { slug: true } });
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Product not found" };
  const off = discountPercent(p.mrp, p.price);
  return pageMeta({
    title: `${p.brand} ${p.name}: Buy Online at ${formatINR(p.price)} (${off}% OFF)`,
    description: `Buy ${p.brand} ${p.name} online at ${formatINR(p.price)} per ${p.unit} (MRP ${formatINR(p.mrp)}). ${p.shortDesc} Genuine Sivakasi crackers with home delivery.`,
    path: `/products/${p.slug}`,
    image: p.image,
    keywords: [`${p.name} price`, `${p.brand} crackers`, `buy ${p.name} online`, "Sivakasi crackers"],
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [p, s, all] = await Promise.all([getProductBySlug(slug), getSettings(), getVisibleProducts()]);
  if (!p) notFound();

  const off = discountPercent(p.mrp, p.price);
  const related = all.filter((x) => x.id !== p.id && x.category === p.category).concat(all.filter((x) => x.id !== p.id && x.category !== p.category)).slice(0, 4);
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${p.brand} ${p.name}`,
    image: p.images.map((i) => absoluteUrl(i)),
    description: p.description,
    sku: p.slug,
    brand: { "@type": "Brand", name: p.brand },
    category: categoryLabel(p.category),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${p.slug}`),
      priceCurrency: "INR",
      price: p.price,
      priceValidUntil: new Date(s.diwaliDate.getTime() + 7 * 86400000).toISOString().slice(0, 10),
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: s.storeName },
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs
        items={[
          { name: "Shop", href: "/products" },
          { name: categoryLabel(p.category), href: `/products?category=${p.category}` },
          { name: p.name, href: `/products/${p.slug}` },
        ]}
      />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={p.images.length ? p.images : [p.image]} alt={`${p.brand} ${p.name}`} />
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {off > 0 && <span className="badge bg-gradient-to-r from-gold-400 to-saffron-500 text-black">{off}% OFF</span>}
            {p.isBestSeller && <span className="badge bg-maroon-800 text-gold-300 ring-1 ring-gold-400/40">★ Best Seller</span>}
            {p.isGreen && <span className="badge bg-emerald-700 text-white">🌿 Green Cracker</span>}
            <span className="badge bg-white/10 text-white/80">{categoryLabel(p.category)}</span>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wider text-white/55">{p.brand}</p>
            <h1 className="mt-1 text-3xl font-bold leading-tight sm:text-4xl">{p.name}</h1>
            <p className="mt-2 text-white/75">{p.shortDesc}</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-4xl font-bold text-gold-300">{formatINR(p.price)}</span>
              <span className="text-lg text-white/45 line-through">
                <span className="sr-only">MRP </span>
                {formatINR(p.mrp)}
              </span>
              <span className="text-sm text-white/60">per {unitLabel(p.unit)}</span>
            </div>
            <p className="mt-1 text-sm text-festive-green">You save {formatINR(p.mrp - p.price)} ({off}% off MRP)</p>
            {p.contents && <p className="mt-1 text-sm text-white/70">Pack: {p.contents}</p>}
            <div className="mt-5">
              <BuyBox item={toCartItem(p)} stock={p.stock} bulk={p.unit === "piece"} />
            </div>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="mb-2 text-sm text-white/70">Pre-Diwali offer ends in</p>
            <Countdown target={s.diwaliDate.toISOString()} compact />
          </div>
          <div className="glass rounded-2xl p-5">
            <PincodeChecker
              blockedPincodePrefixes={s.blockedPincodePrefixes}
              serviceablePrefixes={s.serviceablePrefixes}
              whatsappNumber={s.whatsappNumber}
            />
          </div>
          <ul className="grid grid-cols-3 gap-2 text-center text-xs text-white/75">
            <li className="glass rounded-xl p-3">
              <TruckIcon className="mx-auto mb-1 text-gold-300" />
              Free delivery above {formatINR(s.freeShippingAbove)}
            </li>
            <li className="glass rounded-xl p-3">
              <ShieldIcon className="mx-auto mb-1 text-gold-300" />
              Genuine Sivakasi brand
            </li>
            <li className="glass rounded-xl p-3">
              <LeafIcon className="mx-auto mb-1 text-gold-300" />
              {p.isGreen ? "Green cracker" : "Licensed seller"}
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <section className="glass rounded-2xl p-6" aria-labelledby="desc-title">
          <h2 id="desc-title" className="text-xl font-bold text-gold-300">About this product</h2>
          <p className="mt-3 leading-relaxed text-white/80">{p.description}</p>
        </section>
        <section className="glass rounded-2xl border-saffron-500/30 p-6" aria-labelledby="safety-title">
          <h2 id="safety-title" className="text-xl font-bold text-gold-300">⚠️ Safety information</h2>
          <p className="mt-3 leading-relaxed text-white/80">{p.safetyInfo}</p>
          <p className="mt-3 text-sm text-white/60">
            Use only in permitted areas and during allowed time slots. Not for sale to minors.
          </p>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-14" aria-labelledby="rel-title">
          <h2 id="rel-title" className="text-2xl font-bold">
            You may also <span className="text-gradient">like</span>
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </section>
      )}
      <JsonLd data={productLd} />
    </div>
  );
}
