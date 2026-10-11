import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Login" };

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="glass w-full max-w-sm rounded-3xl p-8">
        <p className="text-center text-4xl" aria-hidden="true">
          🪔
        </p>
        <h1 className="mt-2 text-center text-2xl font-bold">Admin Login</h1>
        <p className="mt-1 text-center text-sm text-white/60">Orders, products &amp; offers</p>
        <LoginForm />
      </div>
    </main>
  );
}
