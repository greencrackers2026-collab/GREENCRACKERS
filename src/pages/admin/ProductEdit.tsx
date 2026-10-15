import { useNavigate, useParams } from "react-router";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { must, useLoad } from "@/lib/useLoad";
import { PageTitle } from "@/components/admin/ui";
import { ActionButton, LoadState } from "@/components/admin/FormBits";
import { ProductForm } from "@/components/admin/ProductForm";
import { NotFound } from "@/pages/site/NotFound";
import { costOf, type ProductWithCost } from "./Products";

export function EditProduct() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const isNew = id === "new";
  const { data: p, error, loading, reload } = useLoad(async () => {
    if (isNew) return null;
    return must(await supabase.from("products").select("*, product_costs(cost_price, price_note)").eq("id", id).maybeSingle()) as ProductWithCost | null;
  }, [id]);

  if (!isNew && !p) return loading || error ? <LoadState error={error} onRetry={reload} /> : <NotFound />;

  return (
    <>
      <title>{p ? `Edit: ${p.name} · Admin` : "Add product · Admin"}</title>
      <PageTitle title={p ? `Edit: ${p.name}` : "Add product"}>
        {p && (
          <ActionButton
            className="btn btn-ghost text-sm text-red-300"
            confirm="Delete this product permanently? Past orders keep their copy of the item. Tip: you can hide it instead."
            onClick={async () => {
              must(await supabase.from("products").delete().eq("id", p.id));
              await store.reload();
              navigate("/admin/products");
            }}
          >
            Delete
          </ActionButton>
        )}
      </PageTitle>
      <ProductForm
        key={p?.id ?? "new"}
        product={p ? { ...p, cost_price: costOf(p)?.cost_price ?? 0, price_note: costOf(p)?.price_note ?? null } : null}
        onSaved={async () => {
          await store.reload();
          navigate("/admin/products?saved=1");
        }}
      />
    </>
  );
}
