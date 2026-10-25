# Diwali Crackers Store

A fast Diwali crackers e-commerce site with a glassmorphism UI, a pre-Diwali offer system, checkout (UPI QR + screenshot, or Cash on Delivery), bulk quote requests and an admin dashboard.

**Stack:** Vite · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Supabase (Postgres, Auth, Storage) · hosted on Cloudflare Pages

There is no separate backend. The React app talks to Supabase directly with the public anon key. The data is protected by **Row Level Security** and by SQL functions in `supabase/schema.sql`. Those functions re-price every cart in the database, so customers can't change prices from the browser.

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor:** paste and run `supabase/schema.sql`, then `supabase/seed.sql`. You can safely run both again later; the seed never overwrites your edits.
3. **Authentication → Sign In / Providers:** turn off **Allow new users to sign up**. Only you need an account.
4. **Authentication → Users → Add user:** create your admin login (email + password). Copy the user's **UID**.
5. Back in the **SQL Editor**, make that user an admin:
   ```sql
   insert into public.admins (user_id) values ('PASTE-THE-UID-HERE');
   ```
6. **Project Settings → API:** copy the **Project URL** and the **anon public** key.

> Never put the `service_role` / secret key in this app or in any `VITE_*` variable. Everything with that prefix ends up in the browser bundle.

## 2. Run locally

```bash
npm install
cp .env.example .env   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev            # http://localhost:5173
```

Admin panel: `http://localhost:5173/admin`. Sign in with the user from step 1.4.

## 3. Deploy to Cloudflare Pages

1. Push this repo to GitHub, then go to **Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git**.
2. Build settings:
   - Framework preset: **None** (or Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
3. **Environment variables** (Production and Preview):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SITE_URL`: your live domain, e.g. `https://greencrackers.in` (used for canonical URLs, the sitemap and Open Graph)
   - `NODE_VERSION`: `22`
4. Deploy. `public/_redirects` makes every route (e.g. `/products/...`, `/admin`) load the app, and `public/_headers` sets caching and security headers.
5. Optional: in Supabase **Authentication → URL Configuration**, set the Site URL to your domain.

The build also writes `sitemap.xml` (including every visible product) and `robots.txt`. **Product changes in the admin appear on the site immediately**, but the sitemap only refreshes on the next deploy.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Typecheck, build to `dist/`, write sitemap + robots.txt |
| `npm run preview` | Serve the production build locally |
| `npm run lint` / `npm run typecheck` | Quality checks |
| `npm run images` / `npm run videos` | Re-generate the optimised product photos / background videos in `public/` from the originals |

## What's editable from the admin (no code changes)

- **Products:** name, brand, slug, price, MRP (with live % OFF), your cost price (admin only), stock, images (upload), description, safety info, flags (visible / featured / best seller / green), min qty and qty step
- **Offers & Settings:** hero title, rotating taglines, announcement bar, highlighted coupon (auto-applied at checkout), Diwali countdown date, extra-%-off-above-₹X rule, delivery fee and free-delivery threshold, COD charges, minimum order, COD/UPI toggles, UPI QR / UPI ID, licence number, restriction banner, blocked/serviceable pincode prefixes, SEO cities
- **Coupons:** code, % / flat / free delivery, minimum order, max discount, expiry, pause/delete
- **Refer & Earn:** create a referral code for a customer (auto-suggested from their name, valid till Diwali by default) and send it to them on WhatsApp in one tap. A friend who enters the code at checkout on an order of ₹1,999+ gets free delivery + no COD charges. On each referred order you record the cashback (referrer up to ₹1,000, friend up to ₹100), tick it paid, and send a WhatsApp confirmation. The amounts and minimum order are editable in Offers & Settings. Customers can't use their own code, and each mobile number can use a referral only once.
- **Combos:** name, tagline, extra discount %, visibility. Combo prices are computed from current product prices.
- **Orders:** search and filter, status pipeline (New → Confirmed → Packed → Shipped → Delivered / Cancelled), payment status, UPI screenshot review (approve / reject), internal notes, printable invoice and packing slip, CSV export. Cancelling an order returns its stock automatically.
- **Quotes:** mark New / Contacted / Closed, reply on WhatsApp
- **Customers:** list with order history and total spent
- **Dashboard:** today / 7-day / total revenue and profit, profit by product, low stock

## How it's secured

| What | Who can do it |
|---|---|
| Read visible products, combos, settings | Everyone |
| Get prices / place an order / attach a UPI screenshot | Everyone, but only through `price_cart()`, `place_order()` and `attach_payment_proof()`, which validate everything and compute prices, coupons and stock in the database |
| Submit a quote | Everyone (insert only, validated by table constraints) |
| Upload a payment screenshot | Everyone, as a new file with a random name in a **private** bucket. Customers can't list, read or overwrite screenshots. |
| View an order | Anyone with its link (the id is a random UUID). Internal notes and cost prices are never included. |
| Everything else (orders, customers, coupons, cost prices, product edits, settings) | Admins listed in `public.admins` only |

Other details:
- Orders, quotes and UPI screenshot submissions are rate-limited per IP in the database (`request_log`).
- Stock is decremented atomically when an order is placed, so two customers can't buy the last box.
- Photos and payment screenshots are re-encoded in the browser before upload (resized, and EXIF/location data stripped).

## Notes for the owner ⚠️

- **Prices from ranges:** Coconut uses ₹450 (range 450–500), Sky Shot uses ₹650 (range 650–700), Murgachap uses ₹35 (range 35–40). Each one has an internal note in Admin → Products.
- **Small Fuljhadi** uses a placeholder image. Upload a real photo in Admin → Products → Edit.
- **Green badge:** it is set on products whose pack shows a green-fireworks mark in the photos. Verify against your stock.
- **Licence number, email, shop address:** add them in Admin → Offers & Settings.
- **UPI payments** are verified manually: the customer uploads a screenshot (and optionally the UTR), and you approve or reject it on the order page after checking your bank app.

## Project structure

```
supabase/schema.sql   tables, RLS policies, pricing/order functions, storage buckets
supabase/seed.sql     products, combos, coupons and settings
public/               images, videos, _redirects + _headers for Cloudflare Pages
scripts/              build-sitemap.mjs, optimize-images.mjs, encode-videos.mjs
src/pages/site/       storefront: home, products, product detail, checkout, order, quote, info pages
src/pages/admin/      login, dashboard, orders, quotes, products, offers & settings, customers, print
src/components/       cart, checkout, home, product, quote, site, admin, ui
src/lib/              supabase client, store (catalogue + settings), catalog, auth, images, profit, validation, seo
```
