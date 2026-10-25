// Row shapes as stored in Supabase (see supabase/schema.sql). Field names stay snake_case end to end.

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  price: number;
  mrp: number;
  stock: number;
  images: string[];
  short_desc: string;
  description: string;
  contents: string | null;
  safety_info: string;
  is_green: boolean;
  is_best_seller: boolean;
  is_featured: boolean;
  is_visible: boolean;
  min_qty: number;
  qty_step: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductCost = { product_id: string; cost_price: number; price_note: string | null };

export type Combo = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  extra_discount: number;
  is_visible: boolean;
  sort_order: number;
};

export type ComboItem = { id: string; combo_id: string; product_id: string; qty: number };

export type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FLAT" | "FREESHIP";
  value: number;
  min_order: number;
  max_discount: number | null;
  expires_at: string | null;
  active: boolean;
  usage_count: number;
  created_at: string;
};

export type ReferralCode = {
  id: string;
  code: string;
  referrer_name: string;
  referrer_phone: string;
  active: boolean;
  expires_at: string | null;
  usage_count: number;
  created_at: string;
};

export type Settings = {
  id: number;
  store_name: string;
  announcement: string;
  highlight_coupon: string;
  hero_title: string;
  hero_subtitle: string;
  max_discount_percent: number;
  taglines: string[];
  diwali_date: string;
  auto_offer_threshold: number;
  auto_offer_percent: number;
  shipping_fee: number;
  cod_fee: number;
  free_shipping_above: number;
  min_order_value: number;
  cod_enabled: boolean;
  upi_enabled: boolean;
  upi_id: string;
  upi_payee_name: string;
  upi_qr_image: string;
  whatsapp_number: string;
  phone: string;
  email: string;
  address: string;
  licence_number: string;
  restriction_enabled: boolean;
  restriction_notice: string;
  blocked_pincode_prefixes: string;
  serviceable_prefixes: string;
  seo_cities: string;
  referral_enabled: boolean;
  referral_min_order: number;
  referral_reward_max: number;
  referral_friend_cashback_max: number;
  referral_require_purchase: boolean;
  referral_cashback_on_diwali: boolean;
  updated_at: string;
};

/** What the site_settings() function returns: the settings row plus derived values. */
export type SiteSettings = Settings & {
  auto_coupon: { code: string; type: Coupon["type"]; value: number } | null;
  upi_available: boolean;
};

export type PaymentMethod = "UPI" | "COD";
export type DeliveryMode = "DELIVERY" | "PICKUP";

export type PricedLine = {
  kind: "PRODUCT" | "COMBO";
  id: string;
  name: string;
  image: string | null;
  unit: string;
  unit_price: number;
  unit_mrp: number;
  qty: number;
  line_total: number;
};

/** Returned by the price_cart() function, the single source of truth for checkout prices. */
export type PriceQuote = {
  lines: PricedLine[];
  errors: string[];
  subtotal: number;
  mrp_total: number;
  coupon_code: string | null;
  coupon_discount: number;
  coupon_message: string | null;
  auto_discount: number;
  shipping_fee: number;
  cod_fee: number;
  total: number;
  savings: number;
  /** True when coupon_code is a referral code (delivery + COD charges waived). */
  referral: boolean;
  referral_waiver: number;
  meets_minimum: boolean;
};

export type Order = {
  id: string;
  order_number: string;
  customer_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  pincode: string;
  notes: string | null;
  delivery_mode: DeliveryMode;
  subtotal: number;
  mrp_total: number;
  coupon_code: string | null;
  referral_code: string | null;
  referrer_cashback: number;
  friend_cashback: number;
  referrer_cashback_paid: boolean;
  friend_cashback_paid: boolean;
  coupon_discount: number;
  auto_discount: number;
  shipping_fee: number;
  cod_fee: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: string;
  upi_ref: string | null;
  payment_proof: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  kind: "PRODUCT" | "COMBO";
  ref_id: string;
  name: string;
  image: string | null;
  unit: string;
  unit_price: number;
  unit_mrp: number;
  unit_cost: number;
  qty: number;
  line_total: number;
};

export type OrderWithItems = Order & { order_items: OrderItem[] };

/** Customer-facing order from get_order(): no admin fields. */
export type PublicOrder = Omit<Order, "admin_note" | "customer_id" | "payment_proof" | "referrer_cashback" | "referrer_cashback_paid"> & {
  has_payment_proof: boolean;
  items: Pick<OrderItem, "id" | "kind" | "name" | "image" | "unit" | "unit_price" | "qty" | "line_total">[];
};

export type Customer = {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
};

export type Quote = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string;
  items: { product: string; qty: number }[];
  message: string | null;
  status: string;
  created_at: string;
};
