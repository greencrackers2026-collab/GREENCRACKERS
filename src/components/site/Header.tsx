import { Link, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { cartCount, useCart } from "@/components/cart/cart-store";
import { CartIcon, CloseIcon, MenuIcon } from "@/components/ui/Icons";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/#combos", label: "Combo Packs" },
  { href: "/quote", label: "Bulk Quote" },
  { href: "/track", label: "Track Order" },
  { href: "/safety-tips", label: "Safety" },
  { href: "/contact", label: "Contact" },
];

export function Header({ storeName }: { storeName: string }) {
  const { pathname } = useLocation();
  const [menu, setMenu] = useState(false);
  const items = useCart((s) => s.items);
  const lastAddedAt = useCart((s) => s.lastAddedAt);
  const openCart = useCart((s) => s.open);
  const count = cartCount(items);

  useEffect(() => setMenu(false), [pathname]);

  return (
    <header className="relative">
      <div className="glass-strong border-x-0 border-t-0">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <button
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10 lg:hidden"
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            aria-controls="mobile-nav"
            aria-label={menu ? "Close menu" : "Open menu"}
          >
            {menu ? <CloseIcon /> : <MenuIcon />}
          </button>
          <Link to="/" className="flex min-w-0 items-center gap-2" aria-label={`${storeName} home`}>
            <span className="text-2xl" aria-hidden="true">
              🪔
            </span>
            <span className="truncate font-display text-lg text-gradient sm:text-xl">{storeName}</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((n) => {
              const active =
                n.href === "/" ? pathname === "/" : !n.href.includes("#") && pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  to={n.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 ${
                    active ? "bg-white/10 text-gold-300" : "text-white/85"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={openCart}
            className="relative ml-auto grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/15 lg:ml-2"
            aria-label={`Open cart, ${count} items`}
          >
            <CartIcon />
            <AnimatePresence>
              {count > 0 && (
                <m.span
                  key={lastAddedAt}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-saffron-500 px-1 text-[11px] font-bold text-black"
                >
                  {count}
                </m.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
      <AnimatePresence>
        {menu && (
          <m.nav
            id="mobile-nav"
            aria-label="Mobile"
            className="glass-strong absolute inset-x-0 top-16 border-x-0 lg:hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ul className="mx-auto max-w-7xl px-4 py-3">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link to={n.href} className="block rounded-xl px-4 py-3 text-base hover:bg-white/10" onClick={() => setMenu(false)}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </m.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
