import { supabase } from "./supabase";

const MAX_BYTES = 8 * 1024 * 1024;

type Encoded = { blob: Blob; ext: "webp" | "jpg"; type: "image/webp" | "image/jpeg" };

/**
 * Re-encodes an image in the browser (this also strips EXIF/location metadata).
 * WebP where the browser can encode it, JPEG otherwise (Safari).
 */
async function encode(
  file: File,
  opts: { width: number; height: number; fit: "contain" | "inside"; background?: string; quality: number },
): Promise<Encoded> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_BYTES) throw new Error("Image must be under 8 MB.");
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw new Error("Could not read that image. Try another one.");
  }
  const scale = Math.min(1, opts.width / bmp.width, opts.height / bmp.height);
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = opts.fit === "contain" ? opts.width : w;
  canvas.height = opts.fit === "contain" ? opts.height : h;
  const ctx = canvas.getContext("2d")!;
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bmp, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  bmp.close();

  const toBlob = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, opts.quality));
  const webp = await toBlob("image/webp");
  if (webp?.type === "image/webp") return { blob: webp, ext: "webp", type: "image/webp" };
  const jpg = await toBlob("image/jpeg");
  if (!jpg) throw new Error("Could not process that image.");
  return { blob: jpg, ext: "jpg", type: "image/jpeg" };
}

/** Customer UPI screenshot → private bucket. Returns the object name to attach to the order. */
export async function uploadPaymentProof(file: File) {
  const img = await encode(file, { width: 1400, height: 2400, fit: "inside", quality: 0.82 });
  const name = `${crypto.randomUUID()}.${img.ext}`;
  const { error } = await supabase.storage.from("payment-proofs").upload(name, img.blob, { contentType: img.type, upsert: false });
  if (error) throw new Error("Upload failed. Please try again.");
  return name;
}

/** Admin product photo / UPI QR → public bucket, as a 1000px square on white. Returns its public URL. */
export async function uploadProductImage(file: File) {
  const img = await encode(file, { width: 1000, height: 1000, fit: "contain", background: "#ffffff", quality: 0.8 });
  const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${img.ext}`;
  const { error } = await supabase.storage.from("product-images").upload(name, img.blob, { contentType: img.type });
  if (error) throw new Error(error.message || "Upload failed");
  return supabase.storage.from("product-images").getPublicUrl(name).data.publicUrl;
}
