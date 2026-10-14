import "server-only";
import path from "node:path";

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

/** Customer payment screenshots — never served publicly, only via the admin-only route. */
export const PROOF_DIR = path.join(UPLOAD_DIR, "payment-proofs");
export const PROOF_NAME_RE = /^[a-f0-9]{32}\.webp$/;
