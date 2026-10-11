"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "Orders", icon: "🧾" },
  { href: "/admin/quotes", label: "Quotes", icon: "💬" },
  { href: "/admin/products", label: "Products", icon: "🎆" },
  { href: "/admin/offers", label: "Offers & Settings", icon: "🏷️" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
];

export function AdminNav({ newOrders, newQuotes }: { newOrders: number; newQuotes: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        const count = l.href === "/admin/orders" ? newOrders : l.href === "/admin/quotes" ? newQuotes : 0;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-gold-400 text-black" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <span aria-hidden="true">{l.icon}</span>
            {l.label}
            {count > 0 && (
              <span className={`ml-auto rounded-full px-2 text-xs font-bold ${active ? "bg-black/20" : "bg-saffron-500 text-black"}`}>{count}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
