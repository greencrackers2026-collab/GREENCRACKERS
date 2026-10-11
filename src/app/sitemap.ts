import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({ where: { isVisible: true }, select: { slug: true, updatedAt: true } });
  const now = new Date();
  const statics: [string, number, MetadataRoute.Sitemap[number]["changeFrequency"]][] = [
    ["/", 1, "daily"],
    ["/products", 0.9, "daily"],
    ["/quote", 0.7, "weekly"],
    ["/safety-tips", 0.5, "monthly"],
    ["/about", 0.4, "monthly"],
    ["/contact", 0.4, "monthly"],
    ["/shipping-returns", 0.3, "monthly"],
    ["/terms", 0.2, "yearly"],
    ["/privacy", 0.2, "yearly"],
  ];
  return [
    ...statics.map(([path, priority, changeFrequency]) => ({ url: absoluteUrl(path), lastModified: now, priority, changeFrequency })),
    ...products.map((p) => ({
      url: absoluteUrl(`/products/${p.slug}`),
      lastModified: p.updatedAt,
      priority: 0.8,
      changeFrequency: "daily" as const,
    })),
  ];
}
