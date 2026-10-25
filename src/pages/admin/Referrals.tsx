import { Link } from "react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { must, useLoad } from "@/lib/useLoad";
import { formatDateTime, formatINR, waLink } from "@/lib/format";
import { cashbackWhen, referralInviteMessage, suggestReferralCode } from "@/lib/referral";
import type { Customer, Order, ReferralCode } from "@/lib/types";
import { PageTitle, StatCard, StatusBadge } from "@/components/admin/ui";
import { ActionButton, LoadState } from "@/components/admin/FormBits";
import { WhatsAppIcon } from "@/components/ui/Icons";

type ReferredOrder = Pick<
  Order,
  "id" | "order_number" | "name" | "total" | "status" | "referral_code" | "referrer_cashback" | "referrer_cashback_paid" | "friend_cashback" | "friend_cashback_paid" | "created_at"
>;

async function loadReferrals() {
  const [codes, orders, customers, paid] = await Promise.all([
    supabase.from("referral_codes").select("*").order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, order_number, name, total, status, referral_code, referrer_cashback, referrer_cashback_paid, friend_cashback, friend_cashback_paid, created_at")
      .not("referral_code", "is", null)
      .order("created_at", { ascending: false }),
    supabase.from("customers").select("name, phone").order("updated_at", { ascending: false }).limit(1000),
    // Customers who have ordered themselves; helps decide when to activate their code.
    supabase.from("orders").select("phone").neq("status", "CANCELLED"),
  ]);
  return {
    codes: must(codes) as ReferralCode[],
    orders: must(orders) as ReferredOrder[],
    customers: must(customers) as Pick<Customer, "name" | "phone">[],
    buyers: new Set((must(paid) as { phone: string }[]).map((o) => o.phone)),
  };
}

/** Date part (YYYY-MM-DD) of an ISO time, in IST. */
const istDate = (iso: string) => new Date(new Date(iso).getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);

