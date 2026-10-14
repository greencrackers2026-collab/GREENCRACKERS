import "server-only";
import { prisma } from "./db";

/**
 * Profit & loss helpers (admin only — cost prices are never sent to customers).
 *
 * Revenue  = subtotal − coupon − auto discount   (delivery fee excluded; treated as pass-through to the courier)
 * Cost     = Σ unitCost × qty                   (cost snapshot saved on the order; if missing, the product's current cost)
 * Profit   = Revenue − Cost
 */

export type CostMaps = { product: Map<string, number>; combo: Map<string, number> };

export async function getCostMaps(): Promise<CostMaps> {
  const [products, combos] = await Promise.all([
    prisma.product.findMany({ select: { id: true, costPrice: true } }),
    prisma.combo.findMany({ select: { id: true, items: { select: { qty: true, product: { select: { costPrice: true } } } } } }),
  ]);
  const product = new Map(products.map((p) => [p.id, p.costPrice]));
  const combo = new Map(
    combos.map((c) => [
      c.id,
      // A combo's cost is only known if every component has a cost.
      c.items.every((i) => i.product.costPrice > 0) ? c.items.reduce((a, i) => a + i.product.costPrice * i.qty, 0) : 0,
    ]),
  );
  return { product, combo };
}

type ItemLike = { kind: string; refId: string; unitCost: number; qty: number; lineTotal: number };
type OrderLike = { subtotal: number; couponDiscount: number; autoDiscount: number; items: ItemLike[] };

export const itemUnitCost = (i: ItemLike, maps: CostMaps) =>
  i.unitCost || (i.kind === "COMBO" ? maps.combo.get(i.refId) : maps.product.get(i.refId)) || 0;

export function orderProfit(o: OrderLike, maps: CostMaps) {
  let cost = 0;
  let missing = false;
  for (const i of o.items) {
    const u = itemUnitCost(i, maps);
    if (!u) missing = true;
    cost += u * i.qty;
  }
  const revenue = o.subtotal - o.couponDiscount - o.autoDiscount;
  const profit = revenue - cost;
  return { revenue, cost, profit, margin: revenue > 0 ? (profit / revenue) * 100 : 0, missing };
}

export function sumProfit(orders: OrderLike[], maps: CostMaps) {
  return orders.reduce(
    (acc, o) => {
      const p = orderProfit(o, maps);
      acc.revenue += p.revenue;
      acc.cost += p.cost;
      acc.profit += p.profit;
      acc.discounts += o.couponDiscount + o.autoDiscount;
      if (p.missing) acc.missingCount++;
      return acc;
    },
    { revenue: 0, cost: 0, profit: 0, discounts: 0, missingCount: 0 },
  );
}
