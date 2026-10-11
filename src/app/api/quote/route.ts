import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { quoteSchema } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`quote:${clientIp(req)}`, 5, 10 * 60_000))
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
  const parsed = quoteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  const q = await prisma.quote.create({
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      city: parsed.data.city,
      items: JSON.stringify(parsed.data.items),
      message: parsed.data.message || null,
    },
  });
  return NextResponse.json({ id: q.id });
}
