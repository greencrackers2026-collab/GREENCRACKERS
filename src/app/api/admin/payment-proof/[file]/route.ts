import { readFile } from "node:fs/promises";
import path from "node:path";
import { isAdmin } from "@/lib/auth";
import { PROOF_DIR, PROOF_NAME_RE } from "@/lib/uploads";

/** Admin-only view of a customer's payment screenshot. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { file } = await params;
  if (!PROOF_NAME_RE.test(file)) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(path.join(PROOF_DIR, file));
    return new Response(new Uint8Array(buf), { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
