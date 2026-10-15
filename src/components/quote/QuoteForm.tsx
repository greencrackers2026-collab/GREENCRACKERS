import { useState } from "react";
import { fieldErrors, quoteSchema } from "@/lib/validation";
import { errorMessage, supabase } from "@/lib/supabase";
import { PlusIcon, TrashIcon } from "@/components/ui/Icons";

type Row = { product: string; qty: string };

export function QuoteForm({ productOptions }: { productOptions: string[] }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [rows, setRows] = useState<Row[]>([{ product: productOptions[0] ?? "", qty: "10" }]);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      phone,
      email: email || undefined,
      city,
      message: message || undefined,
      items: rows.filter((r) => r.product).map((r) => ({ product: r.product, qty: parseInt(r.qty, 10) || 0 })),
    };
    const parsed = quoteSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setBusy(true);
    setErrors({});
    const { error } = await supabase.from("quotes").insert({ ...parsed.data, email: parsed.data.email ?? null, message: parsed.data.message ?? null });
    setBusy(false);
    if (error) {
      setErrors({ form: errorMessage(error, "Could not submit. Please try again.") });
      return;
    }
    setDone(true);
  }

  if (done)
    return (
      <div className="glass glow-gold rounded-3xl p-8 text-center" role="status">
        <p className="text-5xl" aria-hidden="true">
          ✅
        </p>
        <h2 className="mt-3 text-2xl font-bold text-gold-300">Quote request received!</h2>
        <p className="mt-2 text-white/75">We&apos;ll get back to you with the best bulk price shortly.</p>
      </div>
    );

  const input = (id: string, label: string, value: string, onChange: (v: string) => void, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`q-${id}`} className="label">
        {label}
      </label>
      <input
        id={`q-${id}`}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(errors[id])}
        aria-describedby={errors[id] ? `qe-${id}` : undefined}
        {...props}
      />
      {errors[id] && (
        <p id={`qe-${id}`} className="mt-1 text-sm text-red-300">
          {errors[id]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="glass space-y-5 rounded-3xl p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        {input("name", "Name / Business name *", name, setName, { autoComplete: "name" })}
        {input("phone", "Mobile number *", phone, setPhone, { inputMode: "tel", autoComplete: "tel" })}
        {input("city", "City *", city, setCity, { autoComplete: "address-level2" })}
        {input("email", "Email", email, setEmail, { type: "email", autoComplete: "email" })}
      </div>

      <fieldset>
        <legend className="label">Products &amp; quantities *</legend>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2">
              <label className="sr-only" htmlFor={`row-p-${i}`}>
                Product {i + 1}
              </label>
              <select
                id={`row-p-${i}`}
                className="input flex-1"
                value={r.product}
                onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, product: e.target.value } : x)))}
              >
                {productOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
                <option>Other (mention in message)</option>
              </select>
              <label className="sr-only" htmlFor={`row-q-${i}`}>
                Quantity {i + 1}
              </label>
              <input
                id={`row-q-${i}`}
                className="input w-24"
                inputMode="numeric"
                value={r.qty}
                onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, qty: e.target.value.replace(/\D/g, "") } : x)))}
              />
              <button
                type="button"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 hover:bg-white/10 disabled:opacity-40"
                onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                disabled={rows.length === 1}
                aria-label={`Remove row ${i + 1}`}
              >
                <TrashIcon width={16} height={16} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-ghost mt-3 !min-h-10 text-sm"
          onClick={() => setRows((rs) => [...rs, { product: productOptions[0] ?? "", qty: "10" }])}
          disabled={rows.length >= 30}
        >
          <PlusIcon width={16} height={16} /> Add product
        </button>
        {errors.items && <p className="mt-1 text-sm text-red-300">{errors.items}</p>}
      </fieldset>

      <div>
        <label htmlFor="q-message" className="label">
          Message
        </label>
        <textarea
          id="q-message"
          className="input min-h-24"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          placeholder="Delivery date, GST invoice, event details…"
        />
      </div>

      {errors.form && (
        <p className="rounded-xl bg-red-500/15 p-3 text-sm text-red-200" role="alert">
          {errors.form}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="btn btn-primary flex-1" disabled={busy}>
          {busy ? "Sending…" : "Request Quote"}
        </button>
      </div>
    </form>
  );
}
