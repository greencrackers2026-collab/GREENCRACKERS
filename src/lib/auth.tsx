import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { BootLoader } from "./store";

type AdminState = { status: "loading" } | { status: "signed-out" } | { status: "not-admin"; session: Session } | { status: "admin"; session: Session };

/** Supabase Auth session + whether the user is listed in public.admins. */
export function useAdmin(): AdminState {
  const [state, setState] = useState<AdminState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    const check = async (session: Session | null) => {
      if (!session) return alive && setState({ status: "signed-out" });
      const { data } = await supabase.rpc("is_admin");
      if (alive) setState(data ? { status: "admin", session } : { status: "not-admin", session });
    };
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Defer: Supabase recommends not awaiting other Supabase calls inside this callback.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") setTimeout(() => check(session), 0);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const admin = useAdmin();
  const location = useLocation();
  if (admin.status === "loading") return <BootLoader text="Checking your login…" />;
  if (admin.status !== "admin") return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}

export const signOut = () => supabase.auth.signOut();
