export const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, "");

export const absoluteUrl = (path = "/") =>
  /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

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
