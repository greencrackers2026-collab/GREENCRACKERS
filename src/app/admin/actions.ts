"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkCredentials, requireAdmin } from "@/lib/auth";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken } from "@/lib/session";
import { ORDER_STATUSES, PAYMENT_STATUSES, QUOTE_STATUSES, CATEGORIES } from "@/lib/constants";
import { restockOrder } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export type ActionState = { ok?: boolean; error?: string; message?: string } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const int = (fd: FormData, k: string) => {
  const n = parseInt(str(fd, k), 10);
  return Number.isFinite(n) ? n : 0;
};
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";

const refreshSite = () => revalidatePath("/", "layout");

/* ---------------- Auth ---------------- */

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!rateLimit(`login:${ip}`, 8, 15 * 60_000)) return { error: "Too many attempts. Try again in 15 minutes." };
  if (!checkCredentials(str(fd, "username"), String(fd.get("password") ?? "")))
    return { error: "Invalid username or password." };
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(str(fd, "username")), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/* ---------------- Orders ---------------- */

export async function updateOrder(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return;

  const data: { status?: string; paymentStatus?: string; adminNote?: string | null } = {};
  const status = str(fd, "status");
  const paymentStatus = str(fd, "paymentStatus");
  if (status && (ORDER_STATUSES as readonly string[]).includes(status) && order.status !== "CANCELLED") data.status = status;
  if (paymentStatus && (PAYMENT_STATUSES as readonly string[]).includes(paymentStatus)) data.paymentStatus = paymentStatus;
  if (fd.has("adminNote")) data.adminNote = str(fd, "adminNote") || null;

  await prisma.order.update({ where: { id }, data });
  if (data.status === "CANCELLED" && order.status !== "CANCELLED") await restockOrder(id);
  revalidatePath("/admin", "layout");
}

/* ---------------- Quotes ---------------- */

export async function updateQuoteStatus(fd: FormData) {
  await requireAdmin();
  const status = str(fd, "status");
  if (!(QUOTE_STATUSES as readonly string[]).includes(status)) return;
  await prisma.quote.update({ where: { id: str(fd, "id") }, data: { status } });
  revalidatePath("/admin", "layout");
}

export async function deleteQuote(fd: FormData) {
  await requireAdmin();
  await prisma.quote.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin", "layout");
}

/* ---------------- Products ---------------- */

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
  minQty: z.number().int().min(1),
  qtyStep: z.number().int().min(1),
  sortOrder: z.number().int(),
  images: z.array(z.string().regex(/^\/(products|api\/uploads)\/[\w.-]+$/)).min(1, "Add at least one image"),
});

