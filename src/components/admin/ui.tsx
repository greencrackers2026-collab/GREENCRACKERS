const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-sky-500/20 text-sky-200 ring-sky-400/40",
  CONFIRMED: "bg-indigo-500/20 text-indigo-200 ring-indigo-400/40",
  PACKED: "bg-amber-500/20 text-amber-200 ring-amber-400/40",
  SHIPPED: "bg-violet-500/20 text-violet-200 ring-violet-400/40",
  DELIVERED: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/40",
  CANCELLED: "bg-red-500/20 text-red-200 ring-red-400/40",
  PAID: "bg-emerald-500/20 text-emerald-200 ring-emerald-400/40",
  PENDING: "bg-white/10 text-white/80 ring-white/20",
  AWAITING_VERIFICATION: "bg-amber-500/20 text-amber-200 ring-amber-400/40",
  FAILED: "bg-red-500/20 text-red-200 ring-red-400/40",
  REFUNDED: "bg-white/10 text-white/70 ring-white/20",
  CONTACTED: "bg-indigo-500/20 text-indigo-200 ring-indigo-400/40",
  CLOSED: "bg-white/10 text-white/60 ring-white/20",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`badge whitespace-nowrap ring-1 ${STATUS_COLORS[value] ?? "bg-white/10 text-white"}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

export function PageTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gold-300 sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-white/50">{hint}</p>}
    </div>
  );
}
