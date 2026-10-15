import { Link, useLocation } from "react-router";

const LINKS = [
  { href: "/admin", label: "Dashboard", short: "Home", icon: "📊" },
  { href: "/admin/orders", label: "Orders", short: "Orders", icon: "🧾" },
  { href: "/admin/quotes", label: "Quotes", short: "Quotes", icon: "💬" },
  { href: "/admin/products", label: "Products", short: "Products", icon: "🎆" },
  { href: "/admin/offers", label: "Offers & Settings", short: "Offers", icon: "🏷️" },
  { href: "/admin/customers", label: "Customers", short: "Customers", icon: "👥" },
];

/** Sidebar list on desktop, bottom tab bar on phones. */
export function AdminNav({ newOrders, newQuotes, variant }: { newOrders: number; newQuotes: number; variant: "sidebar" | "tabs" }) {
  const { pathname } = useLocation();
  const items = LINKS.map((l) => ({
    ...l,
    active: l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href),
    count: l.href === "/admin/orders" ? newOrders : l.href === "/admin/quotes" ? newQuotes : 0,
  }));

  if (variant === "tabs")
    return (
      <nav
        aria-label="Admin"
        className="glass-strong no-print fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {items.map((l) => (
          <Link
            key={l.href}
            to={l.href}
            aria-current={l.active ? "page" : undefined}
            className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
              l.active ? "text-gold-300" : "text-white/65"
            }`}
          >
            <span className={`text-lg leading-none ${l.active ? "" : "opacity-80"}`} aria-hidden="true">
              {l.icon}
            </span>
            {l.short}
            {l.count > 0 && (
              <span className="absolute right-1/2 top-1.5 translate-x-5 rounded-full bg-saffron-500 px-1.5 text-[10px] font-bold leading-4 text-black">
                {l.count}
              </span>
            )}
            {l.active && <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-gold-400" aria-hidden="true" />}
          </Link>
        ))}
      </nav>
    );

  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {items.map((l) => (
        <Link
          key={l.href}
          to={l.href}
          aria-current={l.active ? "page" : undefined}
          className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            l.active ? "bg-gold-400 text-black" : "text-white/80 hover:bg-white/10"
          }`}
        >
          <span aria-hidden="true">{l.icon}</span>
          {l.label}
          {l.count > 0 && (
            <span className={`ml-auto rounded-full px-2 text-xs font-bold ${l.active ? "bg-black/20" : "bg-saffron-500 text-black"}`}>{l.count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
