import { NextResponse } from "next/server";
import { z } from "zod";
import { getSettings } from "@/lib/settings";
import { priceCart } from "@/lib/pricing";
import { cartLineSchema } from "@/lib/validation";

const bodySchema = z.object({
  lines: z.array(cartLineSchema).max(50),
  couponCode: z.string().trim().max(30).optional(),
  deliveryMode: z.enum(["DELIVERY", "PICKUP"]).optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const s = await getSettings();
  const quote = await priceCart(parsed.data.lines, s, parsed.data);
  return NextResponse.json(quote);
}
