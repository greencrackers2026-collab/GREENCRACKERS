import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { MotionProvider } from "@/components/MotionProvider";
import { BootLoader, StoreProvider } from "@/lib/store";
import { supabaseConfigured } from "@/lib/supabase";
import { SiteLayout } from "@/pages/site/SiteLayout";
import { HomePage } from "@/pages/site/Home";
import { ProductsPage } from "@/pages/site/Products";
import { ProductDetailPage } from "@/pages/site/ProductDetail";
import { CheckoutPage } from "@/pages/site/Checkout";
import { OrderPage } from "@/pages/site/Order";
import { QuotePage } from "@/pages/site/Quote";
import { TrackPage } from "@/pages/site/Track";
import { AboutPage, ContactPage, PrivacyPage, SafetyPage, ShippingPage, TermsPage } from "@/pages/site/InfoPages";
import { NotFound } from "@/pages/site/NotFound";

// The admin panel is loaded only when someone opens /admin, keeping the storefront bundle small.
const AdminRoutes = lazy(() => import("@/pages/admin/AdminRoutes"));

/** Scroll to top on page change, or to the #hash target (e.g. /#combos) once it has rendered. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    let tries = 0;
    const id = window.setInterval(() => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el || ++tries > 20) {
        el?.scrollIntoView({ behavior: "smooth" });
        window.clearInterval(id);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, [pathname, hash]);
  return null;
}

function SetupNeeded() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="glass max-w-lg rounded-3xl p-8">
        <h1 className="text-2xl font-bold text-gold-300">Connect Supabase</h1>
        <p className="mt-3 text-white/80">
          Set <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code> in{" "}
          <code className="font-mono">.env</code> (local) or in Cloudflare Pages → Settings → Environment variables, then rebuild.
          See README.md.
        </p>
      </div>
    </main>
  );
}

export function App() {
  if (!supabaseConfigured) return <SetupNeeded />;
  return (
    <BrowserRouter>
      <ScrollManager />
      <MotionProvider>
        <StoreProvider>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/:slug" element={<ProductDetailPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="order/:id" element={<OrderPage />} />
              <Route path="quote" element={<QuotePage />} />
              <Route path="track" element={<TrackPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="safety-tips" element={<SafetyPage />} />
              <Route path="shipping-returns" element={<ShippingPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route
              path="admin/*"
              element={
                <Suspense fallback={<BootLoader text="Opening admin…" />}>
                  <AdminRoutes />
                </Suspense>
              }
            />
          </Routes>
        </StoreProvider>
      </MotionProvider>
    </BrowserRouter>
  );
}
