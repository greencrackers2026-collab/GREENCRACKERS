"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type RzpOptions = Record<string, unknown> & { handler: (r: RzpResponse) => void };
type RzpResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
declare global {
  interface Window {
    Razorpay?: new (o: RzpOptions) => { open: () => void; on: (e: string, cb: () => void) => void };
  }
}

function loadScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function RazorpayPay({ orderId, autoOpen }: { orderId: string; autoOpen: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const opened = useRef(false);

  const pay = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    const ok = await loadScript();
    if (!ok || !window.Razorpay) {
      setMsg("Could not load the payment window. Check your connection and try again.");
      setBusy(false);
      return;
    }
    const res = await fetch("/api/razorpay/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Could not start payment.");
      setBusy(false);
      return;
    }
    const rzp = new window.Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency,
      name: data.name,
      description: data.description,
      order_id: data.razorpayOrderId,
      prefill: data.prefill,
      theme: { color: "#ff8c42" },
      modal: { ondismiss: () => setBusy(false) },
      handler: async (r: RzpResponse) => {
        const v = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, ...r }),
        });
        if (v.ok) {
          router.replace(`/order/${orderId}`);
          router.refresh();
        } else {
          setMsg("Payment could not be verified. If money was debited, contact us with your order number.");
          setBusy(false);
        }
      },
    });
    rzp.on("payment.failed", () => {
      setMsg("Payment failed. You can try again.");
      setBusy(false);
    });
    rzp.open();
  }, [orderId, router]);

  useEffect(() => {
    if (autoOpen && !opened.current) {
      opened.current = true;
      pay();
    }
  }, [autoOpen, pay]);

  return (
    <div className="space-y-2">
      <button className="btn btn-primary w-full sm:w-auto" onClick={pay} disabled={busy}>
        {busy ? "Opening payment…" : "Pay Now with Razorpay"}
      </button>
      {msg && (
        <p className="text-sm text-red-200" role="alert">
          {msg}
        </p>
      )}
    </div>
  );
}
