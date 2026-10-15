import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "./supabase";

/** Runs an async loader when `deps` change; `reload()` re-runs it (e.g. after a mutation). Stale results are dropped. */
export function useLoad<T>(load: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const run = useRef(0);

  const reload = useCallback(async () => {
    const id = ++run.current;
    setLoading(true);
    try {
      const d = await load();
      if (id === run.current) {
        setData(d);
        setError(null);
      }
    } catch (e) {
      if (id === run.current) setError(errorMessage(e));
    } finally {
      if (id === run.current) setLoading(false);
    }
    // The caller lists what `load` depends on, like a useEffect dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload };
}

/** Throws the Supabase error if there is one, otherwise returns the data. */
export function must<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data as T;
}
