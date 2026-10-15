import { Link } from "react-router";
import type { SiteSettings } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { splitList } from "@/lib/format";

export function Footer({ s }: { s: SiteSettings }) {
  const year = new Date().getFullYear();
  const cities = splitList(s.seo_cities);
  return (
    <footer className="mt-20 border-t border-white/10 bg-black/20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl text-gradient">{s.store_name}</p>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Buy Diwali crackers online at up to {s.max_discount_percent}% off. Genuine Sivakasi crackers, green crackers
            and combo packs{cities.length > 0 && <> delivered across {cities.join(", ")} and more</>}.
          </p>
          {s.licence_number && (
            <p className="mt-4 inline-block rounded-lg border border-gold-400/30 bg-gold-400/10 px-3 py-1.5 text-xs font-medium text-gold-300">
              {s.licence_number}
            </p>
          )}
        </div>
        <nav aria-label="Shop categories">
          <h2 className="font-semibold text-gold-300">Shop</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            <li>
              <Link to="/products" className="hover:text-white">All Crackers</Link>
            </li>
            {CATEGORIES.map((c) => (
              <li key={c.key}>
                <Link to={`/products?category=${c.key}`} className="hover:text-white">{c.label}</Link>
              </li>
            ))}
            <li>
              <Link to="/#combos" className="hover:text-white">Combo Packs</Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Help">
          <h2 className="font-semibold text-gold-300">Help</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/75">
            {[
              ["/quote", "Bulk / Wholesale Quote"],
              ["/safety-tips", "Safety Tips"],
              ["/shipping-returns", "Shipping & Returns"],
              ["/about", "About Us"],
              ["/contact", "Contact"],
              ["/terms", "Terms & Conditions"],
              ["/privacy", "Privacy Policy"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link to={href} className="hover:text-white">{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="font-semibold text-gold-300">Contact</h2>
          <address className="mt-3 space-y-2 text-sm not-italic text-white/75">
            {s.address && <p>{s.address}</p>}
            {s.phone && (
              <p>
                <a href={`tel:${s.phone.replace(/\s/g, "")}`} className="hover:text-white">{s.phone}</a>
              </p>
            )}
            {s.email && (
              <p>
                <a href={`mailto:${s.email}`} className="hover:text-white">{s.email}</a>
              </p>
            )}
          </address>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl space-y-2 px-4 py-6 text-xs leading-relaxed text-white/55">
          <p>
            🌿 We promote green crackers (CSIR-NEERI marked) wherever available. Please burst crackers only in permitted
            areas and during time slots allowed by the Hon&apos;ble Supreme Court and your local authorities.
          </p>
          <p>
            © {year} {s.store_name}. All prices in INR, inclusive of applicable taxes. Product images are for
            representation only; packaging may vary.
          </p>
        </div>
      </div>
    </footer>
  );
}
