import { Link } from "react-router";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/lib/constants";
import { formatINR, splitList } from "@/lib/format";
import { getFaqs } from "@/lib/faq";
import { BASE_KEYWORDS, cityKeywords } from "@/lib/seo";
import { VideoBackdrop } from "@/components/media/VideoBackdrop";
import { Countdown } from "@/components/home/Countdown";
import { RotatingTaglines } from "@/components/home/RotatingTaglines";
import { PincodeChecker } from "@/components/home/PincodeChecker";
import { ProductCard } from "@/components/product/ProductCard";
import { ComboCard } from "@/components/product/ComboCard";
import { JsonLd } from "@/components/site/JsonLd";
import { Seo } from "@/components/site/Seo";
import { LeafIcon, ShieldIcon, SparkIcon, TagIcon, TruckIcon } from "@/components/ui/Icons";

const TESTIMONIALS = [
  { name: "Priya R.", city: "Chennai", text: "Ordered the Family Pack. Delivered in 3 days, everything well packed. Kids loved the chakkars!" },
  { name: "Arjun M.", city: "Bengaluru", text: "Genuine Sivakasi stuff at half the shop price. The 30-shot sky peti was the highlight of our society celebration." },
  { name: "Lakshmi N.", city: "Madurai", text: "Easy ordering and COD. The Mega Crackling Coconut is a must-buy." },
];

