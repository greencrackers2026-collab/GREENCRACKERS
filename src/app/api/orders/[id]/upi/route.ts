import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  upiRef: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{6,30}$/, "Enter a valid UPI transaction / UTR number"),
});

/** Customer submits the UPI transaction reference (UTR) after paying; admin verifies it. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimit(`upi:${clientIp(req)}`, 10, 10 * 60_000))
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.paymentMethod !== "UPI") return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentStatus === "PAID") return NextResponse.json({ ok: true });
  await prisma.order.update({
    where: { id },
    data: { upiRef: parsed.data.upiRef, paymentStatus: "AWAITING_VERIFICATION" },
  });
  return NextResponse.json({ ok: true });
}
