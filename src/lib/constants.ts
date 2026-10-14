export const CATEGORIES = [
  { key: "SOUND", label: "Sound", emoji: "💥", desc: "Bombs, string crackers and loud classics" },
  { key: "GROUND", label: "Ground", emoji: "🌀", desc: "Chakkars and spinning ground items" },
  { key: "SKY_SHOTS", label: "Sky Shots", emoji: "🎆", desc: "Repeated shots, aerial shells and petis" },
  { key: "SPARKLERS", label: "Sparklers", emoji: "✨", desc: "Fuljhadi and colour sparklers" },
  { key: "FOUNTAINS", label: "Fountains", emoji: "🌋", desc: "Anar, flowerpots and crackling fountains" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export const categoryLabel = (key: string) => CATEGORIES.find((c) => c.key === key)?.label ?? key;

export const ORDER_STATUSES = ["NEW", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export const PAYMENT_STATUSES = ["PENDING", "AWAITING_VERIFICATION", "PAID", "FAILED", "REFUNDED"] as const;
export const PAYMENT_METHODS = ["RAZORPAY", "UPI", "COD"] as const;
export const QUOTE_STATUSES = ["NEW", "CONTACTED", "CLOSED"] as const;

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  RAZORPAY: "Razorpay (UPI / Cards / Netbanking)",
  UPI: "UPI (scan QR + upload screenshot)",
  COD: "Cash on Delivery",
};

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];
