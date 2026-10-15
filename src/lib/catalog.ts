import { supabase } from "./supabase";
import { PLACEHOLDER_IMAGE } from "./constants";
import type { Combo, Product, SiteSettings } from "./types";

export type ProductView = Product & { image: string };

export type ComboView = Combo & {
  price: number;
  mrp: number;
  baseTotal: number;
  items: { productId: string; name: string; brand: string; unit: string; qty: number }[];
  available: boolean;
};

export const toProductView = (p: Product): ProductView => ({ ...p, image: p.images[0] ?? PLACEHOLDER_IMAGE });

/** Same formula as price_cart() in the database, so displayed combo prices match checkout. */
export function comboPricing(items: { qty: number; product: Pick<Product, "price" | "mrp"> }[], extraDiscount: number) {
  const baseTotal = items.reduce((a, i) => a + i.product.price * i.qty, 0);
  const mrp = items.reduce((a, i) => a + i.product.mrp * i.qty, 0);
  const price = Math.round((baseTotal * (100 - extraDiscount)) / 100);
  return { baseTotal, mrp, price };
}

type ComboRow = Combo & { combo_items: { product_id: string; qty: number; product: Product | null }[] };

function toComboView(c: ComboRow): ComboView {
  // Hidden products are filtered out by RLS, so a missing product means the combo can't be bought right now.
  const parts = c.combo_items.filter((i): i is ComboRow["combo_items"][number] & { product: Product } => Boolean(i.product));
  const { baseTotal, mrp, price } = comboPricing(parts, c.extra_discount);
  const { combo_items, ...combo } = c;
  return {
    ...combo,
    price,
    mrp,
    baseTotal,
    items: parts.map((i) => ({ productId: i.product_id, name: i.product.name, brand: i.product.brand, unit: i.product.unit, qty: i.qty })),
    available:
      parts.length > 0 &&
      parts.length === combo_items.length &&
      parts.every((i) => i.product.is_visible && i.product.stock >= i.qty),
  };
}

export async function fetchStorefront() {
  const [settings, products, combos] = await Promise.all([
    supabase.rpc("site_settings"),
    supabase.from("products").select("*").eq("is_visible", true).order("sort_order").order("created_at"),
    supabase
      .from("combos")
      .select("*, combo_items(product_id, qty, product:products(*))")
      .eq("is_visible", true)
      .order("sort_order"),
  ]);
  const error = settings.error ?? products.error ?? combos.error;
  if (error) throw error;
  if (!settings.data) throw new Error("Settings row missing. Run supabase/schema.sql and supabase/seed.sql.");
  return {
    settings: settings.data as SiteSettings,
    products: (products.data as Product[]).map(toProductView),
    combos: (combos.data as ComboRow[]).map(toComboView),
  };
}
