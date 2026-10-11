import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { createRazorpayOrder, razorpayEnabled } from "@/lib/razorpay";

const schema = z.object({ orderId: z.string().min(1).max(64) });

/** Creates (or re-creates, for retries) a Razorpay order for an existing unpaid store order. */
export async function POST(req: Request) {
  if (!razorpayEnabled()) return NextResponse.json({ error: "Online payment is not configured" }, { status: 400 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId } });
  if (!order || order.paymentMethod !== "RAZORPAY") return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentStatus === "PAID") return NextResponse.json({ error: "Order already paid" }, { status: 409 });
  if (order.status === "CANCELLED") return NextResponse.json({ error: "Order was cancelled" }, { status: 409 });

  try {
    const rz = await createRazorpayOrder(order.total, order.orderNumber, {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
    await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: rz.id } });
    const s = await getSettings();
    return NextResponse.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: rz.id,
      amount: rz.amount,
      currency: rz.currency,
      name: s.storeName,
      description: `Order ${order.orderNumber}`,
      prefill: { name: order.name, contact: order.phone, email: order.email ?? undefined },
    });
  } catch (e) {
    console.error("Razorpay order create failed", e);
    return NextResponse.json(
      { error: "Could not start payment. Please try again or choose another method." },
      { status: 502 },
    );
  }
}
