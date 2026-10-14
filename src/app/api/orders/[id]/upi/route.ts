import { NextResponse } from "next/server";
import { access } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { PROOF_DIR } from "@/lib/uploads";

const schema = z.object({
  paymentProof: z.string().regex(/^[a-f0-9]{32}\.webp$/, "Please upload your payment screenshot"),
  upiRef: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{6,30}$/, "Enter a valid UPI transaction / UTR number")
    .optional()
    .or(z.literal("")),
});

/** Customer attaches (or replaces) the UPI payment screenshot for an order; the admin then verifies it. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!rateLimit(`upi:${clientIp(req)}`, 10, 10 * 60_000))
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.paymentMethod !== "UPI") return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentStatus === "PAID" || order.status === "CANCELLED")
    return NextResponse.json({ error: "This order can no longer be updated." }, { status: 409 });
  try {
    await access(path.join(PROOF_DIR, parsed.data.paymentProof));
  } catch {
    return NextResponse.json({ error: "Screenshot not found. Please upload it again." }, { status: 400 });
  }

  await prisma.order.update({
    where: { id },
    data: {
      paymentProof: parsed.data.paymentProof,
      upiRef: parsed.data.upiRef || order.upiRef,
      paymentStatus: "AWAITING_VERIFICATION",
    },
  });
  return NextResponse.json({ ok: true });
}
