"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PaymentProofUpload } from "./PaymentProofUpload";

/** Order page: attach (or replace) the UPI payment screenshot, with an optional UTR. */
export function UpiRefForm({ orderId }: { orderId: string }) {
  const [proof, setProof] = useState<string | null>(null);
  const [ref, setRef] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!proof) return;
        setBusy(true);
        const res = await fetch(`/api/orders/${orderId}/upi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentProof: proof, upiRef: ref }),
        });
        const data = await res.json().catch(() => ({}));
        setBusy(false);
        if (res.ok) {
          setMsg({ ok: true, text: "Thanks! We'll verify your payment and confirm your order shortly." });
          router.refresh();
        } else setMsg({ ok: false, text: data.error ?? "Could not save. Try again." });
      }}
    >
      <PaymentProofUpload onUploaded={setProof} id="order-proof" />
      <div>
        <label htmlFor="upi-ref" className="label">
          UPI transaction ID / UTR (optional)
        </label>
        <input id="upi-ref" className="input" value={ref} onChange={(e) => setRef(e.target.value.trim())} placeholder="e.g. 412345678901" />
      </div>
      <button className="btn btn-primary" disabled={busy || !proof}>
        {busy ? "Submitting…" : "Submit payment proof"}
      </button>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-festive-green" : "text-red-200"}`} role="status">
          {msg.text}
        </p>
      )}
    </form>
  );
}
