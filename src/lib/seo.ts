import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const absoluteUrl = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const BASE_KEYWORDS = [
  "buy Diwali crackers online",
  "Sivakasi crackers",
  "Diwali crackers offer 70% off",
  "crackers combo pack",
  "green crackers",
  "online crackers shopping",
];

export const cityKeywords = (cities: string[]) =>
  cities.flatMap((c) => [`buy crackers online in ${c}`, `Diwali crackers ${c}`]);

/** Small helper so every page gets canonical + OG + Twitter consistently. */
export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
  noindex?: boolean;
}): Metadata {
  const image = opts.image ?? "/og-image.jpg";
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    alternates: { canonical: opts.path },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: opts.path,
      type: "website",
      locale: "en_IN",
      images: [{ url: image, width: 1200, height: 630, alt: opts.title }],
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: [image] },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
  };
}
