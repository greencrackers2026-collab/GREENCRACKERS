import { Link, Outlet, useNavigate, useOutletContext } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { AdminNav } from "@/components/admin/AdminNav";

type AdminOutlet = { refreshCounts: () => void };

/** Admin pages call this after changing orders or quotes so the nav badges stay right. */
export const useAdminOutlet = () => useOutletContext<AdminOutlet>();

export function AdminLayout() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ orders: 0, quotes: 0 });

  const refreshCounts = useCallback(async () => {
    const [o, q] = await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "NEW"),
      supabase.from("quotes").select("id", { count: "exact", head: true }).eq("status", "NEW"),
    ]);
    setCounts({ orders: o.count ?? 0, quotes: q.count ?? 0 });
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  const logout = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="glass-strong no-print sticky top-0 z-30 border-x-0 border-t-0 px-4 py-2.5 lg:h-dvh lg:border-b-0 lg:border-r lg:p-4">
        <div className="flex items-center justify-between gap-3 lg:mb-6">
          <Link to="/admin" className="font-display text-lg text-gradient">
            🪔 Admin
          </Link>
          <div className="flex items-center gap-1">
            <a href="/" className="rounded-full px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white" target="_blank" rel="noopener">
              View site ↗
            </a>
            <button className="rounded-full px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white lg:hidden" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
        <div className="hidden lg:block">
          <AdminNav variant="sidebar" newOrders={counts.orders} newQuotes={counts.quotes} />
          <button className="btn btn-ghost mt-6 w-full text-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      {/* Bottom padding keeps content clear of the phone tab bar. */}
      <main className="min-w-0 p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-24 lg:p-8">
        <Outlet context={{ refreshCounts } satisfies AdminOutlet} />
      </main>
      <AdminNav variant="tabs" newOrders={counts.orders} newQuotes={counts.quotes} />
    </div>
  );
}
