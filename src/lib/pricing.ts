import "server-only";
import { prisma } from "./db";
import { comboPricing, toProductView } from "./catalog";
import type { SiteSettings } from "./settings";

import type { CartLineInput } from "./validation";

export type PricedLine = {
  kind: "PRODUCT" | "COMBO";
  id: string;
  name: string;
  image: string | null;
  unit: string;
  unitPrice: number;
  unitMrp: number;
  qty: number;
  lineTotal: number;
};

export type PriceQuote = {
  lines: PricedLine[];
  errors: string[];
  subtotal: number;
  mrpTotal: number;
  couponCode: string | null;
  couponDiscount: number;
  couponMessage: string | null;
  autoDiscount: number;
  shippingFee: number;
  total: number;
  savings: number;
  meetsMinimum: boolean;
};

/**
 * Server-side source of truth for every price shown at checkout and stored on orders.
 * Client-sent prices are never trusted; only ids + quantities.
 */
export async function priceCart(
  input: CartLineInput[],
  settings: SiteSettings,
  opts: { couponCode?: string | null; deliveryMode?: "DELIVERY" | "PICKUP" } = {},
): Promise<PriceQuote> {
  const errors: string[] = [];
  const productIds = input.filter((l) => l.kind === "PRODUCT").map((l) => l.id);
  const comboIds = input.filter((l) => l.kind === "COMBO").map((l) => l.id);

  const [products, combos] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } } }),
    prisma.combo.findMany({ where: { id: { in: comboIds } }, include: { items: { include: { product: true } } } }),
  ]);

  const demand = new Map<string, number>(); // productId -> qty needed (for stock check)
  const stockOf = new Map<string, { name: string; stock: number }>();
  const lines: PricedLine[] = [];

  for (const l of input) {
    if (l.kind === "PRODUCT") {
      const p = products.find((x) => x.id === l.id);
      if (!p || !p.isVisible) {
        errors.push("An item in your cart is no longer available and was removed.");
        continue;
      }
      const pv = toProductView(p);
      lines.push({
        kind: "PRODUCT",
        id: p.id,
        name: `${p.brand} ${p.name}`,
        image: pv.image,
        unit: p.unit,
        unitPrice: p.price,
        unitMrp: p.mrp,
        qty: l.qty,
        lineTotal: p.price * l.qty,
      });
      demand.set(p.id, (demand.get(p.id) ?? 0) + l.qty);
      stockOf.set(p.id, { name: `${p.brand} ${p.name}`, stock: p.stock });
    } else {
      const c = combos.find((x) => x.id === l.id);
      if (!c || !c.isVisible || c.items.some((i) => !i.product.isVisible)) {
        errors.push("A combo pack in your cart is no longer available and was removed.");
        continue;
      }
      const { price, mrp } = comboPricing(c.items, c.extraDiscount);
      lines.push({
        kind: "COMBO",
        id: c.id,
        name: `${c.name} (Combo)`,
        image: c.image,
        unit: "pack",
        unitPrice: price,
        unitMrp: mrp,
        qty: l.qty,
        lineTotal: price * l.qty,
      });
      for (const i of c.items) {
        demand.set(i.productId, (demand.get(i.productId) ?? 0) + i.qty * l.qty);
        stockOf.set(i.productId, { name: `${i.product.brand} ${i.product.name}`, stock: i.product.stock });
      }
    }
  }

  for (const [pid, need] of demand) {
    const s = stockOf.get(pid)!;
    if (need > s.stock) errors.push(`Only ${s.stock} left of ${s.name}. Please reduce the quantity.`);
  }

  const subtotal = lines.reduce((a, l) => a + l.lineTotal, 0);
  const mrpTotal = lines.reduce((a, l) => a + l.unitMrp * l.qty, 0);

  // Coupon
  let couponDiscount = 0;
  let couponMessage: string | null = null;
  let couponCode: string | null = null;
  const code = opts.couponCode?.trim().toUpperCase();
  if (code) {
    const c = await prisma.coupon.findUnique({ where: { code } });
    if (!c || !c.active) couponMessage = "Invalid coupon code.";
    else if (c.expiresAt && c.expiresAt < new Date()) couponMessage = "This coupon has expired.";
    else if (subtotal < c.minOrder) couponMessage = `Add items worth ₹${c.minOrder - subtotal} more to use ${code}.`;
    else {
      couponDiscount =
        c.type === "PERCENT" ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal);
      if (c.maxDiscount) couponDiscount = Math.min(couponDiscount, c.maxDiscount);
      couponCode = c.code;
      couponMessage = `${c.code} applied: you save ₹${couponDiscount}.`;
    }
  }

  // Automatic "extra off above ₹X" rule
  const autoDiscount =
    settings.autoOfferPercent > 0 && subtotal >= settings.autoOfferThreshold
      ? Math.round((subtotal * settings.autoOfferPercent) / 100)
      : 0;

  const shippingFee =
    opts.deliveryMode === "PICKUP" || subtotal === 0 || subtotal >= settings.freeShippingAbove ? 0 : settings.shippingFee;

  const total = Math.max(0, subtotal - couponDiscount - autoDiscount + shippingFee);

  return {
    lines,
    errors,
    subtotal,
    mrpTotal,
    couponCode,
    couponDiscount,
    couponMessage,
    autoDiscount,
    shippingFee,
    total,
    savings: mrpTotal - subtotal + couponDiscount + autoDiscount,
    meetsMinimum: subtotal >= settings.minOrderValue,
  };
}
