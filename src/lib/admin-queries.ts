import "server-only";
import type { Prisma } from "@prisma/client";

export type OrderFilters = { q?: string; status?: string; payment?: string; from?: string; to?: string };

export function buildOrderWhere(f: OrderFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  if (f.status) where.status = f.status;
  if (f.payment) where.paymentMethod = f.payment;
  if (f.from || f.to) {
    where.createdAt = {
      ...(f.from && { gte: new Date(`${f.from}T00:00:00+05:30`) }),
      ...(f.to && { lte: new Date(`${f.to}T23:59:59+05:30`) }),
    };
  }
  const q = f.q?.trim();
  if (q) {
    where.OR = [
      { orderNumber: { contains: q } },
      { name: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q } },
      { city: { contains: q } },
      { pincode: { contains: q } },
    ];
  }
  return where;
}