export function HomePage() {
  const { settings: s, products, combos } = useStore();
  const bestSellers = products.filter((p) => p.is_best_seller);
  const faqs = getFaqs(s);
  const heroImgs = [products.find((p) => p.slug.includes("paanch")), products.find((p) => p.slug.includes("sky-shot")), products.find((p) => p.slug.includes("coconut"))].filter(Boolean);

  return (
    <>
      <Seo
        absolute
        title={`Buy Diwali Crackers Online: Up to ${s.max_discount_percent}% OFF | ${s.store_name}`}
        description={`Mega pre-Diwali sale: buy Sivakasi crackers online at 50% to ${s.max_discount_percent}% off. Sky shots, anar, chakkar, sparklers, green crackers and combo packs delivered to your door.`}
        path="/"
        keywords={[...BASE_KEYWORDS, ...cityKeywords(splitList(s.seo_cities))]}
      />
      {/* HERO */}
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <VideoBackdrop clips={["sparkler", "sky-fireworks", "chakkar"]} />
        {/* Readability overlays: darker on the text side, fading into the page at the bottom */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/60 to-ink-950/25" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink-950" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-10 px-4 pb-20 pt-10 sm:pt-16 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-6 text-center lg:text-left">
            <span className="badge glass px-3 py-1.5 text-gold-300">🪔 Direct from Sivakasi · Licensed Seller</span>
            <h1 id="hero-title" className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
              <span className="text-gradient animate-shimmer">{s.hero_title}</span>
            </h1>
            {s.hero_subtitle && <p className="mx-auto max-w-xl text-base text-white/80 sm:text-lg lg:mx-0">{s.hero_subtitle}</p>}
            <RotatingTaglines taglines={s.taglines} />
            <div className="flex flex-col items-center gap-3 lg:items-start">
              <p className="text-sm font-medium uppercase tracking-widest text-white/60">Diwali countdown</p>
              <Countdown target={s.diwali_date} />
            </div>
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link to="/products" className="btn btn-primary px-7 text-base">
                Shop the Sale
              </Link>
              <Link to="/#combos" className="btn btn-ghost px-7 text-base">
                View Combo Packs
              </Link>
            </div>
          </div>
          <div className="relative mx-auto hidden aspect-square w-full max-w-md lg:block" aria-hidden="true">
            {heroImgs.map((p, i) => (
              <div
                key={p!.id}
                className={`glass absolute overflow-hidden rounded-3xl animate-float ${
                  ["left-0 top-6 z-20 w-[62%]", "right-0 top-0 z-10 w-[52%] rotate-6", "bottom-0 right-6 z-30 w-[50%] -rotate-3"][i]
                }`}
                style={{ animationDelay: `${i * 0.8}s` }}
              >
                <img src={p!.image} alt="" width={420} height={420} className="h-auto w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OFFER STRIP */}
      <section aria-label="Current offers" className="mx-auto max-w-7xl px-4">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <TagIcon />, t: `Up to ${s.max_discount_percent}% OFF`, d: "On all crackers, already applied" },
            ...(s.auto_coupon?.type === "FREESHIP"
              ? [{ icon: <TruckIcon />, t: "FREE Delivery", d: `Code ${s.auto_coupon.code} auto-applied at checkout` }]
              : [
                  ...(s.highlight_coupon ? [{ icon: <SparkIcon />, t: `Code ${s.highlight_coupon}`, d: "Extra savings at checkout" }] : []),
                  { icon: <TruckIcon />, t: "Free Delivery", d: `On orders above ${formatINR(s.free_shipping_above)}` },
                ]),
            { icon: <SparkIcon />, t: `Extra ${s.auto_offer_percent}% OFF`, d: `On orders above ${formatINR(s.auto_offer_threshold)}` },
            { icon: <ShieldIcon />, t: "Easy Payment", d: `UPI or Cash on Delivery` },
          ].map((o) => (
            <li key={o.t} className="glass flex items-center gap-3 rounded-2xl p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-400/30 to-saffron-500/30 text-gold-300">
                {o.icon}
              </span>
              <div>
                <p className="font-semibold">{o.t}</p>
                <p className="text-sm text-white/65">{o.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto mt-16 max-w-7xl px-4" aria-labelledby="cat-title">
        <h2 id="cat-title" className="text-2xl font-bold sm:text-3xl">
          Shop by <span className="text-gradient">Category</span>
        </h2>
        <ul className="no-scrollbar -mx-4 mt-6 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
          {CATEGORIES.map((c) => (
            <li key={c.key} className="shrink-0 snap-start">
              <Link
                to={`/products?category=${c.key}`}
                className="glass flex w-36 flex-col items-center gap-2 rounded-2xl px-3 py-5 text-center transition hover:-translate-y-1 hover:bg-white/10 sm:w-auto"
              >
                <span className="text-4xl" aria-hidden="true">
                  {c.emoji}
                </span>
                <span className="font-semibold">{c.label}</span>
                <span className="text-xs text-white/60">{c.desc}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ALL CRACKERS: the full catalogue on the front page, grouped by category (Sound first) */}
      <section className="mx-auto mt-10 max-w-7xl px-4 sm:mt-16" aria-labelledby="all-title">
        <div className="flex items-end justify-between gap-4">
          <h2 id="all-title" className="text-2xl font-bold sm:text-3xl">
            All <span className="text-gradient">Crackers</span>
          </h2>
          <Link to="/products" className="text-sm font-semibold text-gold-300 hover:underline">
            Search &amp; filter →
          </Link>
        </div>
        {CATEGORIES.map((c) => {
          const items = products.filter((p) => p.category === c.key);
          if (items.length === 0) return null;
          return (
            <div key={c.key} id={`cat-${c.key.toLowerCase()}`} className="mt-6 scroll-mt-28 sm:mt-10">
              <h3 className="text-lg font-semibold text-gold-300 sm:text-xl">
                <span aria-hidden="true">{c.emoji}</span> {c.label}
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                {items.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* COMBOS */}
      {combos.length > 0 && (
        <section id="combos" className="mx-auto mt-20 max-w-7xl scroll-mt-28 px-4" aria-labelledby="combo-title">
          <h2 id="combo-title" className="text-2xl font-bold sm:text-3xl">
            Crackers <span className="text-gradient">Combo Packs</span>
          </h2>
          <p className="mt-2 text-white/70">Handpicked bundles with an extra combo discount on top of sale prices.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {combos.map((c) => (
              <ComboCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      {/* BEST SELLERS */}
      {bestSellers.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-4" aria-labelledby="best-title">
          <h2 id="best-title" className="text-2xl font-bold sm:text-3xl">
            ★ <span className="text-gradient">Best Sellers</span>
          </h2>
          <div className="no-scrollbar -mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
            {bestSellers.map((p) => (
              <div key={p.id} className="w-[46%] shrink-0 snap-start sm:w-64">
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* WHY US */}
      <section className="mx-auto mt-20 max-w-7xl px-4" aria-labelledby="why-title">
        <h2 id="why-title" className="text-2xl font-bold sm:text-3xl">
          Why buy from <span className="text-gradient">{s.store_name}</span>
        </h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-[2fr_1fr]">
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: <SparkIcon />, t: "Direct from Sivakasi", d: "Genuine branded crackers sourced from licensed factories." },
              { icon: <TagIcon />, t: "Best Price Guaranteed", d: "50% to 70% below MRP, plus coupons and combo savings." },
              { icon: <ShieldIcon />, t: "Safe & Secure Checkout", d: "Pay by UPI or Cash on Delivery, whichever suits you." },
              { icon: <LeafIcon />, t: "Green Crackers", d: "Lower-emission green crackers clearly marked." },
            ].map((w) => (
              <li key={w.t} className="glass flex gap-4 rounded-2xl p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/10 text-gold-300">{w.icon}</span>
                <div>
                  <h3 className="font-semibold">{w.t}</h3>
                  <p className="mt-1 text-sm text-white/70">{w.d}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="glass rounded-2xl p-5">
            <PincodeChecker s={s} />
            <p className="mt-3 text-xs text-white/55">
              Can&apos;t get delivery? <Link to="/quote" className="underline">Request a quote</Link> for pickup
              from our licensed shop.
            </p>
          </div>
        </div>
      </section>

      {/* DIYA VIDEO BAND */}
      <section className="relative mt-20 overflow-hidden" aria-labelledby="band-title">
        {/* Soft-edged band: the video fades in/out at top and bottom instead of a hard cut */}
        <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)]">
          <VideoBackdrop clips={["diyas"]} />
          <div className="pointer-events-none absolute inset-0 bg-ink-950/55" aria-hidden="true" />
        </div>
        <div className="relative mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-5 px-4 py-20 text-center">
          <p className="badge glass px-3 py-1.5 text-gold-300">🪔 Shubh Deepavali</p>
          <h2 id="band-title" className="font-display text-3xl leading-tight drop-shadow-lg sm:text-5xl">
            Light up every corner <span className="text-gradient">this Diwali</span>
          </h2>
          <p className="max-w-xl text-white/85 drop-shadow">
            Genuine Sivakasi crackers at up to {s.max_discount_percent}% off, with FREE delivery on every order. Offer ends in:
          </p>
          <Countdown target={s.diwali_date} compact />
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/products" className="btn btn-primary px-7">
              Shop Now
            </Link>
            <Link to="/#combos" className="btn btn-ghost px-7">
              Combo Packs
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto mt-20 max-w-7xl px-4" aria-labelledby="testi-title">
        <h2 id="testi-title" className="text-2xl font-bold sm:text-3xl">
          Happy <span className="text-gradient">Customers</span>
        </h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <li key={t.name}>
              <figure className="glass h-full rounded-2xl p-5">
                <p className="text-gold-400" aria-label="5 out of 5 stars">★★★★★</p>
                <blockquote className="mt-2 text-white/85">“{t.text}”</blockquote>
                <figcaption className="mt-3 text-sm text-white/60">
                  {t.name}, {t.city}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-20 max-w-3xl px-4" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-center text-2xl font-bold sm:text-3xl">
          Frequently Asked <span className="text-gradient">Questions</span>
        </h2>
        <div className="mt-6 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="glass group rounded-2xl p-5 open:bg-white/10">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="text-gold-300 transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-white/75">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
    </>
  );
}
