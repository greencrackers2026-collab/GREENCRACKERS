import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { uploadProductImage } from "@/lib/images";
import { CATEGORIES } from "@/lib/constants";
import { discountPercent } from "@/lib/format";
import type { Product } from "@/lib/types";

type P = Product & { cost_price: number; price_note: string | null };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const productSchema = z.object({
  name: z.string().min(2).max(120),
  brand: z.string().min(1).max(60),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and dashes only"),
  category: z.enum(CATEGORIES.map((c) => c.key) as [string, ...string[]]),
  unit: z.string().min(1).max(20),
  price: z.number().int().min(1),
  mrp: z.number().int().min(1),
  stock: z.number().int().min(0),
  min_qty: z.number().int().min(1),
  qty_step: z.number().int().min(1),
  sort_order: z.number().int(),
  images: z.array(z.string().regex(/^(\/products\/[\w.-]+|https:\/\/\S+)$/)).min(1, "Add at least one image"),
});

export function ProductForm({ product, onSaved }: { product: P | null; onSaved: () => Promise<void> }) {
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [mrp, setMrp] = useState(String(product?.mrp ?? ""));
  const [cost, setCost] = useState(String(product?.cost_price || ""));
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const autoSlug = (n: string, b: string) => {
    if (!slugTouched) setSlug(slugify(`${b} ${n}`));
  };

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadErr(null);
    for (const file of Array.from(files)) {
      try {
        const url = await uploadProductImage(file);
        setImages((im) => [...im, url]);
      } catch (e) {
        setUploadErr(e instanceof Error ? e.message : "Upload failed");
      }
    }
    setUploading(false);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => String(fd.get(k) ?? "").trim();
    const int = (k: string) => {
      const n = parseInt(str(k), 10);
      return Number.isFinite(n) ? n : 0;
    };
    const parsed = productSchema.safeParse({
      name: str("name"),
      brand: str("brand"),
      slug: str("slug").toLowerCase(),
      category: str("category"),
      unit: str("unit"),
      price: int("price"),
      mrp: int("mrp"),
      stock: int("stock"),
      min_qty: int("min_qty") || 1,
      qty_step: int("qty_step") || 1,
      sort_order: int("sort_order"),
      images,
    });
    if (!parsed.success) return setError(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · "));
    if (parsed.data.mrp < parsed.data.price) return setError("MRP must be greater than or equal to the sale price.");

    const row = {
      ...parsed.data,
      short_desc: str("short_desc"),
      description: str("description"),
      contents: str("contents") || null,
      safety_info: str("safety_info"),
      is_green: fd.get("is_green") === "on",
      is_best_seller: fd.get("is_best_seller") === "on",
      is_featured: fd.get("is_featured") === "on",
      is_visible: fd.get("is_visible") === "on",
    };
    setPending(true);
    setError(null);
    const res = product
      ? await supabase.from("products").update(row).eq("id", product.id).select("id").single()
      : await supabase.from("products").insert(row).select("id").single();
    if (res.error) {
      setPending(false);
      return setError(res.error.code === "23505" ? "That slug is already used by another product." : res.error.message);
    }
    const costRes = await supabase
      .from("product_costs")
      .upsert({ product_id: res.data.id, cost_price: Math.max(0, int("cost_price")), price_note: str("price_note") || null });
    if (costRes.error) {
      setPending(false);
      return setError(`Product saved, but the cost price wasn't: ${costRes.error.message}`);
    }
    await onSaved();
  }

  const off = discountPercent(Number(mrp) || 0, Number(price) || 0);
  const unitProfit = (Number(price) || 0) - (Number(cost) || 0);
  const unitMargin = Number(price) ? (unitProfit / Number(price)) * 100 : 0;

  return (
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
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
            <input name="cost_price" type="number" min={0} className="input" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="What you pay the supplier" />
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
            <input name="sort_order" type="number" className="input" defaultValue={product?.sort_order ?? 99} />
          </label>
          <label>
            <span className="label">Minimum qty</span>
            <input name="min_qty" type="number" min={1} className="input" defaultValue={product?.min_qty ?? 1} />
          </label>
          <label>
            <span className="label">Qty step</span>
            <input name="qty_step" type="number" min={1} className="input" defaultValue={product?.qty_step ?? 1} />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Pack contents (e.g. &quot;10 pieces per box&quot;)</span>
            <input name="contents" className="input" defaultValue={product?.contents ?? ""} />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Short description (cards &amp; SEO)</span>
            <input name="short_desc" className="input" maxLength={200} defaultValue={product?.short_desc ?? ""} />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Full description</span>
            <textarea name="description" className="input min-h-28" defaultValue={product?.description ?? ""} />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Safety information</span>
            <textarea name="safety_info" className="input min-h-24" defaultValue={product?.safety_info ?? ""} />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Internal price note (admin only)</span>
            <input name="price_note" className="input" defaultValue={product?.price_note ?? ""} />
          </label>
        </div>
      </div>

      <div className="space-y-6">
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold">Images</h2>
          <p className="text-xs text-white/55">The first image is the main photo. Uploads are converted to optimised 1000px squares.</p>
          <ul className="mt-3 grid grid-cols-3 gap-3">
            {images.map((src, i) => (
              <li key={src} className="relative">
                <img src={src} alt="" width={160} height={160} className={`aspect-square w-full rounded-xl object-cover ${i === 0 ? "ring-2 ring-gold-400" : ""}`} />
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
              ["is_visible", "Visible on site", product?.is_visible ?? true],
              ["is_featured", "Featured on home page", product?.is_featured ?? false],
              ["is_best_seller", "Best Seller tag", product?.is_best_seller ?? false],
              ["is_green", "Green cracker (verify the pack marking)", product?.is_green ?? false],
            ] as const
          ).map(([k, label, def]) => (
            <label key={k} className="flex items-center gap-3">
              <input type="checkbox" name={k} defaultChecked={def} className="h-5 w-5 accent-amber-400" />
              {label}
            </label>
          ))}
        </fieldset>

        {error && (
          <p className="rounded-xl bg-red-500/15 p-3 text-sm text-red-200" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary w-full" disabled={pending || uploading}>
          {pending ? "Saving…" : "Save product"}
        </button>
      </div>
    </form>
  );
}
