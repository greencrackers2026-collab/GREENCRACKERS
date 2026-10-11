import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { checkoutSchema } from "@/lib/validation";
import { createOrder, OrderError } from "@/lib/orders";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`order:${clientIp(req)}`, 10, 10 * 60_000))
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });

  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ error: "Please check the highlighted fields.", fieldErrors }, { status: 400 });
  }
  try {
    const s = await getSettings();
    const order = await createOrder(parsed.data, s);
    return NextResponse.json({ id: order.id, orderNumber: order.orderNumber, paymentMethod: order.paymentMethod });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("Order creation failed", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
