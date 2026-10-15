import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { errorMessage, supabase } from "@/lib/supabase";
import { forgetOrder, getMyOrders } from "@/lib/myOrders";
import { formatDateTime, formatINR } from "@/lib/format";
import { phoneSchema } from "@/lib/validation";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Seo } from "@/components/site/Seo";

export function TrackPage() {
  const navigate = useNavigate();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState(getMyOrders);

  async function find(e: React.FormEvent) {
    e.preventDefault();
    const num = orderNumber.trim().toUpperCase();
    const ph = phoneSchema.safeParse(phone);
    if (!/^DW-\d{6}-\d+$/.test(num)) return setError("Enter your order number, e.g. DW-261015-94600.");
    if (!ph.success) return setError("Enter the 10-digit mobile number you used at checkout.");
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.rpc("find_order", { p_order_number: num, p_phone: ph.data });
    setBusy(false);
    if (error) return setError(errorMessage(error));
    if (!data) return setError("No order found with that order number and mobile number. Please check both and try again.");
    navigate(`/order/${data}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Seo title="Track Your Order" description="Check the status of your Diwali crackers order using your order number and mobile number." path="/track" />
      <Breadcrumbs items={[{ name: "Track Order", href: "/track" }]} />
      <h1 className="mt-3 font-display text-3xl sm:text-4xl">
        Track your <span className="text-gradient">Order</span>
      </h1>
      <p className="mt-2 text-white/70">See your order status, payment and items anytime.</p>

      {mine.length > 0 && (
        <section className="glass mt-6 rounded-3xl p-5 sm:p-6" aria-labelledby="mine-title">
          <h2 id="mine-title" className="text-lg font-bold text-gold-300">
            Your orders on this device
          </h2>
          <ul className="mt-3 divide-y divide-white/10">
            {mine.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-3">
                <Link to={`/order/${o.id}`} className="min-w-0 flex-1">
                  <span className="block font-mono font-semibold text-gold-300">{o.order_number}</span>
                  <span className="block text-sm text-white/60">
                    {formatINR(o.total)} · {formatDateTime(o.created_at)}
                  </span>
                </Link>
                <Link to={`/order/${o.id}`} className="btn btn-ghost !min-h-9 !px-4 text-sm">
                  View
                </Link>
                <button
                  type="button"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/40 hover:bg-white/10 hover:text-white"
                  aria-label={`Remove ${o.order_number} from this list`}
                  title="Remove from this list (the order itself is not affected)"
                  onClick={() => {
                    forgetOrder(o.id);
                    setMine(getMyOrders());
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form onSubmit={find} noValidate className="glass mt-6 space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="text-lg font-bold text-gold-300">{mine.length ? "Find another order" : "Find your order"}</h2>
        <div>
          <label htmlFor="t-order" className="label">
            Order number
          </label>
          <input
            id="t-order"
            className="input font-mono uppercase"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="DW-261015-94600"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
          <p className="mt-1 text-xs text-white/50">It&apos;s on your order confirmation and in our WhatsApp message.</p>
        </div>
        <div>
          <label htmlFor="t-phone" className="label">
            Mobile number used at checkout
          </label>
          <input
            id="t-phone"
            className="input"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s-]/g, ""))}
            placeholder="10-digit mobile"
          />
        </div>
        {error && (
          <p className="rounded-xl bg-red-500/15 p-3 text-sm text-red-200" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Finding…" : "Track Order"}
        </button>
      </form>
    </div>
  );
}
