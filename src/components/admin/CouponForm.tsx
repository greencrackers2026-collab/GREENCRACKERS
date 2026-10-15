import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const couponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[A-Z0-9_-]+$/, "Code: letters, numbers, - and _ only"),
  type: z.enum(["PERCENT", "FLAT", "FREESHIP"]),
  value: z.number().int().min(0),
  min_order: z.number().int().min(0),
});

export function CouponForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const [state, setState] = useState<{ error?: string; message?: string }>({});
  const [pending, setPending] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const str = (k: string) => String(fd.get(k) ?? "").trim();
    const int = (k: string) => parseInt(str(k), 10) || 0;
    const parsed = couponSchema.safeParse({ code: str("code").toUpperCase(), type: str("type"), value: int("value"), min_order: int("min_order") });
    if (!parsed.success) return setState({ error: parsed.error.issues[0].message });
    const c = parsed.data;
    if (c.type === "PERCENT" && c.value > 90) return setState({ error: "Percent coupons can be at most 90%." });
    if (c.type !== "FREESHIP" && c.value < 1) return setState({ error: "Enter a discount value." });
    if (c.type === "FREESHIP") c.value = 0;
    const exp = str("expires_at");
    setPending(true);
    // Saving an existing code updates it.
    const { error } = await supabase.from("coupons").upsert(
      { ...c, max_discount: int("max_discount") || null, expires_at: exp ? `${exp}T23:59:59+05:30` : null, active: true },
      { onConflict: "code" },
    );
    setPending(false);
    if (error) return setState({ error: error.message });
    setState({ message: `Coupon ${c.code} saved.` });
    form.reset();
    await onSaved();
  }

  return (
    <form onSubmit={save} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      <label className="col-span-2">
        <span className="label">Code</span>
        <input name="code" className="input uppercase" required placeholder="DIWALI15" />
      </label>
      <label>
        <span className="label">Type</span>
        <select name="type" className="input">
          <option value="PERCENT">% off</option>
          <option value="FLAT">Flat ₹</option>
          <option value="FREESHIP">Free delivery</option>
        </select>
      </label>
      <label>
        <span className="label">Value</span>
        <input name="value" type="number" min={0} className="input" placeholder="0 for free delivery" />
      </label>
      <label>
        <span className="label">Min order ₹</span>
        <input name="min_order" type="number" min={0} className="input" defaultValue={0} />
      </label>
      <label>
        <span className="label">Max discount ₹</span>
        <input name="max_discount" type="number" min={0} className="input" placeholder="no cap" />
      </label>
      <label className="col-span-2 sm:col-span-1">
        <span className="label">Expires</span>
        <input name="expires_at" type="date" className="input" />
      </label>
      <div className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-3 lg:col-span-7">
        <button className="btn btn-primary text-sm" disabled={pending}>
          {pending ? "Saving…" : "Save coupon"}
        </button>
        <span className="text-xs text-white/50">Saving an existing code updates it.</span>
        {state.message && <span className="text-sm text-festive-green">{state.message}</span>}
        {state.error && <span className="text-sm text-red-300">{state.error}</span>}
      </div>
    </form>
  );
}
