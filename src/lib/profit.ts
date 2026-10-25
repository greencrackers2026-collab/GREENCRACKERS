import { supabase } from "./supabase";

/**
 * Profit & loss helpers (admin only — cost prices are never readable by customers).
 *
 * Revenue  = subtotal − coupon − auto discount   (delivery fee excluded; treated as pass-through to the courier)
 * Cost     = Σ unitCost × qty                   (cost snapshot saved on the order; if missing, the product's current cost)
 * Profit   = Revenue − Cost − referral cashback
 */

export type CostMaps = { product: Map<string, number>; combo: Map<string, number> };

export async function getCostMaps(): Promise<CostMaps> {
  const [costs, items] = await Promise.all([
    supabase.from("product_costs").select("product_id, cost_price"),
    supabase.from("combo_items").select("combo_id, product_id, qty"),
  ]);
  if (costs.error) throw costs.error;
  if (items.error) throw items.error;
  const product = new Map(costs.data.map((c) => [c.product_id as string, c.cost_price as number]));
  const parts = new Map<string, { product_id: string; qty: number }[]>();
  for (const i of items.data) parts.set(i.combo_id, [...(parts.get(i.combo_id) ?? []), i]);
  const combo = new Map(
    [...parts].map(([id, list]) => [
      id,
      // A combo's cost is only known if every component has a cost.
      list.every((i) => (product.get(i.product_id) ?? 0) > 0)
        ? list.reduce((a, i) => a + (product.get(i.product_id) ?? 0) * i.qty, 0)
        : 0,
    ]),
  );
  return { product, combo };
}

type ItemLike = { kind: string; ref_id: string; unit_cost: number; qty: number; line_total: number };
type OrderLike = {
  subtotal: number;
  coupon_discount: number;
  auto_discount: number;
  referrer_cashback?: number;
  friend_cashback?: number;
  order_items: ItemLike[];
};

export const itemUnitCost = (i: ItemLike, maps: CostMaps) =>
  i.unit_cost || (i.kind === "COMBO" ? maps.combo.get(i.ref_id) : maps.product.get(i.ref_id)) || 0;

export function orderProfit(o: OrderLike, maps: CostMaps) {
  let cost = 0;
  let missing = false;
  for (const i of o.order_items) {
    const u = itemUnitCost(i, maps);
    if (!u) missing = true;
    cost += u * i.qty;
  }
  const revenue = o.subtotal - o.coupon_discount - o.auto_discount;
  const cashback = (o.referrer_cashback ?? 0) + (o.friend_cashback ?? 0);
  const profit = revenue - cost - cashback;
  return { revenue, cost, cashback, profit, margin: revenue > 0 ? (profit / revenue) * 100 : 0, missing };
}

export function sumProfit(orders: OrderLike[], maps: CostMaps) {
  return orders.reduce(
    (acc, o) => {
      const p = orderProfit(o, maps);
      acc.revenue += p.revenue;
      acc.cost += p.cost;
      acc.profit += p.profit;
      acc.discounts += o.coupon_discount + o.auto_discount;
      if (p.missing) acc.missingCount++;
      return acc;
    },
    { revenue: 0, cost: 0, profit: 0, discounts: 0, missingCount: 0 },
  );
}
