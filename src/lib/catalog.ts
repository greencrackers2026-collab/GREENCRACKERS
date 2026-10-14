import "server-only";
import { cache } from "react";
import type { Combo, ComboItem, Product } from "@prisma/client";
import { prisma } from "./db";
import { parseJSON } from "./format";

export type ProductView = Omit<Product, "images" | "createdAt" | "updatedAt" | "priceNote" | "costPrice"> & {
  images: string[];
  image: string;
};

export function toProductView(p: Product): ProductView {
  const images = parseJSON<string[]>(p.images, []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt, updatedAt, priceNote, costPrice, ...rest } = p;
  return { ...rest, images, image: images[0] ?? "/products/fuljhadi-small-placeholder.webp" };
}

export type ComboView = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  extraDiscount: number;
  price: number;
  mrp: number;
  baseTotal: number;
  items: { productId: string; name: string; brand: string; unit: string; qty: number }[];
  available: boolean;
};

export function comboPricing(items: { qty: number; product: Pick<Product, "price" | "mrp"> }[], extraDiscount: number) {
  const baseTotal = items.reduce((a, i) => a + i.product.price * i.qty, 0);
  const mrp = items.reduce((a, i) => a + i.product.mrp * i.qty, 0);
  const price = Math.round(baseTotal * (1 - extraDiscount / 100));
  return { baseTotal, mrp, price };
}

export function toComboView(c: Combo & { items: (ComboItem & { product: Product })[] }): ComboView {
  const { baseTotal, mrp, price } = comboPricing(c.items, c.extraDiscount);
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    image: c.image,
    extraDiscount: c.extraDiscount,
    price,
    mrp,
    baseTotal,
    items: c.items.map((i) => ({
      productId: i.productId,
      name: i.product.name,
      brand: i.product.brand,
      unit: i.product.unit,
      qty: i.qty,
    })),
    available: c.items.every((i) => i.product.isVisible && i.product.stock >= i.qty),
  };
}

export const getVisibleProducts = cache(async () => {
  const rows = await prisma.product.findMany({
    where: { isVisible: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toProductView);
});

export const getProductBySlug = cache(async (slug: string) => {
  const p = await prisma.product.findUnique({ where: { slug } });
  return p && p.isVisible ? toProductView(p) : null;
});

export const getVisibleCombos = cache(async () => {
  const rows = await prisma.combo.findMany({
    where: { isVisible: true },
    include: { items: { include: { product: true } } },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map(toComboView);
});
