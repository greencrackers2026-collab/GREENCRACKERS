"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpiRefForm({ orderId }: { orderId: string }) {
  const [ref, setRef] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const res = await fetch(`/api/orders/${orderId}/upi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ upiRef: ref }),
        });
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        if (res.ok) {
          setMsg({ ok: true, text: "Thanks! We'll verify your payment and confirm your order shortly." });
          router.refresh();
        } else setMsg({ ok: false, text: data.error ?? "Could not save. Try again." });
      }}
    >
      <label htmlFor="upi-ref" className="label">
        After paying, enter the UPI transaction ID / UTR (12 digits)
      </label>
      <div className="flex gap-2">
        <input id="upi-ref" className="input" value={ref} onChange={(e) => setRef(e.target.value.trim())} inputMode="text" placeholder="e.g. 412345678901" />
        <button className="btn btn-primary shrink-0" disabled={busy || ref.length < 6}>
          Submit
        </button>
      </div>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-festive-green" : "text-red-200"}`} role="status">
          {msg.text}
        </p>
      )}
    </form>
  );
}
