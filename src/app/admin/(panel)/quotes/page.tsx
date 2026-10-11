import Link from "next/link";
import { prisma } from "@/lib/db";
import { QUOTE_STATUSES } from "@/lib/constants";
import { formatDateTime, parseJSON, waLink } from "@/lib/format";
import { PageTitle, StatusBadge } from "@/components/admin/ui";
import { AutoSubmitSelect, SubmitButton } from "@/components/admin/FormBits";
import { deleteQuote, updateQuoteStatus } from "../../actions";

export const metadata = { title: "Quotes" };

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const quotes = await prisma.quote.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageTitle title={`Quote requests (${quotes.length})`}>
        {["", ...QUOTE_STATUSES].map((s) => (
          <Link
            key={s || "all"}
            href={s ? `?status=${s}` : "?"}
            className={`btn text-sm ${(status ?? "") === s ? "btn-primary" : "btn-ghost"}`}
          >
            {s || "All"}
          </Link>
        ))}
      </PageTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        {quotes.map((q) => {
          const items = parseJSON<{ product: string; qty: number }[]>(q.items, []);
          return (
            <article key={q.id} className="glass rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{q.name}</h2>
                  <p className="text-sm text-white/60">
                    {q.city} · {formatDateTime(q.createdAt)}
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
                {items.map((i, n) => (
                  <li key={n} className="flex justify-between gap-2">
                    <span>{i.product}</span>
                    <b>× {i.qty}</b>
                  </li>
                ))}
              </ul>
              {q.message && <p className="mt-3 text-sm text-white/75">“{q.message}”</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <form action={updateQuoteStatus} className="w-40">
                  <input type="hidden" name="id" value={q.id} />
                  <AutoSubmitSelect name="status" defaultValue={q.status} options={QUOTE_STATUSES} label={`Status for quote from ${q.name}`} />
                </form>
                <a
                  href={waLink(`91${q.phone}`, `Hi ${q.name}, thanks for your bulk crackers enquiry. Here is our quote:`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn bg-[#25D366] !min-h-9 !py-1 text-sm text-[#06290f]"
                >
                  Reply on WhatsApp
                </a>
                <form action={deleteQuote} className="ml-auto">
                  <input type="hidden" name="id" value={q.id} />
                  <SubmitButton className="text-xs text-red-300 hover:underline" confirm="Delete this quote request?">
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </article>
          );
        })}
        {quotes.length === 0 && <p className="text-white/60">No quote requests yet.</p>}
      </div>
    </>
  );
}
