import "server-only";
import { randomInt } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { priceCart } from "./pricing";
import { checkPincode } from "./pincode";
import type { SiteSettings } from "./settings";
import type { checkoutSchema } from "./validation";
import type { z } from "zod";

export class OrderError extends Error {}

function newOrderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `DW-${ymd}-${randomInt(1000, 99999)}`;
}

export async function createOrder(input: z.infer<typeof checkoutSchema>, s: SiteSettings) {
  if (input.paymentMethod === "COD" && !s.codEnabled) throw new OrderError("Cash on Delivery is not available right now.");
  if (input.paymentMethod === "UPI" && (!s.upiEnabled || !s.upiId)) throw new OrderError("UPI payment is not available right now.");
  if (input.paymentMethod === "RAZORPAY" && !s.razorpayEnabled) throw new OrderError("Online payment is not available right now.");

  if (input.deliveryMode === "DELIVERY") {
    const pin = checkPincode(input.pincode, s);
    if (!pin.ok) throw new OrderError(pin.reason ?? "We cannot deliver to this pincode.");
  }

  const quote = await priceCart(input.lines, s, { couponCode: input.couponCode, deliveryMode: input.deliveryMode });
  if (quote.errors.length) throw new OrderError(quote.errors[0]);
  if (!quote.lines.length) throw new OrderError("Your cart is empty.");
  if (!quote.meetsMinimum) throw new OrderError(`Minimum order value is ₹${s.minOrderValue}.`);
  if (input.couponCode && !quote.couponCode) throw new OrderError(quote.couponMessage ?? "Coupon is not valid.");

  // Product stock demand (including combo components)
  const comboIds = quote.lines.filter((l) => l.kind === "COMBO").map((l) => l.id);
  const comboItems = comboIds.length ? await prisma.comboItem.findMany({ where: { comboId: { in: comboIds } } }) : [];
  const demand = new Map<string, number>();
  for (const l of quote.lines) {
    if (l.kind === "PRODUCT") demand.set(l.id, (demand.get(l.id) ?? 0) + l.qty);
    else for (const ci of comboItems.filter((c) => c.comboId === l.id)) demand.set(ci.productId, (demand.get(ci.productId) ?? 0) + ci.qty * l.qty);
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        for (const [productId, qty] of demand) {
          // Conditional decrement guards against overselling under concurrency.
          const res = await tx.product.updateMany({ where: { id: productId, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
          if (res.count === 0) throw new OrderError("Some items just went out of stock. Please review your cart.");
        }
        const customer = await tx.customer.upsert({
          where: { phone: input.phone },
          update: { name: input.name, email: input.email ?? undefined, city: input.city },
          create: { phone: input.phone, name: input.name, email: input.email, city: input.city },
        });
        if (quote.couponCode) await tx.coupon.update({ where: { code: quote.couponCode }, data: { usageCount: { increment: 1 } } });

        const data: Prisma.OrderCreateInput = {
          orderNumber: newOrderNumber(),
          customer: { connect: { id: customer.id } },
          name: input.name,
          phone: input.phone,
          email: input.email,
          address1: input.address1,
          address2: input.address2 || null,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          notes: input.notes || null,
          deliveryMode: input.deliveryMode,
          subtotal: quote.subtotal,
          mrpTotal: quote.mrpTotal,
          couponCode: quote.couponCode,
          couponDiscount: quote.couponDiscount,
          autoDiscount: quote.autoDiscount,
          shippingFee: quote.shippingFee,
          total: quote.total,
          paymentMethod: input.paymentMethod,
          paymentStatus: "PENDING",
          upiRef: input.upiRef || null,
          items: {
            create: quote.lines.map((l) => ({
              kind: l.kind,
              refId: l.id,
              name: l.name,
              image: l.image,
              unit: l.unit,
              unitPrice: l.unitPrice,
              unitMrp: l.unitMrp,
              qty: l.qty,
              lineTotal: l.lineTotal,
            })),
          },
        };
        return tx.order.create({ data });
      });
    } catch (e) {
      // Retry only on order-number collisions.
      if (e instanceof Error && "code" in e && (e as { code?: string }).code === "P2002") continue;
      throw e;
    }
  }
  throw new OrderError("Could not create order. Please try again.");
}

/** Put stock back when an order is cancelled (called from admin). */
export async function restockOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  const comboIds = order.items.filter((i) => i.kind === "COMBO").map((i) => i.refId);
  const comboItems = comboIds.length ? await prisma.comboItem.findMany({ where: { comboId: { in: comboIds } } }) : [];
  const back = new Map<string, number>();
  for (const i of order.items) {
    if (i.kind === "PRODUCT") back.set(i.refId, (back.get(i.refId) ?? 0) + i.qty);
    else for (const ci of comboItems.filter((c) => c.comboId === i.refId)) back.set(ci.productId, (back.get(ci.productId) ?? 0) + ci.qty * i.qty);
  }
  await prisma.$transaction(
    [...back].map(([id, qty]) => prisma.product.updateMany({ where: { id }, data: { stock: { increment: qty } } })),
  );
}
