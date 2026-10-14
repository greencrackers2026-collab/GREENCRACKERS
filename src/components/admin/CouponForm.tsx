"use client";

import { useActionState } from "react";
import { saveCoupon } from "@/app/admin/actions";

export function CouponForm() {
  const [state, action, pending] = useActionState(saveCoupon, undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
      <label className="lg:col-span-2">
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
        <input name="minOrder" type="number" min={0} className="input" defaultValue={0} />
      </label>
      <label>
        <span className="label">Max discount ₹</span>
        <input name="maxDiscount" type="number" min={0} className="input" placeholder="no cap" />
      </label>
      <label>
        <span className="label">Expires</span>
        <input name="expiresAt" type="date" className="input" />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-3 lg:col-span-7">
        <button className="btn btn-primary text-sm" disabled={pending}>
          {pending ? "Saving…" : "Save coupon"}
        </button>
        <span className="text-xs text-white/50">Saving an existing code updates it.</span>
        {state?.message && <span className="text-sm text-festive-green">{state.message}</span>}
        {state?.error && <span className="text-sm text-red-300">{state.error}</span>}
      </div>
    </form>
  );
}
