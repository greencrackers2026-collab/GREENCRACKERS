import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDateTime, formatINR } from "@/lib/format";
import { PageTitle, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const needle = q?.trim();
  const customers = await prisma.customer.findMany({
    where: needle ? { OR: [{ name: { contains: needle } }, { phone: { contains: needle } }, { city: { contains: needle } }] } : undefined,
    include: { orders: { orderBy: { createdAt: "desc" }, select: { id: true, orderNumber: true, total: true, status: true, createdAt: true } } },
    orderBy: { updatedAt: "desc" },
    take: 300,
  });

  return (
    <>
      <PageTitle title={`Customers (${customers.length})`}>
        <form method="get" className="flex gap-2">
          <label className="sr-only" htmlFor="cq">
            Search customers
          </label>
          <input id="cq" name="q" defaultValue={q} className="input !min-h-10" placeholder="Name, phone, city" />
          <button className="btn btn-ghost text-sm">Search</button>
        </form>
      </PageTitle>
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
                    <Link href={`/admin/orders/${o.id}`} className="font-mono text-gold-300 hover:underline">
                      {o.orderNumber}
                    </Link>
                    <span className="text-white/60">{formatDateTime(o.createdAt)}</span>
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
    </>
  );
}
