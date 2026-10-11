import "server-only";
import Razorpay from "razorpay";
import { createHmac, timingSafeEqual } from "node:crypto";

export const razorpayEnabled = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

let client: Razorpay | null = null;
function rzp() {
  if (!razorpayEnabled()) throw new Error("Razorpay keys are not configured");
  client ??= new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
  return client;
}

export async function createRazorpayOrder(amountInr: number, receipt: string, notes: Record<string, string>) {
  const order = await rzp().orders.create({ amount: amountInr * 100, currency: "INR", receipt, notes });
  return { id: order.id, amount: Number(order.amount), currency: order.currency };
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
