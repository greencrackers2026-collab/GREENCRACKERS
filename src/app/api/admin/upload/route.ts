import { NextResponse } from "next/server";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { isAdmin } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/uploads";

const MAX_BYTES = 8 * 1024 * 1024;

/** Admin image upload: converts any image to a square 1000px WebP and returns its URL. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image must be under 8 MB" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });

  try {
    const input = Buffer.from(await file.arrayBuffer());
    await mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now()}-${randomBytes(4).toString("hex")}.webp`;
    await sharp(input)
      .rotate()
      .resize(1000, 1000, { fit: "contain", background: "#ffffff" })
      .flatten({ background: "#ffffff" })
      .webp({ quality: 80 })
      .toFile(path.join(UPLOAD_DIR, name));
    return NextResponse.json({ url: `/api/uploads/${name}` });
  } catch {
    return NextResponse.json({ error: "Could not process that image" }, { status: 400 });
  }
}
