// Orders placed or opened on this device, so the Track Order page can list them without a lookup.
// Stored only in this browser; the order page itself is still loaded from the database.

export type SavedOrder = { id: string; order_number: string; total: number; created_at: string };

const KEY = "my-orders-v1";

export function getMyOrders(): SavedOrder[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function rememberOrder(o: SavedOrder) {
  try {
    const rest = getMyOrders().filter((x) => x.id !== o.id);
    localStorage.setItem(KEY, JSON.stringify([o, ...rest].slice(0, 20)));
  } catch {}
}

export function forgetOrder(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(getMyOrders().filter((x) => x.id !== id)));
  } catch {}
}
