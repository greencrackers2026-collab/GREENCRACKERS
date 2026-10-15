import { Outlet, useLocation } from "react-router";
import { useStore } from "@/lib/store";
import { SITE_URL, absoluteUrl } from "@/lib/seo";
import { Header } from "@/components/site/Header";
import { RestrictionBanner } from "@/components/site/RestrictionBanner";
import { Footer } from "@/components/site/Footer";
import { JsonLd } from "@/components/site/JsonLd";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { VideoBackdrop } from "@/components/media/VideoBackdrop";

export function SiteLayout() {
  const { settings: s } = useStore();
  const { pathname } = useLocation();
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: s.store_name,
    url: SITE_URL,
    logo: absoluteUrl("/icon.svg"),
    ...((s.phone || s.email) && {
      contactPoint: {
        "@type": "ContactPoint",
        ...(s.phone && { telephone: s.phone }),
        ...(s.email && { email: s.email }),
        contactType: "customer service",
        areaServed: "IN",
      },
    }),
    ...(s.address && { address: { "@type": "PostalAddress", streetAddress: s.address, addressCountry: "IN" } }),
  };
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: s.store_name,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/products?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[100] rounded-lg bg-gold-400 px-4 py-2 font-semibold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      {/* Ambient fireworks behind the glass UI (desktop only; black areas vanish via screen blending) */}
      <div className="pointer-events-none fixed inset-0 -z-10 hidden opacity-45 mix-blend-screen lg:block" aria-hidden="true">
        <VideoBackdrop clips={["sky-fireworks"]} desktopOnly showPoster={false} />
      </div>
      <div className="sticky top-0 z-50">
        {s.announcement && (
          <div className="bg-gradient-to-r from-saffron-600 via-gold-500 to-saffron-600 text-black">
            <p className="mx-auto max-w-7xl truncate px-4 py-1.5 text-center text-xs font-semibold sm:text-sm">
              🎆 {s.announcement}
              {s.highlight_coupon && (
                <span className="ml-2 hidden rounded-full border border-black/30 bg-black/10 px-2 py-0.5 font-mono sm:inline">
                  {s.highlight_coupon}
                </span>
              )}
            </p>
          </div>
        )}
        <Header storeName={s.store_name} />
      </div>
      {s.restriction_enabled && s.restriction_notice && <RestrictionBanner text={s.restriction_notice} />}
      <main id="main">
        {/* Re-mounts on every navigation, replaying a soft CSS entrance. */}
        <div key={pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>
      <Footer s={s} />
      <CartDrawer
        freeShippingAbove={s.free_shipping_above}
        minOrderValue={s.min_order_value}
        freeDeliveryCode={s.auto_coupon?.type === "FREESHIP" ? s.auto_coupon.code : null}
      />
      <JsonLd data={[org, website]} />
    </>
  );
}
