import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export async function isAdmin() {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** Call at the top of every admin server action / page. Middleware is a first line, this is the real check. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkCredentials(username: string, password: string) {
  const u = process.env.ADMIN_USERNAME;
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false;
  // Evaluate both to avoid leaking which one was wrong via timing.
  const userOk = safeEqual(username, u);
  const passOk = safeEqual(password, p);
  return userOk && passOk;
}