export function ReferralsPage() {
  const { settings } = useStore();
  const { data, error, reload } = useLoad(loadReferrals, []);
  if (!data) return <LoadState error={error} onRetry={reload} />;

  const live = data.orders.filter((o) => o.status !== "CANCELLED");
  const owed = live.reduce((a, o) => a + (o.referrer_cashback_paid ? 0 : o.referrer_cashback) + (o.friend_cashback_paid ? 0 : o.friend_cashback), 0);
  const paid = live.reduce((a, o) => a + (o.referrer_cashback_paid ? o.referrer_cashback : 0) + (o.friend_cashback_paid ? o.friend_cashback : 0), 0);

  return (
    <>
      <title>Refer &amp; Earn · Admin</title>
      <PageTitle title="Refer & Earn" />
      {!settings.referral_enabled && (
        <p className="mb-4 rounded-xl bg-saffron-500/15 p-3 text-sm text-saffron-300">
          Referral codes are switched off. Turn them on in <Link to="/admin/offers" className="underline">Offers &amp; Settings → Refer &amp; earn</Link>.
        </p>
      )}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Referral codes" value={data.codes.length} />
        <StatCard label="Referred orders" value={live.length} hint="Not counting cancelled" />
        <StatCard label="Cashback to pay" value={formatINR(owed)} hint="Entered on orders, not yet sent" />
        <StatCard label="Cashback paid" value={formatINR(paid)} />
      </div>

      <section className="glass mb-6 rounded-2xl p-5" aria-labelledby="new-ref-title">
        <h2 id="new-ref-title" className="mb-1 text-lg font-semibold text-gold-300">
          Create a referral code
        </h2>
        <p className="mb-4 text-sm text-white/55">
          Friends who use the code on an order of {formatINR(settings.referral_min_order)}+ get FREE delivery + no COD charges + up to{" "}
          {formatINR(settings.referral_friend_cashback_max)} cashback. The customer earns up to {formatINR(settings.referral_reward_max)} per order.
          {settings.referral_require_purchase && " New codes start locked: tap Activate once the customer has placed their own order."}
          {settings.referral_cashback_on_diwali && ` All cashback is paid ${cashbackWhen(settings)}.`}
        </p>
        <ReferralForm
          customers={data.customers}
          codes={data.codes}
          buyers={data.buyers}
          defaultExpiry={istDate(settings.diwali_date)}
          onSaved={reload}
        />
      </section>

      <section aria-labelledby="codes-title">
        <h2 id="codes-title" className="mb-3 text-lg font-semibold text-gold-300">
          Codes
        </h2>
        {data.codes.length === 0 ? (
          <p className="glass rounded-2xl p-6 text-center text-white/60">No referral codes yet.</p>
        ) : (
          <div className="space-y-3">
            {data.codes.map((r) => (
              <CodeCard key={r.id} r={r} hasOrdered={data.buyers.has(r.referrer_phone)} orders={data.orders.filter((o) => o.referral_code === r.code)} onSaved={reload} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ReferralForm({
  customers,
  codes,
  buyers,
  defaultExpiry,
  onSaved,
}: {
  customers: Pick<Customer, "name" | "phone">[];
  codes: ReferralCode[];
  buyers: Set<string>;
  defaultExpiry: string;
  onSaved: () => void;
}) {
  const { settings } = useStore();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [expiry, setExpiry] = useState(defaultExpiry);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<{ error?: string; created?: ReferralCode }>({});

  const onPhone = (v: string) => {
    const digits = v.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "").slice(0, 10);
    setPhone(digits);
    const c = digits.length === 10 ? customers.find((x) => x.phone === digits) : undefined;
    if (c && !name) {
      setName(c.name);
      if (!code) setCode(suggestReferralCode(c.name));
    }
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!/^[6-9]\d{9}$/.test(phone)) return setState({ error: "Enter the customer's 10-digit mobile number." });
    if (name.trim().length < 2) return setState({ error: "Enter the customer's name." });
    if (!/^[A-Z0-9_-]{3,30}$/.test(c)) return setState({ error: "Code: 3–30 letters, numbers, - or _." });
    const existing = codes.find((x) => x.referrer_phone === phone);
    if (existing) return setState({ error: `This customer already has code ${existing.code}.` });
    setPending(true);
    const { data, error } = await supabase
      .from("referral_codes")
      .insert({
        code: c,
        referrer_name: name.trim(),
        referrer_phone: phone,
        expires_at: expiry ? `${expiry}T23:59:59+05:30` : null,
        active: !settings.referral_require_purchase,
      })
      .select()
      .single();
    setPending(false);
    if (error) return setState({ error: error.code === "23505" ? `Code ${c} is already taken. Try another.` : error.message });
    setState({ created: data as ReferralCode });
    setPhone("");
    setName("");
    setCode("");
    onSaved();
  }

  return (
    <form onSubmit={save} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <label className="col-span-2 sm:col-span-1">
        <span className="label">Customer mobile</span>
        <input className="input" inputMode="tel" value={phone} onChange={(e) => onPhone(e.target.value)} placeholder="10-digit mobile" list="ref-customers" />
        <datalist id="ref-customers">
          {customers.map((c) => (
            <option key={c.phone} value={c.phone}>
              {c.name}
            </option>
          ))}
        </datalist>
      </label>
      <label className="col-span-2 sm:col-span-1">
        <span className="label">Name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => !code && name.trim() && setCode(suggestReferralCode(name))} />
      </label>
      <label className="col-span-2 sm:col-span-1">
        <span className="label">Code</span>
        <div className="flex gap-2">
          <input className="input font-mono uppercase" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="RAVI482" maxLength={30} />
          <button type="button" className="btn btn-ghost shrink-0 px-3 text-sm" title="Generate a code" onClick={() => setCode(suggestReferralCode(name))}>
            🎲
          </button>
        </div>
      </label>
      <label className="col-span-2 sm:col-span-1">
        <span className="label">Valid till</span>
        <input type="date" className="input" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
      </label>
      <div className="col-span-2 flex items-end sm:col-span-1">
        <button className="btn btn-primary w-full text-sm" disabled={pending}>
          {pending ? "Saving…" : "Create code"}
        </button>
      </div>
      {state.error && <p className="col-span-2 text-sm text-red-300 lg:col-span-5">{state.error}</p>}
      {state.created && (
        <div className="col-span-2 flex flex-wrap items-center gap-3 rounded-xl bg-emerald-500/15 p-3 text-sm lg:col-span-5" role="status">
          <span>
            ✓ Code <b className="font-mono">{state.created.code}</b> created for {state.created.referrer_name}.
            {!state.created.active &&
              (buyers.has(state.created.referrer_phone)
                ? " They have already ordered, so you can activate it below."
                : " It stays locked until they order and you tap Activate.")}
          </span>
          <a
            href={waLink(`91${state.created.referrer_phone}`, referralInviteMessage(state.created, settings))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-[#25D366] text-sm text-[#06290f]"
          >
            <WhatsAppIcon width={18} height={18} /> Send on WhatsApp
          </a>
        </div>
      )}
    </form>
  );
}

function CodeCard({ r, hasOrdered, orders, onSaved }: { r: ReferralCode; hasOrdered: boolean; orders: ReferredOrder[]; onSaved: () => void }) {
  const { settings } = useStore();
  const expired = Boolean(r.expires_at && new Date(r.expires_at) < new Date());
  const live = orders.filter((o) => o.status !== "CANCELLED");
  const earned = live.reduce((a, o) => a + o.referrer_cashback, 0);
  const unpaid = live.reduce((a, o) => a + (o.referrer_cashback_paid ? 0 : o.referrer_cashback), 0);

  return (
    <details className="glass group rounded-2xl">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-5 gap-y-2 p-4 [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-lg font-semibold text-gold-300">{r.code}</span>
        <span className="min-w-32">
          {r.referrer_name}
          <a href={`tel:${r.referrer_phone}`} className="block text-xs text-white/60" onClick={(e) => e.stopPropagation()}>
            {r.referrer_phone}
          </a>
        </span>
        <span className={`badge ${hasOrdered ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-white/60"}`}>
          {hasOrdered ? "✓ Has ordered" : "No order yet"}
        </span>
        <span className={`text-sm ${expired ? "text-red-300" : "text-white/60"}`}>{r.expires_at ? `Till ${formatDateTime(r.expires_at)}` : "No expiry"}</span>
        <span className="text-sm">
          {live.length} order{live.length === 1 ? "" : "s"}
          {earned > 0 && <span className="text-white/60"> · earned {formatINR(earned)}</span>}
          {unpaid > 0 && <span className="text-saffron-400"> · {formatINR(unpaid)} to pay</span>}
        </span>
        <span className="ml-auto flex items-center gap-2">
          <a
            href={waLink(`91${r.referrer_phone}`, referralInviteMessage(r, settings))}
            target="_blank"
            rel="noopener noreferrer"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#25D366] text-[#06290f]"
            aria-label={`Send code ${r.code} to ${r.referrer_name} on WhatsApp`}
            title={r.active ? "Send “code is active” message on WhatsApp" : "Send code + offer details on WhatsApp"}
            onClick={(e) => e.stopPropagation()}
          >
            <WhatsAppIcon width={18} height={18} />
          </a>
          {r.active || expired ? (
            <ActionButton
              className={`badge cursor-pointer ${r.active && !expired ? "bg-emerald-700 text-white" : "bg-white/15"}`}
              confirm={expired ? undefined : `Lock code ${r.code} again? Friends won't be able to use it.`}
              onClick={async () => {
                must(await supabase.from("referral_codes").update({ active: !r.active }).eq("id", r.id));
                onSaved();
              }}
            >
              {expired ? "Expired" : "✓ Active"}
            </ActionButton>
          ) : (
            <ActionButton
              className="btn btn-primary !min-h-10 px-4 text-sm"
              confirm={
                hasOrdered
                  ? `Activate code ${r.code}? Then tap the WhatsApp button to tell ${r.referrer_name} it's active.`
                  : `${r.referrer_name} has no order yet. Activate code ${r.code} anyway?`
              }
              onClick={async () => {
                must(await supabase.from("referral_codes").update({ active: true }).eq("id", r.id));
                onSaved();
              }}
            >
              🔓 Activate
            </ActionButton>
          )}
        </span>
      </summary>
      <div className="border-t border-white/10 p-4 text-sm">
        {orders.length === 0 ? (
          <p className="text-white/55">No orders with this code yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                <Link to={`/admin/orders/${o.id}`} className="font-mono text-gold-300 hover:underline">
                  {o.order_number}
                </Link>
                <span>{o.name}</span>
                <span className="text-white/60">{formatINR(o.total)}</span>
                <StatusBadge value={o.status} />
                <span className="ml-auto text-xs text-white/60">
                  Referrer: {o.referrer_cashback ? `${formatINR(o.referrer_cashback)} ${o.referrer_cashback_paid ? "✓ paid" : "to pay"}` : "not set"} · Friend:{" "}
                  {o.friend_cashback ? `${formatINR(o.friend_cashback)} ${o.friend_cashback_paid ? "✓ paid" : "to pay"}` : "not set"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/50">
          <span>
            Created {formatDateTime(r.created_at)} · Set cashback on each order&apos;s page.{" "}
            {!r.active && !expired && "Locked: send the offer message now, then activate after their order and send it again."}
          </span>
          <ActionButton
            className="text-xs text-red-300 hover:underline"
            confirm={`Delete referral code ${r.code}? Past orders keep the code, but it stops working at checkout.`}
            onClick={async () => {
              must(await supabase.from("referral_codes").delete().eq("id", r.id));
              onSaved();
            }}
          >
            Delete
          </ActionButton>
        </div>
      </div>
    </details>
  );
}
