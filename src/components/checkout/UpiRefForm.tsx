import { useState } from "react";
import { errorMessage, supabase } from "@/lib/supabase";
import { PaymentProofUpload } from "./PaymentProofUpload";

/** Order page: attach (or replace) the UPI payment screenshot, with an optional UTR. */
export function UpiRefForm({ orderId, onSaved }: { orderId: string; onSaved: () => void }) {
  const [proof, setProof] = useState<string | null>(null);
  const [ref, setRef] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!proof) return;
        setBusy(true);
        const { error } = await supabase.rpc("attach_payment_proof", { p_order_id: orderId, p_proof: proof, p_upi_ref: ref });
        setBusy(false);
        if (error) setMsg({ ok: false, text: errorMessage(error, "Could not save. Try again.") });
        else {
          setMsg({ ok: true, text: "Thanks! We'll verify your payment and confirm your order shortly." });
          onSaved();
        }
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
