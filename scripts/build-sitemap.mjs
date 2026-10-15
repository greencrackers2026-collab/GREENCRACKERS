/**
 * Runs after `vite build`: writes dist/sitemap.xml (static pages + every visible product) and dist/robots.txt.
 * Reads the same VITE_* variables as the app (from .env locally, or Cloudflare Pages environment variables).
 * If Supabase can't be reached, it still writes a sitemap of the static pages.
 */
import { writeFileSync } from "node:fs";
import { loadEnv } from "vite";

const env = { ...loadEnv("production", process.cwd(), "VITE_"), ...process.env };
const site = (env.VITE_SITE_URL || env.CF_PAGES_URL || "http://localhost:5173").replace(/\/$/, "");

const statics = [
  ["/", 1, "daily"],
  ["/products", 0.9, "daily"],
  ["/quote", 0.7, "weekly"],
  ["/safety-tips", 0.5, "monthly"],
  ["/about", 0.4, "monthly"],
  ["/contact", 0.4, "monthly"],
  ["/shipping-returns", 0.3, "monthly"],
  ["/terms", 0.2, "yearly"],
  ["/privacy", 0.2, "yearly"],
];

let products = [];
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
if (env.VITE_SUPABASE_URL && key) {
  try {
    const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/products?select=slug,updated_at&is_visible=eq.true`, {
      // New-style sb_publishable_ keys aren't JWTs, so only legacy anon keys go in the Authorization header.
      headers: {
        apikey: key,
        ...(key.startsWith("eyJ") && { Authorization: `Bearer ${key}` }),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    products = await res.json();
  } catch (e) {
    console.warn(`sitemap: could not load products (${e.message}); writing static pages only.`);
  }
}

const now = new Date().toISOString();
const url = (loc, lastmod, priority, freq) =>
  `  <url><loc>${site}${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${freq}</changefreq><priority>${priority}</priority></url>`;
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...statics.map(([loc, p, f]) => url(loc, now, p, f)),
  ...products.map((p) => url(`/products/${encodeURIComponent(p.slug)}`, p.updated_at, 0.8, "daily")),
  "</urlset>",
  "",
].join("\n");

writeFileSync("dist/sitemap.xml", xml);
writeFileSync(
  "dist/robots.txt",
  ["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /checkout", "Disallow: /order/", "", `Sitemap: ${site}/sitemap.xml`, ""].join("\n"),
);
console.log(`sitemap: ${statics.length + products.length} URLs for ${site}`);
