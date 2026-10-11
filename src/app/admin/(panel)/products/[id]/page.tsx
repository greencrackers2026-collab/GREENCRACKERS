import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { parseJSON } from "@/lib/format";
import { PageTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { SubmitButton } from "@/components/admin/FormBits";
import { deleteProduct } from "../../../actions";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = id === "new" ? null : await prisma.product.findUnique({ where: { id } });
  if (id !== "new" && !p) notFound();

  return (
    <>
      <PageTitle title={p ? `Edit: ${p.name}` : "Add product"}>
        {p && (
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={p.id} />
            <SubmitButton className="btn btn-ghost text-sm text-red-300" confirm="Delete this product permanently? Past orders keep their copy of the item. Tip: you can hide it instead.">
              Delete
            </SubmitButton>
          </form>
        )}
      </PageTitle>
      <ProductForm
        product={
          p
            ? { ...p, images: parseJSON<string[]>(p.images, []) }
            : null
        }
      />
    </>
  );
}
