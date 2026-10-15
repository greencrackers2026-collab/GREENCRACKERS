import { Link, useSearchParams } from "react-router";
import { supabase } from "@/lib/supabase";
import { must, useLoad } from "@/lib/useLoad";
import { QUOTE_STATUSES } from "@/lib/constants";
import { formatDateTime, waLink } from "@/lib/format";
import type { Quote } from "@/lib/types";
import { PageTitle, StatusBadge } from "@/components/admin/ui";
import { ActionButton, AutoSaveSelect, LoadState } from "@/components/admin/FormBits";
import { useAdminOutlet } from "./AdminLayout";

export function QuotesPage() {
  const [sp] = useSearchParams();
  const status = sp.get("status") ?? "";
  const { refreshCounts } = useAdminOutlet();
  const { data: quotes, error, reload } = useLoad(async () => {
    let q = supabase.from("quotes").select("*").order("created_at", { ascending: false }).limit(200);
    if (status) q = q.eq("status", status);
    return must(await q) as Quote[];
  }, [status]);
  const after = async () => {
    await reload();
    refreshCounts();
  };

  return (
    <>
      <title>Quotes · Admin</title>
      <PageTitle title={`Quote requests (${quotes?.length ?? "…"})`}>
        {["", ...QUOTE_STATUSES].map((s) => (
          <Link key={s || "all"} to={s ? `?status=${s}` : "?"} className={`btn text-sm ${status === s ? "btn-primary" : "btn-ghost"}`}>
            {s || "All"}
          </Link>
        ))}
      </PageTitle>
      {!quotes ? (
        <LoadState error={error} onRetry={reload} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {quotes.map((q) => (
            <article key={q.id} className="glass rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{q.name}</h2>
                  <p className="text-sm text-white/60">
                    {q.city} · {formatDateTime(q.created_at)}
                  </p>
                </div>
                <StatusBadge value={q.status} />
              </div>
              <p className="mt-2 text-sm">
                <a href={`tel:${q.phone}`} className="text-gold-300 hover:underline">
                  {q.phone}
                </a>
                {q.email && <span className="text-white/60"> · {q.email}</span>}
              </p>
              <ul className="mt-3 space-y-1 rounded-xl bg-white/5 p-3 text-sm">
                {q.items.map((i, n) => (
                  <li key={n} className="flex justify-between gap-2">
                    <span>{i.product}</span>
                    <b>× {i.qty}</b>
                  </li>
                ))}
              </ul>
              {q.message && <p className="mt-3 text-sm text-white/75">“{q.message}”</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="w-40">
                  <AutoSaveSelect
                    value={q.status}
                    options={QUOTE_STATUSES}
                    label={`Status for quote from ${q.name}`}
                    onSave={async (s) => {
                      must(await supabase.from("quotes").update({ status: s }).eq("id", q.id));
                      await after();
                    }}
                  />
                </div>
                <a
                  href={waLink(`91${q.phone}`, `Hi ${q.name}, thanks for your bulk crackers enquiry. Here is our quote:`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn bg-[#25D366] !min-h-9 !py-1 text-sm text-[#06290f]"
                >
                  Reply on WhatsApp
                </a>
                <div className="ml-auto">
                  <ActionButton
                    className="text-xs text-red-300 hover:underline"
                    confirm="Delete this quote request?"
                    onClick={async () => {
                      must(await supabase.from("quotes").delete().eq("id", q.id));
                      await after();
                    }}
                  >
                    Delete
                  </ActionButton>
                </div>
              </div>
            </article>
          ))}
          {quotes.length === 0 && <p className="text-white/60">No quote requests yet.</p>}
        </div>
      )}
    </>
  );
}
