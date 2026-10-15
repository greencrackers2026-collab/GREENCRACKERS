import { useEffect, useState } from "react";
import { deleteOrder } from "@/lib/admin";
import { errorMessage } from "@/lib/supabase";
import { formatINR } from "@/lib/format";
import type { Order } from "@/lib/types";
import { TrashIcon } from "@/components/ui/Icons";

type Step = "closed" | "sure" | "type";

/**
 * Two-step delete: "Are you sure?", then type the order number to enable the final button.
 */
export function DeleteOrderButton({
  order,
  onDeleted,
  className = "btn btn-ghost text-sm text-red-300",
  label = "Delete order",
}: {
  order: Pick<Order, "id" | "order_number" | "name" | "total" | "status" | "payment_proof">;
  onDeleted: () => void | Promise<void>;
  className?: string;
  label?: React.ReactNode;
}) {
  const [step, setStep] = useState<Step>("closed");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matches = typed.trim().toUpperCase() === order.order_number.toUpperCase();

  const close = () => {
    if (busy) return;
    setStep("closed");
    setTyped("");
    setError(null);
  };

  useEffect(() => {
    if (step === "closed") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  });

  async function confirmDelete() {
    if (!matches) return;
    setBusy(true);
    setError(null);
    try {
      await deleteOrder(order);
      setStep("closed");
      await onDeleted();
    } catch (e) {
      setError(errorMessage(e, "Could not delete the order."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setStep("sure")} aria-label={`Delete order ${order.order_number}`}>
        {label}
      </button>
      {step !== "closed" && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={close}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="del-title"
            className="glass-strong w-full max-w-md rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-500/20 text-red-300">
              <TrashIcon />
            </div>
            {step === "sure" ? (
              <>
                <h2 id="del-title" className="text-center text-lg font-bold">
                  Delete order {order.order_number}?
                </h2>
                <p className="mt-2 text-center text-sm text-white/70">
                  {order.name} · {formatINR(order.total)}. This permanently removes the order, its items
                  {order.payment_proof ? " and the payment screenshot" : ""}. It can&apos;t be undone.
                </p>
                {order.status !== "CANCELLED" && (
                  <p className="mt-3 rounded-xl bg-white/5 p-3 text-center text-xs text-white/60">
                    The items will be put back into stock. To keep a record instead, set the status to CANCELLED.
                  </p>
                )}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button type="button" className="btn btn-ghost" onClick={close}>
                    Keep order
                  </button>
                  <button type="button" className="btn bg-red-600 text-white" onClick={() => setStep("type")} autoFocus>
                    Yes, continue
                  </button>
                </div>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  confirmDelete();
                }}
              >
                <h2 id="del-title" className="text-center text-lg font-bold">
                  Type the order number to confirm
                </h2>
                <p className="mt-2 text-center text-sm text-white/70">
                  Type <b className="select-all font-mono text-gold-300">{order.order_number}</b> below.
                </p>
                <label className="sr-only" htmlFor="del-confirm">
                  Order number
                </label>
                <input
                  id="del-confirm"
                  className="input mt-4 text-center font-mono uppercase"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder={order.order_number}
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  autoFocus
                />
                {error && (
                  <p className="mt-3 rounded-xl bg-red-500/15 p-2 text-center text-sm text-red-200" role="alert">
                    {error}
                  </p>
                )}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button type="button" className="btn btn-ghost" onClick={close} disabled={busy}>
                    Cancel
                  </button>
                  <button type="submit" className="btn bg-red-600 text-white" disabled={!matches || busy}>
                    {busy ? "Deleting…" : "Delete forever"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
