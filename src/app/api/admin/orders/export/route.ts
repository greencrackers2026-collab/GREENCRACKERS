import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildOrderWhere } from "@/lib/admin-queries";

const esc = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Neutralise spreadsheet formula injection and quote CSV fields.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const orders = await prisma.order.findMany({
    where: buildOrderWhere(sp),
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "Order No", "Date", "Status", "Payment Method", "Payment Status", "Name", "Phone", "Email",
    "Address 1", "Address 2", "City", "State", "Pincode", "Delivery Mode", "Items", "Subtotal",
    "Coupon", "Coupon Discount", "Auto Discount", "Shipping", "Total", "UPI Ref", "Razorpay Payment", "Notes",
  ];
  const rows = orders.map((o) => [
    o.orderNumber, o.createdAt.toISOString(), o.status, o.paymentMethod, o.paymentStatus, o.name, o.phone, o.email,
    o.address1, o.address2, o.city, o.state, o.pincode, o.deliveryMode,
    o.items.map((i) => `${i.name} x${i.qty}`).join("; "),
    o.subtotal, o.couponCode, o.couponDiscount, o.autoDiscount, o.shippingFee, o.total, o.upiRef, o.razorpayPaymentId, o.notes,
  ]);
  const csv = "﻿" + [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
