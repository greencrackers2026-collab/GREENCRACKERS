import { useState } from "react";
import { errorMessage } from "@/lib/supabase";

/** A <select> that saves as soon as it changes (used for quick status updates). */
export function AutoSaveSelect({
  value,
  options,
  label,
  onSave,
}: {
  value: string;
  options: readonly string[];
  label: string;
  onSave: (value: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <select
      value={value}
      aria-label={label}
      disabled={busy}
      className="input !min-h-10 w-full min-w-[9.5rem] !py-1 text-sm"
      onChange={async (e) => {
        setBusy(true);
        try {
          await onSave(e.target.value);
        } catch (err) {
          alert(errorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}

/** Button that runs an async action, optionally after a confirm() prompt, and shows a busy state. */
export function ActionButton({
  children,
  onClick,
  className = "btn btn-primary",
  confirm,
}: {
  children: React.ReactNode;
  onClick: () => Promise<void>;
  className?: string;
  confirm?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={async () => {
        if (confirm && !window.confirm(confirm)) return;
        setBusy(true);
        try {
          await onClick();
        } catch (err) {
          alert(errorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Saving…" : children}
    </button>
  );
}

export function PrintButton() {
  return (
    <button type="button" className="btn btn-primary no-print" onClick={() => window.print()}>
      🖨️ Print
    </button>
  );
}

/** Loading / error placeholder shared by admin pages. */
export function LoadState({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  if (error)
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-red-200">{error}</p>
        <button className="btn btn-ghost mt-3 text-sm" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  return <div className="glass h-64 animate-pulse rounded-2xl" aria-busy="true" />;
}
