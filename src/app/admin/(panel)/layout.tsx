import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [newOrders, newQuotes] = await Promise.all([
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.quote.count({ where: { status: "NEW" } }),
  ]);
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="glass-strong no-print sticky top-0 z-30 border-x-0 border-t-0 p-3 lg:h-dvh lg:border-b-0 lg:border-r lg:p-4">
        <div className="mb-3 flex items-center justify-between lg:mb-6">
          <Link href="/admin" className="font-display text-lg text-gradient">
            🪔 Admin
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs text-white/60 hover:text-white" target="_blank">
              View site ↗
            </Link>
            <form action={logout} className="lg:hidden">
              <button className="text-xs text-white/60 hover:text-white">Logout</button>
            </form>
          </div>
        </div>
        <AdminNav newOrders={newOrders} newQuotes={newQuotes} />
        <form action={logout} className="mt-6 hidden lg:block">
          <button className="btn btn-ghost w-full text-sm">Logout</button>
        </form>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