export async function saveProduct(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(fd, "id");
  let images: string[] = [];
  try {
    images = JSON.parse(str(fd, "images") || "[]");
  } catch {}
  const parsed = productSchema.safeParse({
    name: str(fd, "name"),
    brand: str(fd, "brand"),
    slug: str(fd, "slug").toLowerCase(),
    category: str(fd, "category"),
    unit: str(fd, "unit"),
    price: int(fd, "price"),
    mrp: int(fd, "mrp"),
    stock: int(fd, "stock"),
    minQty: int(fd, "minQty") || 1,
    qtyStep: int(fd, "qtyStep") || 1,
    sortOrder: int(fd, "sortOrder"),
    images,
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · ") };
  if (parsed.data.mrp < parsed.data.price) return { error: "MRP must be greater than or equal to the sale price." };

  const data = {
    ...parsed.data,
    images: JSON.stringify(parsed.data.images),
    priceNote: str(fd, "priceNote") || null,
    shortDesc: str(fd, "shortDesc"),
    description: str(fd, "description"),
    contents: str(fd, "contents") || null,
    safetyInfo: str(fd, "safetyInfo"),
    isGreen: bool(fd, "isGreen"),
    isBestSeller: bool(fd, "isBestSeller"),
    isFeatured: bool(fd, "isFeatured"),
    isVisible: bool(fd, "isVisible"),
  };
  try {
    if (id) await prisma.product.update({ where: { id }, data });
    else await prisma.product.create({ data });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return { error: "That slug is already used by another product." };
    throw e;
  }
  refreshSite();
  redirect("/admin/products?saved=1");
}

export async function toggleProductVisibility(fd: FormData) {
  await requireAdmin();
  const p = await prisma.product.findUnique({ where: { id: str(fd, "id") } });
  if (!p) return;
  await prisma.product.update({ where: { id: p.id }, data: { isVisible: !p.isVisible } });
  refreshSite();
}

export async function deleteProduct(fd: FormData) {
  await requireAdmin();
  await prisma.product.delete({ where: { id: str(fd, "id") } });
  refreshSite();
  redirect("/admin/products");
}

/* ---------------- Offers & settings ---------------- */

export async function saveSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  // <input type="datetime-local"> has no timezone; the owner enters it in IST.
  const rawDate = str(fd, "diwaliDate");
  const diwali = new Date(/(Z|[+-]\d\d:\d\d)$/i.test(rawDate) ? rawDate : `${rawDate}:00+05:30`);
  if (Number.isNaN(diwali.getTime())) return { error: "Enter a valid Diwali date/time." };
  const taglines = str(fd, "taglines")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);
  const maxDiscount = int(fd, "maxDiscountPercent");
  if (maxDiscount < 0 || maxDiscount > 95) return { error: "Max discount % must be between 0 and 95." };

  await prisma.settings.update({
    where: { id: 1 },
    data: {
      storeName: str(fd, "storeName") || "Diwali Crackers",
      announcement: str(fd, "announcement"),
      highlightCoupon: str(fd, "highlightCoupon").toUpperCase(),
      heroTitle: str(fd, "heroTitle"),
      heroSubtitle: str(fd, "heroSubtitle"),
      maxDiscountPercent: maxDiscount,
      taglines: JSON.stringify(taglines),
      diwaliDate: diwali,
      autoOfferThreshold: Math.max(0, int(fd, "autoOfferThreshold")),
      autoOfferPercent: Math.min(50, Math.max(0, int(fd, "autoOfferPercent"))),
      shippingFee: Math.max(0, int(fd, "shippingFee")),
      freeShippingAbove: Math.max(0, int(fd, "freeShippingAbove")),
      minOrderValue: Math.max(0, int(fd, "minOrderValue")),
      codEnabled: bool(fd, "codEnabled"),
      upiEnabled: bool(fd, "upiEnabled"),
      upiId: str(fd, "upiId"),
      upiPayeeName: str(fd, "upiPayeeName"),
      whatsappNumber: str(fd, "whatsappNumber").replace(/\D/g, ""),
      phone: str(fd, "phone"),
      email: str(fd, "email"),
      address: str(fd, "address"),
      licenceNumber: str(fd, "licenceNumber"),
      restrictionEnabled: bool(fd, "restrictionEnabled"),
      restrictionNotice: str(fd, "restrictionNotice"),
      blockedPincodePrefixes: str(fd, "blockedPincodePrefixes").replace(/[^\d,]/g, ""),
      serviceablePrefixes: str(fd, "serviceablePrefixes").replace(/[^\d,]/g, ""),
      seoCities: str(fd, "seoCities"),
    },
  });
  refreshSite();
  return { ok: true, message: "Settings saved. The site is updated." };
}

const couponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[A-Z0-9_-]+$/, "Code: letters, numbers, - and _ only"),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.number().int().min(1),
  minOrder: z.number().int().min(0),
});

export async function saveCoupon(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = couponSchema.safeParse({
    code: str(fd, "code").toUpperCase(),
    type: str(fd, "type"),
    value: int(fd, "value"),
    minOrder: int(fd, "minOrder"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.type === "PERCENT" && parsed.data.value > 90) return { error: "Percent coupons can be at most 90%." };
  const maxDiscount = int(fd, "maxDiscount") || null;
  const exp = str(fd, "expiresAt");
  const expiresAt = exp ? new Date(`${exp}T23:59:59+05:30`) : null;
  const data = { ...parsed.data, maxDiscount, expiresAt, active: true };
  await prisma.coupon.upsert({ where: { code: data.code }, update: data, create: data });
  revalidatePath("/admin/offers");
  return { ok: true, message: `Coupon ${data.code} saved.` };
}

export async function toggleCoupon(fd: FormData) {
  await requireAdmin();
  const c = await prisma.coupon.findUnique({ where: { id: str(fd, "id") } });
  if (c) await prisma.coupon.update({ where: { id: c.id }, data: { active: !c.active } });
  revalidatePath("/admin/offers");
}

export async function deleteCoupon(fd: FormData) {
  await requireAdmin();
  await prisma.coupon.delete({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/offers");
}

export async function saveCombo(fd: FormData) {
  await requireAdmin();
  const extra = Math.min(50, Math.max(0, int(fd, "extraDiscount")));
  await prisma.combo.update({
    where: { id: str(fd, "id") },
    data: { extraDiscount: extra, isVisible: bool(fd, "isVisible"), name: str(fd, "name") || undefined, tagline: str(fd, "tagline") },
  });
  refreshSite();
}
