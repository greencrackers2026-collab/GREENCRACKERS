import { supabase } from "./supabase";
import { must } from "./useLoad";
import { orderProfit, type CostMaps } from "./profit";
import type { Order, OrderWithItems } from "./types";

export type OrderFilters = { q?: string; status?: string; payment?: string; from?: string; to?: string };

/** Orders query with the admin filters applied. Dates are interpreted in IST. */
export function ordersQuery(f: OrderFilters, opts: { count?: boolean } = {}) {
  let q = supabase
    .from("orders")
    .select("*, order_items(*)", opts.count ? { count: "exact" } : undefined)
    .order("created_at", { ascending: false });
  if (f.status) q = q.eq("status", f.status);
  if (f.payment) q = q.eq("payment_method", f.payment);
  if (f.from) q = q.gte("created_at", `${f.from}T00:00:00+05:30`);
  if (f.to) q = q.lte("created_at", `${f.to}T23:59:59+05:30`);
  // Strip characters that have meaning in PostgREST filter syntax.
  const needle = f.q?.replace(/[",().*%\\]/g, " ").trim();
  if (needle) {
    q = q.or(["order_number", "name", "phone", "email", "city", "pincode"].map((c) => `${c}.ilike."%${needle}%"`).join(","));
  }
  return q;
}

export async function updateOrder(
  id: string,
  patch: Partial<
    Pick<Order, "status" | "payment_status" | "admin_note" | "referrer_cashback" | "referrer_cashback_paid" | "friend_cashback" | "friend_cashback_paid">
  >,
) {
  // Cancelling restocks the items and locks the order (database trigger).
  must(await supabase.from("orders").update(patch).eq("id", id));
}

/** Permanently deletes an order (a database trigger returns its stock unless it was already cancelled). */
export async function deleteOrder(o: Pick<Order, "id" | "payment_proof">) {
  must(await supabase.from("orders").delete().eq("id", o.id));
  // Best effort: the order is already gone even if the screenshot can't be removed.
  if (o.payment_proof) await supabase.storage.from("payment-proofs").remove([o.payment_proof]);
}

/** COD: the courier / shop has collected the cash. */
export async function markCodPaid(o: Pick<Order, "id">) {
  await updateOrder(o.id, { payment_status: "PAID" });
}

/** Admin decision on a UPI payment screenshot. Approve = paid + confirmed; Reject = cancelled + restocked. */
export async function reviewPayment(o: Order, decision: "approve" | "reject") {
  if (decision === "approve") {
    await updateOrder(o.id, { payment_status: "PAID", status: o.status === "NEW" ? "CONFIRMED" : o.status });
  } else {
    await updateOrder(o.id, {
      payment_status: "FAILED",
      status: "CANCELLED",
      admin_note: [o.admin_note, "Payment screenshot rejected."].filter(Boolean).join(" · "),
    });
  }
}

const esc = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Neutralise spreadsheet formula injection and quote CSV fields.
  const safe = typeof v !== "number" && /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function downloadOrdersCsv(orders: OrderWithItems[], maps: CostMaps) {
  const header = [
    "Order No", "Date", "Status", "Payment Method", "Payment Status", "Name", "Phone", "Email",
    "Address 1", "Address 2", "City", "State", "Pincode", "Delivery Mode", "Items", "Subtotal",
    "Coupon", "Coupon Discount", "Auto Discount", "Shipping", "COD Fee", "Total", "Cost", "Profit", "UPI Ref", "Notes",
    "Referral Code", "Referrer Cashback", "Referrer Paid", "Friend Cashback", "Friend Paid",
  ];
  const rows = orders.map((o) => {
    const pl = orderProfit(o, maps);
    return [
      o.order_number, o.created_at, o.status, o.payment_method, o.payment_status, o.name, o.phone, o.email,
      o.address1, o.address2, o.city, o.state, o.pincode, o.delivery_mode,
      o.order_items.map((i) => `${i.name} x${i.qty}`).join("; "),
      o.subtotal, o.coupon_code, o.coupon_discount, o.auto_discount, o.shipping_fee, o.cod_fee, o.total, pl.cost, pl.profit, o.upi_ref, o.notes,
      o.referral_code, o.referrer_cashback, o.referrer_cashback_paid ? "Yes" : "No", o.friend_cashback, o.friend_cashback_paid ? "Yes" : "No",
    ];
  });
  const csv = "﻿" + [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
