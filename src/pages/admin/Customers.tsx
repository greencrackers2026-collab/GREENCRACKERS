import { Link, useSearchParams } from "react-router";
import { supabase } from "@/lib/supabase";
import { must, useLoad } from "@/lib/useLoad";
import { formatDateTime, formatINR } from "@/lib/format";
import type { Customer, Order } from "@/lib/types";
import { PageTitle, StatusBadge } from "@/components/admin/ui";
import { LoadState } from "@/components/admin/FormBits";

type CustomerRow = Customer & { orders: Pick<Order, "id" | "order_number" | "total" | "status" | "created_at">[] };

export function CustomersPage() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get("q") ?? "";
  const { data: customers, error, reload } = useLoad(async () => {
    let query = supabase
      .from("customers")
      .select("*, orders(id, order_number, total, status, created_at)")
      .order("updated_at", { ascending: false })
      .order("created_at", { referencedTable: "orders", ascending: false })
      .limit(300);
    const needle = q.replace(/[",().*%\\]/g, " ").trim();
    if (needle) query = query.or(["name", "phone", "city"].map((c) => `${c}.ilike."%${needle}%"`).join(","));
    return must(await query) as CustomerRow[];
  }, [q]);

  return (
    <>
      <title>Customers · Admin</title>
      <PageTitle title={`Customers (${customers?.length ?? "…"})`}>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = String(new FormData(e.currentTarget).get("q") ?? "").trim();
            setSp(v ? { q: v } : {});
          }}
        >
          <label className="sr-only" htmlFor="cq">
            Search customers
          </label>
          <input id="cq" name="q" defaultValue={q} className="input !min-h-10" placeholder="Name, phone, city" />
          <button className="btn btn-ghost text-sm">Search</button>
        </form>
      </PageTitle>
      {!customers ? (
        <LoadState error={error} onRetry={reload} />
      ) : (
        <div className="space-y-3">
          {customers.map((c) => {
            const spent = c.orders.filter((o) => o.status !== "CANCELLED").reduce((a, o) => a + o.total, 0);
            return (
              <details key={c.id} className="glass group rounded-2xl">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-6 gap-y-1 p-4 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-40 font-semibold">{c.name}</span>
                  <a href={`tel:${c.phone}`} className="text-gold-300">
                    {c.phone}
                  </a>
                  <span className="text-sm text-white/60">{c.city}</span>
                  <span className="text-sm text-white/60">{c.email}</span>
                  <span className="ml-auto text-sm">
                    {c.orders.length} order{c.orders.length === 1 ? "" : "s"} · <b>{formatINR(spent)}</b>
                  </span>
                  <span className="text-gold-300 transition-transform group-open:rotate-90" aria-hidden="true">
                    ›
                  </span>
                </summary>
                <ul className="divide-y divide-white/10 border-t border-white/10 px-4 text-sm">
                  {c.orders.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center gap-3 py-2">
                      <Link to={`/admin/orders/${o.id}`} className="font-mono text-gold-300 hover:underline">
                        {o.order_number}
                      </Link>
                      <span className="text-white/60">{formatDateTime(o.created_at)}</span>
                      <StatusBadge value={o.status} />
                      <span className="ml-auto font-semibold">{formatINR(o.total)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
          {customers.length === 0 && <p className="text-white/60">No customers found.</p>}
        </div>
      )}
    </>
  );
}
