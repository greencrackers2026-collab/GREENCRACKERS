"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import type { Product } from "@prisma/client";
import { saveProduct } from "@/app/admin/actions";
import { CATEGORIES } from "@/lib/constants";
import { discountPercent } from "@/lib/format";

type P = Omit<Product, "images"> & { images: string[] };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function ProductForm({ product }: { product: P | null }) {
  const [state, action, pending] = useActionState(saveProduct, undefined);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [mrp, setMrp] = useState(String(product?.mrp ?? ""));
  const [cost, setCost] = useState(String(product?.costPrice || ""));
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const autoSlug = (n: string, b: string) => {
    if (!slugTouched) setSlug(slugify(`${b} ${n}`));
  };

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadErr(null);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setImages((im) => [...im, data.url]);
      else setUploadErr(data.error ?? "Upload failed");
    }
    setUploading(false);
  }

  const off = discountPercent(Number(mrp) || 0, Number(price) || 0);
  const unitProfit = (Number(price) || 0) - (Number(cost) || 0);
  const unitMargin = Number(price) ? (unitProfit / Number(price)) * 100 : 0;

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <div className="glass space-y-4 rounded-2xl p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Product name *</span>
            <input name="name" className="input" required value={name} onChange={(e) => {
                setName(e.target.value);
                autoSlug(e.target.value, brand);
              }} />
          </label>
          <label>
            <span className="label">Brand *</span>
            <input name="brand" className="input" required value={brand} onChange={(e) => {
                setBrand(e.target.value);
                autoSlug(name, e.target.value);
              }} />
          </label>
          <label className="sm:col-span-2">
            <span className="label">URL slug * (changing it changes the product URL)</span>
            <input
              name="slug"
              className="input font-mono"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
            />
          </label>
          <label>
            <span className="label">Category *</span>
            <select name="category" className="input" defaultValue={product?.category ?? "SOUND"}>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Unit * (box / pack / piece)</span>
            <input name="unit" className="input" required defaultValue={product?.unit ?? "box"} list="units" />
            <datalist id="units">
              <option value="box" />
              <option value="pack" />
              <option value="piece" />
            </datalist>
          </label>
          <label>
            <span className="label">Sale price (₹) *</span>
            <input name="price" type="number" min={1} className="input" required value={price} onChange={(e) => setPrice(e.target.value)} />
          </label>
          <label>
            <span className="label">MRP (₹) *{off > 0 && <span className="ml-2 text-festive-green">{off}% OFF</span>}</span>
            <input name="mrp" type="number" min={1} className="input" required value={mrp} onChange={(e) => setMrp(e.target.value)} />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Your cost price (₹ per {product?.unit ?? "unit"}): admin only, never shown to customers</span>
            <input name="costPrice" type="number" min={0} className="input" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="What you pay the supplier" />
            {Number(cost) > 0 && Number(price) > 0 ? (
              <span className={`mt-1 block text-sm font-semibold ${unitProfit >= 0 ? "text-festive-green" : "text-red-300"}`}>
                {unitProfit >= 0 ? "Profit" : "Loss"} ₹{Math.abs(unitProfit)} per unit ({unitMargin.toFixed(1)}% margin) at the sale price
              </span>
            ) : (
              <span className="mt-1 block text-xs text-saffron-400">Add a cost price to see profit / loss on orders.</span>
            )}
          </label>
          <label>
            <span className="label">Stock</span>
            <input name="stock" type="number" min={0} className="input" defaultValue={product?.stock ?? 100} />
          </label>
          <label>
            <span className="label">Sort order</span>
            <input name="sortOrder" type="number" className="input" defaultValue={product?.sortOrder ?? 99} />
          </label>
          <label>
            <span className="label">Minimum qty</span>
            <input name="minQty" type="number" min={1} className="input" defaultValue={product?.minQty ?? 1} />
          </label>
          <label>
            <span className="label">Qty step</span>
            <input name="qtyStep" type="number" min={1} className="input" defaultValue={product?.qtyStep ?? 1} />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Pack contents (e.g. &quot;10 pieces per box&quot;)</span>
            <input name="contents" className="input" defaultValue={product?.contents ?? ""} />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Short description (cards &amp; SEO)</span>
            <input name="shortDesc" className="input" maxLength={200} defaultValue={product?.shortDesc ?? ""} />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Full description</span>
            <textarea name="description" className="input min-h-28" defaultValue={product?.description ?? ""} />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Safety information</span>
            <textarea name="safetyInfo" className="input min-h-24" defaultValue={product?.safetyInfo ?? ""} />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Internal price note (admin only)</span>
            <input name="priceNote" className="input" defaultValue={product?.priceNote ?? ""} />
          </label>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold">Images</h2>
          <p className="text-xs text-white/55">The first image is the main photo. Uploads are converted to optimised WebP.</p>
          <ul className="mt-3 grid grid-cols-3 gap-3">
            {images.map((src, i) => (
              <li key={src} className="relative">
                <Image src={src} alt="" width={160} height={160} className={`aspect-square w-full rounded-xl object-cover ${i === 0 ? "ring-2 ring-gold-400" : ""}`} />
                <div className="mt-1 flex justify-between text-xs">
                  {i > 0 ? (
                    <button type="button" className="text-gold-300 hover:underline" onClick={() => setImages((im) => [src, ...im.filter((x) => x !== src)])}>
                      Make main
                    </button>
                  ) : (
                    <span className="text-white/50">Main</span>
                  )}
                  <button type="button" className="text-red-300 hover:underline" onClick={() => setImages((im) => im.filter((x) => x !== src))}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <label className="btn btn-ghost mt-4 w-full cursor-pointer text-sm">
            {uploading ? "Uploading…" : "⬆ Upload image(s)"}
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} disabled={uploading} />
          </label>
          {uploadErr && <p className="mt-2 text-sm text-red-300">{uploadErr}</p>}
        </div>

        <fieldset className="glass space-y-3 rounded-2xl p-5">
          <legend className="sr-only">Flags</legend>
          {(
            [
              ["isVisible", "Visible on site", product?.isVisible ?? true],
              ["isFeatured", "Featured on home page", product?.isFeatured ?? false],
              ["isBestSeller", "Best Seller tag", product?.isBestSeller ?? false],
              ["isGreen", "Green cracker (verify the pack marking)", product?.isGreen ?? false],
            ] as const
          ).map(([k, label, def]) => (
            <label key={k} className="flex items-center gap-3">
              <input type="checkbox" name={k} defaultChecked={def} className="h-5 w-5 accent-amber-400" />
              {label}
            </label>
          ))}
        </fieldset>

        {state?.error && (
          <p className="rounded-xl bg-red-500/15 p-3 text-sm text-red-200" role="alert">
            {state.error}
          </p>
        )}
        <button className="btn btn-primary w-full" disabled={pending || uploading}>
          {pending ? "Saving…" : "Save product"}
        </button>
      </div>
    </form>
  );
}
