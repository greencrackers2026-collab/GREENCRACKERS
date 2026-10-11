# Diwali Crackers Store

A fast, SEO-optimised Diwali crackers e-commerce site with a glassmorphism UI, a pre-Diwali offer system, checkout (Razorpay / UPI / COD), bulk quote requests and an admin dashboard.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Framer Motion · Prisma + SQLite (Postgres-ready) · Razorpay

## Setup

```bash
npm install
cp .env.example .env        # then edit values (see below)
npm run setup               # optimise images + create DB + seed products, offers, demo orders
npm run dev                 # http://localhost:3000
```

Admin panel: `http://localhost:3000/admin`, using `ADMIN_USERNAME` / `ADMIN_PASSWORD` from `.env`.

Production: `npm run build && npm start`.

## Environment (`.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite file by default (`file:./dev.db`) |
| `NEXT_PUBLIC_SITE_URL` | Your public domain. Used for canonical URLs, sitemap and Open Graph. **Set this before going live.** |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Admin login |
| `ADMIN_SESSION_SECRET` | 32+ char random string that signs the admin cookie |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay test/live keys. If left blank, the Razorpay option is hidden. |
| `WHATSAPP_NUMBER`, `UPI_ID`, `DIWALI_DATE` | Seed defaults only; edit them later in **Admin → Offers & Settings** |

## Scripts

| Script | What it does |
|---|---|
| `npm run images` | Converts the original photos in the project root into square WebP files in `public/products/`, plus the Small Fuljhadi placeholder, combo covers and `og-image.jpg` |
| `npm run seed` | Loads products, combos, coupons, settings, demo orders and quotes. It is idempotent and never overwrites your edits. |
| `npm run setup` | `images` + `prisma db push` + `seed` |
| `npm run lint` / `npm run typecheck` | Quality checks |

## What's editable from the admin (no code changes)

- **Products:** name, brand, slug, price, MRP (with live % OFF), stock, images (upload), description, safety info, flags (visible / featured / best seller / green), min qty and qty step
- **Offers & Settings:** hero title, rotating taglines, announcement bar, highlighted coupon, Diwali countdown date, extra-%-off-above-₹X rule, shipping fee and free-shipping threshold, minimum order, COD/UPI toggles, UPI ID, WhatsApp, licence number, restriction banner (toggle + text), blocked/serviceable pincode prefixes, SEO cities
- **Coupons:** code, % or flat, minimum order, max discount, expiry, pause/delete
- **Combos:** name, tagline, extra discount %, visibility. Combo prices are computed from current product prices.
- **Orders:** search and filter (status / payment / date), status pipeline (New → Confirmed → Packed → Shipped → Delivered / Cancelled), payment status, internal notes, printable invoice and packing slip, CSV export. Cancelling an order returns its stock.
- **Quotes:** mark New / Contacted / Closed, reply on WhatsApp
- **Customers:** list with order history and total spent

## Notes for the owner ⚠️

- **Prices from ranges:** Coconut uses ₹450 (range 450–500), Sky Shot uses ₹650 (range 650–700), Murgachap uses ₹35 (range 35–40). Each one has an internal note in Admin → Products.
- **MRPs** are set so the discount is 60–68% off. Adjust them per product if your printed MRPs differ.
- **Small Fuljhadi** uses a placeholder image. Upload a real photo in Admin → Products → Edit.
- **Green badge:** it is set on products whose pack shows a green-fireworks mark in the photos (Nazi Green, Paanch Awathar, Anar, Big sparklers). Verify against your stock.
- **Licence number:** replace the placeholder in Admin → Offers & Settings.
- **Store name / contact details** are placeholders ("Sivakasi Sparkle Crackers", +91 98765 43210). Change them in settings.
- **Compliance:** Delhi-NCR pincode prefixes (110, 121, 122, 201) are blocked by default. Add others as local rules require. Customers in blocked areas are offered pickup or WhatsApp ordering instead.
- **UPI payments** are verified manually: the customer submits their UTR on the order page, and you mark the order PAID after checking your bank app.
- **Razorpay:** signatures are verified server-side. For extra reliability, also set up a Razorpay webhook (not included) before going live.

## Deployment

- Works on any Node host (VPS, Railway, Render, etc.). Uploaded images go to `./uploads` (set `UPLOAD_DIR` to change this), so use a host with a persistent disk.
- **Serverless hosts (e.g. Vercel)** have no persistent disk or SQLite. Switch to Postgres (`provider = "postgresql"` in `prisma/schema.prisma`) and to object storage for uploads.
- The rate limiter is in-memory and only per instance. Use Redis if you run multiple instances.

## Project structure

```
prisma/            schema.prisma, seed.ts
scripts/           optimize-images.mjs
public/products/   optimised product images (generated)
src/app/(site)/    storefront: home, products, product detail, checkout, order, quote, info pages
src/app/admin/     login, panel (dashboard, orders, quotes, products, offers, customers), print, server actions
src/app/api/       pricing, orders, razorpay, quote, uploads, admin upload/export
src/components/    cart, checkout, home, product, quote, site, admin, ui
src/lib/           db, settings, catalog, pricing (server-side source of truth), orders, auth/session, seo, validation
src/middleware.ts  admin route protection
```
