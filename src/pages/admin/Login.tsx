import { Navigate, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import { useAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { EyeIcon, EyeOffIcon } from "@/components/ui/Icons";

export function LoginPage() {
  const admin = useAdmin();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (admin.status === "admin") return <Navigate to={from} replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setError(error.status === 400 ? "Invalid email or password." : error.message);
      setPending(false);
      return;
    }
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      await supabase.auth.signOut();
      setError("This account is not an admin. Add its user id to the admins table (see README).");
      setPending(false);
      return;
    }
    navigate(from, { replace: true });
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <title>Admin Login</title>
      <div className="glass w-full max-w-sm rounded-3xl p-8">
        <p className="text-center text-4xl" aria-hidden="true">
          🪔
        </p>
        <h1 className="mt-2 text-center text-2xl font-bold">Admin Login</h1>
        <p className="mt-1 text-center text-sm text-white/60">Orders, products &amp; offers</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input id="email" type="email" className="input" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="input pr-12"
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-white/60 hover:text-white"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
          {error && (
            <p className="rounded-xl bg-red-500/15 p-2 text-sm text-red-200" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
