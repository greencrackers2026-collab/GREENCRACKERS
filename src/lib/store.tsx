import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchStorefront, type ComboView, type ProductView } from "./catalog";
import { errorMessage } from "./supabase";
import type { SiteSettings } from "./types";

type Storefront = {
  settings: SiteSettings;
  products: ProductView[];
  combos: ComboView[];
  /** Re-fetch after the admin changes products, combos or settings. */
  reload: () => Promise<void>;
};

const StoreContext = createContext<Storefront | null>(null);

/** Loads settings + the visible catalogue once; the catalogue is small, so every page reads it from memory. */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Omit<Storefront, "reload"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await fetchStorefront());
      setError(null);
    } catch (e) {
      setError(errorMessage(e, "Could not load the store."));
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (error && !data)
    return (
      <main className="grid min-h-dvh place-items-center px-4">
        <div className="glass max-w-md rounded-3xl p-8 text-center">
          <p className="text-5xl" aria-hidden="true">
            🪔
          </p>
          <h1 className="mt-3 text-2xl font-bold">We couldn&apos;t load the store</h1>
          <p className="mt-2 text-sm text-white/70">{error}</p>
          <button className="btn btn-primary mt-6" onClick={() => reload()}>
            Try again
          </button>
        </div>
      </main>
    );

  if (!data) return <BootLoader />;

  return <StoreContext.Provider value={{ ...data, reload }}>{children}</StoreContext.Provider>;
}

/** Same markup as the loader in index.html (styled there), so the hand-over from HTML to React doesn't flicker. */
export function BootLoader({ text = "Loading crackers & offers…" }: { text?: string }) {
  return (
    <div className="boot" role="status" aria-live="polite" aria-busy="true">
      <div className="boot-diya" aria-hidden="true">
        🪔
      </div>
      <p className="boot-title">Lighting up the Diwali sale</p>
      <div className="boot-bar" aria-hidden="true" />
      <p className="boot-text">{text}</p>
    </div>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
