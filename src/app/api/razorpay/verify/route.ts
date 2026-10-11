import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { razorpayEnabled, verifyRazorpaySignature } from "@/lib/razorpay";

const schema = z.object({
  orderId: z.string().min(1).max(64),
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
});

export async function POST(req: Request) {
  if (!razorpayEnabled()) return NextResponse.json({ error: "Not configured" }, { status: 400 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.razorpayOrderId !== razorpay_order_id)
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });

  if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "PAID",
      razorpayPaymentId: razorpay_payment_id,
      status: order.status === "NEW" ? "CONFIRMED" : order.status,
    },
  });
  return NextResponse.json({ ok: true });
}
