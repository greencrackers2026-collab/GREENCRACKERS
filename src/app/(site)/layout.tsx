import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { BASE_KEYWORDS, SITE_URL, absoluteUrl, cityKeywords } from "@/lib/seo";
import { HeaderClient } from "@/components/site/HeaderClient";
import { RestrictionBanner } from "@/components/site/RestrictionBanner";
import { Footer } from "@/components/site/Footer";
import { WhatsAppFloat } from "@/components/site/WhatsAppFloat";
import { JsonLd } from "@/components/site/JsonLd";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { MotionProvider } from "@/components/MotionProvider";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: {
      default: `Buy Diwali Crackers Online: Up to ${s.maxDiscountPercent}% OFF | ${s.storeName}`,
      template: `%s | ${s.storeName}`,
    },
    description: `Buy Diwali crackers online from Sivakasi at up to ${s.maxDiscountPercent}% off. Sky shots, sparklers, anar, chakkar, green crackers and combo packs with home delivery.`,
    keywords: [...BASE_KEYWORDS, ...cityKeywords(s.seoCityList)],
    openGraph: { siteName: s.storeName, locale: "en_IN", type: "website", images: ["/og-image.jpg"] },
    twitter: { card: "summary_large_image" },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: s.storeName,
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
    ...(s.phone && {
      contactPoint: { "@type": "ContactPoint", telephone: s.phone, contactType: "customer service", areaServed: "IN" },
    }),
    ...(s.address && { address: { "@type": "PostalAddress", streetAddress: s.address, addressCountry: "IN" } }),
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: s.storeName,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/products?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <MotionProvider>
      <a
        href="#main"
        className="sr-only z-[100] rounded-lg bg-gold-400 px-4 py-2 font-semibold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <div className="sticky top-0 z-50">
        {s.announcement && (
          <div className="bg-gradient-to-r from-saffron-600 via-gold-500 to-saffron-600 text-black">
            <p className="mx-auto max-w-7xl truncate px-4 py-1.5 text-center text-xs font-semibold sm:text-sm">
              🎆 {s.announcement}
              {s.highlightCoupon && (
                <span className="ml-2 hidden rounded-full border border-black/30 bg-black/10 px-2 py-0.5 font-mono sm:inline">
                  {s.highlightCoupon}
                </span>
              )}
            </p>
          </div>
        )}
        <HeaderClient storeName={s.storeName} />
      </div>
      {s.restrictionEnabled && s.restrictionNotice && <RestrictionBanner text={s.restrictionNotice} />}
      <main id="main">{children}</main>
      <Footer s={s} />
      <CartDrawer freeShippingAbove={s.freeShippingAbove} minOrderValue={s.minOrderValue} />
      <WhatsAppFloat number={s.whatsappNumber} storeName={s.storeName} />
      <JsonLd data={[org, website]} />
    </MotionProvider>
  );
}
