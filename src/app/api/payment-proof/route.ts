import { NextResponse } from "next/server";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { PROOF_DIR } from "@/lib/uploads";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Customer uploads a UPI payment screenshot. It is re-encoded to WebP (which also strips
 * EXIF/metadata) under a random, unguessable name and is only viewable by the admin.
 */
export async function POST(req: Request) {
  if (!rateLimit(`proof:${clientIp(req)}`, 15, 10 * 60_000))
    return NextResponse.json({ error: "Too many uploads. Please wait a few minutes." }, { status: 429 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Please choose a screenshot." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Screenshot must be under 8 MB." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Please upload an image (screenshot)." }, { status: 400 });
  try {
    await mkdir(PROOF_DIR, { recursive: true });
    const name = `${randomBytes(16).toString("hex")}.webp`;
    await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(1400, 2400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(PROOF_DIR, name));
    return NextResponse.json({ proof: name });
  } catch {
    return NextResponse.json({ error: "Could not read that image. Try another screenshot." }, { status: 400 });
  }
}
