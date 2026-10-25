-- Diwali Crackers Store: Supabase schema.
-- Paste into Supabase → SQL Editor and run. It is safe to re-run.
--
-- Security model
--   * The browser only ever has the public anon key, so Row Level Security (RLS) is the real gatekeeper.
--   * Customers can read the visible catalogue and settings, submit quotes, and upload a payment screenshot.
--   * Prices, coupons, stock and orders are only ever written by the SECURITY DEFINER functions below
--     (price_cart / place_order / attach_payment_proof), which re-price everything from the database.
--     Client-sent prices are never trusted.
--   * Admins are Supabase Auth users listed in public.admins. Everything else is admin-only.

-- ───────────────────────────── Admins ─────────────────────────────

create table if not exists public.admins (
  user_id    uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public._touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ───────────────────────────── Catalogue ─────────────────────────────

create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name           text not null check (char_length(name) between 2 and 120),
  brand          text not null check (char_length(brand) between 1 and 60),
  category       text not null check (category in ('SOUND', 'GROUND', 'SKY_SHOTS', 'SPARKLERS', 'FOUNTAINS')),
  unit           text not null default 'box' check (char_length(unit) between 1 and 20), -- box | pack | piece
  price          int  not null check (price >= 1),  -- sale price in INR
  mrp            int  not null,                     -- MRP in INR (shown struck through)
  stock          int  not null default 100 check (stock >= 0),
  images         text[] not null default '{}',
  short_desc     text not null default '',
  description    text not null default '',
  contents       text,
  safety_info    text not null default '',
  is_green       boolean not null default false,
  is_best_seller boolean not null default false,
  is_featured    boolean not null default false,
  is_visible     boolean not null default true,
  min_qty        int not null default 1 check (min_qty >= 1),
  qty_step       int not null default 1 check (qty_step >= 1),
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (mrp >= price)
);

-- Owner's purchase cost: kept in its own table so RLS can hide it from customers entirely.
create table if not exists public.product_costs (
  product_id uuid primary key references public.products on delete cascade,
  cost_price int not null default 0 check (cost_price >= 0),
  price_note text -- internal note, e.g. "Listed range 450–500"
);

create table if not exists public.combos (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  tagline        text not null default '',
  description    text not null default '',
  image          text not null,
  extra_discount int not null default 10 check (extra_discount between 0 and 50), -- extra % off on top of sale prices
  is_visible     boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.combo_items (
  id         uuid primary key default gen_random_uuid(),
  combo_id   uuid not null references public.combos on delete cascade,
  product_id uuid not null references public.products on delete cascade,
  qty        int not null check (qty >= 1)
);

create table if not exists public.coupons (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique check (code ~ '^[A-Z0-9_-]{3,30}$'),
  type         text not null check (type in ('PERCENT', 'FLAT', 'FREESHIP')), -- FREESHIP waives the delivery fee
  value        int not null default 0 check (value >= 0),
  min_order    int not null default 0 check (min_order >= 0),
  max_discount int check (max_discount > 0), -- cap for PERCENT coupons
  expires_at   timestamptz,
  active       boolean not null default true,
  usage_count  int not null default 0,
  created_at   timestamptz not null default now(),
  check (type <> 'PERCENT' or value <= 90)
);

-- Refer & earn: the admin creates one code per customer (the referrer) and sends it on WhatsApp.
-- A friend who orders with it gets free delivery + no COD charges (+ cashback paid by the admin);
-- the referrer earns cashback per referred order. Cashback amounts are recorded on the order.
create table if not exists public.referral_codes (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique check (code ~ '^[A-Z0-9_-]{3,30}$'),
  referrer_name  text not null check (char_length(referrer_name) between 2 and 80),
  referrer_phone text not null unique check (referrer_phone ~ '^[6-9][0-9]{9}$'),
  active         boolean not null default true,
  expires_at     timestamptz,
  usage_count    int not null default 0,
  created_at     timestamptz not null default now()
);

-- Coupons and referral codes share the checkout code box, so a code can only exist in one of them.
create or replace function public._code_not_taken() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (tg_table_name = 'coupons' and exists (select 1 from public.referral_codes where code = new.code))
     or (tg_table_name = 'referral_codes' and exists (select 1 from public.coupons where code = new.code)) then
    raise exception 'Code % is already used by a %.', new.code,
      case tg_table_name when 'coupons' then 'referral code' else 'coupon' end;
  end if;
  return new;
end $$;
drop trigger if exists coupons_code_not_taken on public.coupons;
create trigger coupons_code_not_taken before insert or update of code on public.coupons
  for each row execute function public._code_not_taken();
drop trigger if exists referral_codes_code_not_taken on public.referral_codes;
create trigger referral_codes_code_not_taken before insert or update of code on public.referral_codes
  for each row execute function public._code_not_taken();

-- ───────────────────────────── Orders ─────────────────────────────

create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null unique,
  name       text not null,
  email      text,
  city       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique,
  customer_id     uuid references public.customers on delete set null,
  name            text not null,
  phone           text not null,
  email           text,
  address1        text not null,
  address2        text,
  city            text not null,
  state           text not null,
  pincode         text not null,
  notes           text,
  delivery_mode   text not null default 'DELIVERY' check (delivery_mode in ('DELIVERY', 'PICKUP')),
  subtotal        int not null,
  mrp_total       int not null,
  coupon_code     text,
  coupon_discount int not null default 0,
  auto_discount   int not null default 0,
  shipping_fee    int not null default 0,
  cod_fee         int not null default 0,
  total           int not null,
  payment_method  text not null check (payment_method in ('UPI', 'COD')),
  payment_status  text not null default 'PENDING'
                  check (payment_status in ('PENDING', 'AWAITING_VERIFICATION', 'PAID', 'FAILED', 'REFUNDED')),
  upi_ref         text,
  payment_proof   text, -- object name in the private payment-proofs bucket
  status          text not null default 'NEW'
                  check (status in ('NEW', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  admin_note      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_customer_idx on public.orders (customer_id);

-- Refer & earn (added later, so as columns that are safe to re-run)
alter table public.orders add column if not exists referral_code          text;
alter table public.orders add column if not exists referrer_cashback      int not null default 0 check (referrer_cashback >= 0);
alter table public.orders add column if not exists friend_cashback        int not null default 0 check (friend_cashback >= 0);
alter table public.orders add column if not exists referrer_cashback_paid boolean not null default false;
alter table public.orders add column if not exists friend_cashback_paid   boolean not null default false;
create index if not exists orders_referral_code_idx on public.orders (referral_code) where referral_code is not null;

create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders on delete cascade,
  kind       text not null check (kind in ('PRODUCT', 'COMBO')),
  ref_id     uuid not null, -- product or combo id (no FK: past orders survive product deletion)
  name       text not null,
  image      text,
  unit       text not null,
  unit_price int not null,
  unit_mrp   int not null,
  unit_cost  int not null default 0, -- cost snapshot at order time (0 = not set)
  qty        int not null,
  line_total int not null
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.quotes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 80),
  phone      text not null check (phone ~ '^[6-9][0-9]{9}$'),
  email      text check (email is null or char_length(email) <= 120),
  city       text not null check (char_length(city) between 2 and 60),
  items      jsonb not null default '[]'
             check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 30),
  message    text check (message is null or char_length(message) <= 1000),
  status     text not null default 'NEW' check (status in ('NEW', 'CONTACTED', 'CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────────────── Settings (single row) ─────────────────────────────

create table if not exists public.settings (
  id                       int primary key default 1 check (id = 1),
  store_name               text not null default 'Sivakasi Sparkle Crackers',
  announcement             text not null default '',
  highlight_coupon         text not null default '',
  hero_title               text not null default 'MEGA PRE-DIWALI SALE: UP TO 70% OFF',
  hero_subtitle            text not null default '',
  max_discount_percent     int  not null default 70 check (max_discount_percent between 0 and 95),
  taglines                 text[] not null default '{}',
  diwali_date              timestamptz not null default '2026-11-08 18:00:00+05:30',
  auto_offer_threshold     int  not null default 3000 check (auto_offer_threshold >= 0),
  auto_offer_percent       int  not null default 5 check (auto_offer_percent between 0 and 50),
  shipping_fee             int  not null default 65 check (shipping_fee >= 0),
  cod_fee                  int  not null default 50 check (cod_fee >= 0),
  free_shipping_above      int  not null default 2000 check (free_shipping_above >= 0),
  min_order_value          int  not null default 500 check (min_order_value >= 0),
  cod_enabled              boolean not null default true,
  upi_enabled              boolean not null default true,
  upi_id                   text not null default '',
  upi_payee_name           text not null default '',
  upi_qr_image             text not null default '',
  whatsapp_number          text not null default '',
  phone                    text not null default '',
  email                    text not null default '',
  address                  text not null default '',
  licence_number           text not null default '',
  restriction_enabled      boolean not null default true,
  restriction_notice       text not null default '',
  blocked_pincode_prefixes text not null default '', -- comma separated, e.g. "110,121,122,201"
  serviceable_prefixes     text not null default '', -- comma separated; empty = all others allowed
  seo_cities               text not null default '', -- comma separated local SEO cities
  updated_at               timestamptz not null default now()
);
-- The single settings row is created by seed.sql (edit it later in Admin → Offers & Settings).

-- Refer & earn rules
alter table public.settings add column if not exists referral_enabled             boolean not null default true;
alter table public.settings add column if not exists referral_min_order           int not null default 1999 check (referral_min_order >= 0);
alter table public.settings add column if not exists referral_reward_max          int not null default 1000 check (referral_reward_max >= 0);
alter table public.settings add column if not exists referral_friend_cashback_max int not null default 100 check (referral_friend_cashback_max >= 0);

-- ───────────────────────────── updated_at triggers ─────────────────────────────

drop trigger if exists touch_products on public.products;
create trigger touch_products before update on public.products for each row execute function public._touch_updated_at();
drop trigger if exists touch_combos on public.combos;
create trigger touch_combos before update on public.combos for each row execute function public._touch_updated_at();
drop trigger if exists touch_customers on public.customers;
create trigger touch_customers before update on public.customers for each row execute function public._touch_updated_at();
drop trigger if exists touch_quotes on public.quotes;
create trigger touch_quotes before update on public.quotes for each row execute function public._touch_updated_at();
drop trigger if exists touch_settings on public.settings;
create trigger touch_settings before update on public.settings for each row execute function public._touch_updated_at();

-- ───────────────────────────── Rate limiting ─────────────────────────────
-- Blunts form spam per client IP (Supabase passes the caller's IP in x-forwarded-for).

create table if not exists public.request_log (
  key text not null,
  at  timestamptz not null default now()
);
create index if not exists request_log_key_at_idx on public.request_log (key, at);

create or replace function public._rate_limit(p_action text, p_max int, p_window interval) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_ip  text := coalesce(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1), 'unknown');
  v_key text := p_action || ':' || btrim(v_ip);
begin
  if random() < 0.02 then
    delete from public.request_log where at < now() - interval '1 day';
  end if;
  if (select count(*) from public.request_log where key = v_key and at > now() - p_window) >= p_max then
    raise exception 'Too many attempts. Please wait a few minutes and try again.';
  end if;
  insert into public.request_log (key) values (v_key);
end $$;

create or replace function public._quotes_rate_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    perform public._rate_limit('quote', 5, interval '10 minutes');
    new.status := 'NEW';
  end if;
  return new;
end $$;
drop trigger if exists quotes_rate_limit on public.quotes;
create trigger quotes_rate_limit before insert on public.quotes for each row execute function public._quotes_rate_limit();

-- ───────────────────────────── Public settings ─────────────────────────────

-- Settings row plus the auto-applied coupon (the highlighted coupon when it is active and not expired).
create or replace function public.site_settings() returns jsonb
language sql stable security definer set search_path = '' as $$
  select to_jsonb(s) || jsonb_build_object(
    'auto_coupon', (
      select jsonb_build_object('code', c.code, 'type', c.type, 'value', c.value)
      from public.coupons c
      where c.code = s.highlight_coupon and c.active and (c.expires_at is null or c.expires_at > now())
    ),
    'upi_available', s.upi_enabled and (s.upi_qr_image <> '' or s.upi_id <> '')
  )
  from public.settings s
  where s.id = 1;
$$;

-- ───────────────────────────── Pricing (server-side source of truth) ─────────────────────────────

create or replace function public._pincode_error(p_pin text, p_blocked text, p_allowed text) returns text
language plpgsql immutable as $$
declare
  v_allowed text[] := array(select btrim(x) from unnest(string_to_array(p_allowed, ',')) x where btrim(x) <> '');
begin
  if p_pin !~ '^[1-9][0-9]{5}$' then
    return 'Enter a valid 6-digit pincode.';
  end if;
  if exists (select 1 from unnest(string_to_array(p_blocked, ',')) x where btrim(x) <> '' and p_pin like btrim(x) || '%') then
    return 'Sorry, sale/delivery of crackers is restricted in your area. You can choose pickup from our licensed shop.';
  end if;
  if cardinality(v_allowed) > 0 and not exists (select 1 from unnest(v_allowed) x where p_pin like x || '%') then
    return 'We don''t deliver to this pincode yet. Please contact us.';
  end if;
  return null;
end $$;

-- Prices a cart of {kind, id, qty} lines. Only ids and quantities come from the client.
create or replace function public.price_cart(
  p_lines          jsonb,
  p_coupon_code    text default null,
  p_delivery_mode  text default 'DELIVERY',
  p_payment_method text default null
) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  s                 public.settings;
  v_line            jsonb;
  v_kind            text;
  v_id              uuid;
  v_qty             int;
  p                 public.products;
  c                 public.combos;
  v_lines           jsonb := '[]';
  v_errors          text[] := '{}';
  v_demand          jsonb := '{}'; -- product id -> qty needed (including combo components)
  v_subtotal        int := 0;
  v_mrp_total       int := 0;
  v_base            int;
  v_combo_mrp       int;
  v_combo_price     int;
  v_shipping        int;
  v_code            text := upper(btrim(coalesce(p_coupon_code, '')));
  cp                public.coupons;
  v_coupon_code     text;
  v_coupon_discount int := 0;
  v_coupon_message  text;
  rf                public.referral_codes;
  v_referral        boolean := false; -- a valid referral code was applied
  v_waiver          int := 0;         -- delivery + COD charges waived by the referral code
  v_auto            int := 0;
  v_cod             int := 0;
  r                 record;
begin
  select * into s from public.settings where id = 1;
  if jsonb_typeof(p_lines) is distinct from 'array' or jsonb_array_length(p_lines) > 50 then
    raise exception 'Invalid cart.';
  end if;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_kind := v_line ->> 'kind';
    if (v_line ->> 'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or (v_line ->> 'qty') !~ '^[0-9]{1,5}$' or v_kind not in ('PRODUCT', 'COMBO') then
      raise exception 'Invalid cart.';
    end if;
    v_id := (v_line ->> 'id')::uuid;
    v_qty := (v_line ->> 'qty')::int;
    if v_qty < 1 or v_qty > 10000 then
      raise exception 'Invalid quantity.';
    end if;

    if v_kind = 'PRODUCT' then
      select * into p from public.products where id = v_id;
      if not found or not p.is_visible then
        v_errors := array_append(v_errors, 'An item in your cart is no longer available and was removed.');
        continue;
      end if;
      v_lines := v_lines || jsonb_build_object(
        'kind', 'PRODUCT', 'id', p.id, 'name', p.brand || ' ' || p.name,
        'image', coalesce(p.images[1], '/products/fuljhadi-small-placeholder.webp'), 'unit', p.unit,
        'unit_price', p.price, 'unit_mrp', p.mrp, 'qty', v_qty, 'line_total', p.price * v_qty);
      v_subtotal := v_subtotal + p.price * v_qty;
      v_mrp_total := v_mrp_total + p.mrp * v_qty;
      v_demand := jsonb_set(v_demand, array[p.id::text], to_jsonb(coalesce((v_demand ->> p.id::text)::int, 0) + v_qty));
    else
      select * into c from public.combos where id = v_id;
      if not found or not c.is_visible
         or not exists (select 1 from public.combo_items where combo_id = c.id)
         or exists (select 1 from public.combo_items ci join public.products pp on pp.id = ci.product_id
                    where ci.combo_id = c.id and not pp.is_visible) then
        v_errors := array_append(v_errors, 'A combo pack in your cart is no longer available and was removed.');
        continue;
      end if;
      select sum(pp.price * ci.qty)::int, sum(pp.mrp * ci.qty)::int into v_base, v_combo_mrp
      from public.combo_items ci join public.products pp on pp.id = ci.product_id
      where ci.combo_id = c.id;
      v_combo_price := round(v_base * (100 - c.extra_discount) / 100.0)::int;
      v_lines := v_lines || jsonb_build_object(
        'kind', 'COMBO', 'id', c.id, 'name', c.name || ' (Combo)', 'image', c.image, 'unit', 'pack',
        'unit_price', v_combo_price, 'unit_mrp', v_combo_mrp, 'qty', v_qty, 'line_total', v_combo_price * v_qty);
      v_subtotal := v_subtotal + v_combo_price * v_qty;
      v_mrp_total := v_mrp_total + v_combo_mrp * v_qty;
      for r in select product_id, qty from public.combo_items where combo_id = c.id loop
        v_demand := jsonb_set(v_demand, array[r.product_id::text],
                              to_jsonb(coalesce((v_demand ->> r.product_id::text)::int, 0) + r.qty * v_qty));
      end loop;
    end if;
  end loop;

  for r in select key::uuid as pid, value::int as need from jsonb_each_text(v_demand) loop
    select * into p from public.products where id = r.pid;
    if r.need > p.stock then
      v_errors := array_append(v_errors, format('Only %s left of %s %s. Please reduce the quantity.', p.stock, p.brand, p.name));
    end if;
  end loop;

  v_shipping := case
    when p_delivery_mode = 'PICKUP' or v_subtotal = 0 or v_subtotal >= s.free_shipping_above then 0
    else s.shipping_fee end;

  -- Coupon (FREESHIP coupons waive the delivery fee; it shows as a coupon discount)
  -- or referral code (waives delivery + COD charges; cashback is paid later by the admin).
  if v_code <> '' then
    select * into cp from public.coupons where code = v_code;
    if cp.id is null then
      select * into rf from public.referral_codes where code = v_code;
    end if;
    if rf.id is not null then
      if not s.referral_enabled or not rf.active then
        v_coupon_message := 'This referral code is not active.';
      elsif rf.expires_at is not null and rf.expires_at < now() then
        v_coupon_message := 'This referral code has expired.';
      elsif v_subtotal < s.referral_min_order then
        v_coupon_message := format('Add items worth ₹%s more to use referral code %s (min order ₹%s).',
                                   s.referral_min_order - v_subtotal, v_code, s.referral_min_order);
      else
        v_referral := true;
        v_coupon_code := rf.code;
        v_coupon_message := format('Referral code %s applied: FREE delivery, no COD charges and up to ₹%s cashback after delivery.',
                                   rf.code, s.referral_friend_cashback_max);
      end if;
    elsif cp.id is null or not cp.active then
      v_coupon_message := 'Invalid coupon code.';
    elsif cp.expires_at is not null and cp.expires_at < now() then
      v_coupon_message := 'This coupon has expired.';
    elsif v_subtotal < cp.min_order then
      v_coupon_message := format('Add items worth ₹%s more to use %s.', cp.min_order - v_subtotal, v_code);
    else
      v_coupon_discount := case cp.type
        when 'FREESHIP' then v_shipping
        when 'PERCENT' then round(v_subtotal * cp.value / 100.0)::int
        else least(cp.value, v_subtotal) end;
      if cp.max_discount is not null and cp.type <> 'FREESHIP' then
        v_coupon_discount := least(v_coupon_discount, cp.max_discount);
      end if;
      v_coupon_code := cp.code;
      v_coupon_message := case
        when cp.type <> 'FREESHIP' then format('%s applied: you save ₹%s.', cp.code, v_coupon_discount)
        when v_coupon_discount > 0 then format('%s applied: FREE delivery (you save ₹%s).', cp.code, v_coupon_discount)
        else format('%s applied: delivery is already free on this order.', cp.code) end;
    end if;
  end if;

  -- Automatic "extra off above ₹X" rule
  if s.auto_offer_percent > 0 and v_subtotal >= s.auto_offer_threshold then
    v_auto := round(v_subtotal * s.auto_offer_percent / 100.0)::int;
  end if;

  if p_payment_method = 'COD' and v_subtotal > 0 then
    v_cod := s.cod_fee;
  end if;

  if v_referral then
    v_waiver := v_shipping + v_cod;
    v_shipping := 0;
    v_cod := 0;
  end if;

  return jsonb_build_object(
    'lines', v_lines,
    'errors', to_jsonb(v_errors),
    'subtotal', v_subtotal,
    'mrp_total', v_mrp_total,
    'coupon_code', v_coupon_code,
    'coupon_discount', v_coupon_discount,
    'coupon_message', v_coupon_message,
    'auto_discount', v_auto,
    'shipping_fee', v_shipping,
    'cod_fee', v_cod,
    'total', greatest(0, v_subtotal - v_coupon_discount - v_auto + v_shipping + v_cod),
    'savings', v_mrp_total - v_subtotal + v_coupon_discount + v_auto + v_waiver,
    'referral', v_referral,
    'referral_waiver', v_waiver,
    'meets_minimum', v_subtotal >= s.min_order_value
  );
end $$;

-- ───────────────────────────── Placing orders ─────────────────────────────

create or replace function public._proof_available(p_proof text, p_order_id uuid default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from storage.objects where bucket_id = 'payment-proofs' and name = p_proof)
     and not exists (select 1 from public.orders
                     where payment_proof = p_proof and id is distinct from p_order_id);
$$;

create or replace function public.place_order(p jsonb) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  s          public.settings;
  v_name     text := btrim(coalesce(p ->> 'name', ''));
  v_phone    text := regexp_replace(coalesce(p ->> 'phone', ''), '[\s-]', '', 'g');
  v_email    text := nullif(btrim(coalesce(p ->> 'email', '')), '');
  v_address1 text := btrim(coalesce(p ->> 'address1', ''));
  v_address2 text := nullif(btrim(coalesce(p ->> 'address2', '')), '');
  v_city     text := btrim(coalesce(p ->> 'city', ''));
  v_state    text := btrim(coalesce(p ->> 'state', ''));
  v_pincode  text := btrim(coalesce(p ->> 'pincode', ''));
  v_notes    text := nullif(btrim(coalesce(p ->> 'notes', '')), '');
  v_coupon   text := nullif(btrim(coalesce(p ->> 'coupon_code', '')), '');
  v_mode     text := coalesce(p ->> 'delivery_mode', 'DELIVERY');
  v_method   text := p ->> 'payment_method';
  v_upi_ref  text := nullif(regexp_replace(coalesce(p ->> 'upi_ref', ''), '[^A-Za-z0-9]', '', 'g'), '');
  v_proof    text := nullif(p ->> 'payment_proof', '');
  v_pin_err  text;
  q          jsonb;
  v_customer uuid;
  v_order    uuid;
  v_number   text;
  v_referral boolean;
  r          record;
begin
  perform public._rate_limit('order', 10, interval '10 minutes');
  select * into s from public.settings where id = 1;

  v_phone := regexp_replace(v_phone, '^(\+91|91|0)(?=[6-9][0-9]{9}$)', '');
  if char_length(v_name) not between 2 and 80 then raise exception 'Enter your full name.'; end if;
  if v_phone !~ '^[6-9][0-9]{9}$' then raise exception 'Enter a valid 10-digit Indian mobile number.'; end if;
  if v_email is not null and (char_length(v_email) > 120 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'Enter a valid email.';
  end if;
  if char_length(v_address1) not between 5 and 160 or char_length(coalesce(v_address2, '')) > 160 then
    raise exception 'Enter your address.';
  end if;
  if char_length(v_city) not between 2 and 60 then raise exception 'Enter your city.'; end if;
  if char_length(v_state) not between 2 and 60 then raise exception 'Select your state.'; end if;
  if v_pincode !~ '^[1-9][0-9]{5}$' then raise exception 'Enter a valid 6-digit pincode.'; end if;
  if char_length(coalesce(v_notes, '')) > 500 or char_length(coalesce(v_coupon, '')) > 30
     or char_length(coalesce(v_upi_ref, '')) > 40 then
    raise exception 'Please check the highlighted fields.';
  end if;
  if v_mode not in ('DELIVERY', 'PICKUP') then raise exception 'Choose delivery or pickup.'; end if;

  if v_method = 'COD' then
    if not s.cod_enabled then raise exception 'Cash on Delivery is not available right now.'; end if;
  elsif v_method = 'UPI' then
    if not (s.upi_enabled and (s.upi_qr_image <> '' or s.upi_id <> '')) then
      raise exception 'UPI payment is not available right now.';
    end if;
    if v_proof is null then raise exception 'Please upload your UPI payment screenshot.'; end if;
    if v_proof !~ '^[0-9a-f-]{36}\.(webp|jpg)$' or not public._proof_available(v_proof) then
      raise exception 'Payment screenshot not found or already used. Please upload your own payment screenshot again.';
    end if;
  else
    raise exception 'Choose a payment method.';
  end if;

  if v_mode = 'DELIVERY' then
    v_pin_err := public._pincode_error(v_pincode, s.blocked_pincode_prefixes, s.serviceable_prefixes);
    if v_pin_err is not null then raise exception '%', v_pin_err; end if;
  end if;

  q := public.price_cart(p -> 'lines', v_coupon, v_mode, v_method);
  if jsonb_array_length(q -> 'errors') > 0 then raise exception '%', q -> 'errors' ->> 0; end if;
  if jsonb_array_length(q -> 'lines') = 0 then raise exception 'Your cart is empty.'; end if;
  if not (q ->> 'meets_minimum')::boolean then raise exception 'Minimum order value is ₹%.', s.min_order_value; end if;
  if v_coupon is not null and q ->> 'coupon_code' is null then
    raise exception '%', coalesce(q ->> 'coupon_message', 'Coupon is not valid.');
  end if;
  v_referral := (q ->> 'referral')::boolean;
  if v_referral then
    if exists (select 1 from public.referral_codes where code = q ->> 'coupon_code' and referrer_phone = v_phone) then
      raise exception 'You can''t use your own referral code. Share it with your friends instead!';
    end if;
    if exists (select 1 from public.orders where phone = v_phone and referral_code is not null and status <> 'CANCELLED') then
      raise exception 'A referral code has already been used with this mobile number. Please remove it to continue.';
    end if;
  end if;

  -- Conditional decrement guards against overselling under concurrency; any failure rolls back the whole order.
  for r in
    select pid, sum(need)::int as need from (
      select (x ->> 'id')::uuid as pid, (x ->> 'qty')::int as need
      from jsonb_array_elements(q -> 'lines') x where x ->> 'kind' = 'PRODUCT'
      union all
      select ci.product_id, ci.qty * (x ->> 'qty')::int
      from jsonb_array_elements(q -> 'lines') x
      join public.combo_items ci on ci.combo_id = (x ->> 'id')::uuid
      where x ->> 'kind' = 'COMBO'
    ) d group by pid
  loop
    update public.products set stock = stock - r.need where id = r.pid and stock >= r.need;
    if not found then raise exception 'Some items just went out of stock. Please review your cart.'; end if;
  end loop;

  insert into public.customers (phone, name, email, city)
  values (v_phone, v_name, v_email, v_city)
  on conflict (phone) do update
    set name = excluded.name, email = coalesce(excluded.email, public.customers.email), city = excluded.city
  returning id into v_customer;

  if v_referral then
    update public.referral_codes set usage_count = usage_count + 1 where code = q ->> 'coupon_code';
  elsif q ->> 'coupon_code' is not null then
    update public.coupons set usage_count = usage_count + 1 where code = q ->> 'coupon_code';
  end if;

  loop
    v_number := 'DW-' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-' || (1000 + floor(random() * 99000))::int;
    exit when not exists (select 1 from public.orders where order_number = v_number);
  end loop;

  insert into public.orders (
    order_number, customer_id, name, phone, email, address1, address2, city, state, pincode, notes, delivery_mode,
    subtotal, mrp_total, coupon_code, referral_code, coupon_discount, auto_discount, shipping_fee, cod_fee, total,
    payment_method, payment_status, upi_ref, payment_proof
  ) values (
    v_number, v_customer, v_name, v_phone, v_email, v_address1, v_address2, v_city, v_state, v_pincode, v_notes, v_mode,
    (q ->> 'subtotal')::int, (q ->> 'mrp_total')::int,
    case when v_referral then null else q ->> 'coupon_code' end, case when v_referral then q ->> 'coupon_code' end,
    (q ->> 'coupon_discount')::int,
    (q ->> 'auto_discount')::int, (q ->> 'shipping_fee')::int, (q ->> 'cod_fee')::int, (q ->> 'total')::int,
    -- UPI orders wait for the admin to check the screenshot before they are confirmed.
    v_method, case when v_method = 'UPI' then 'AWAITING_VERIFICATION' else 'PENDING' end,
    v_upi_ref, case when v_method = 'UPI' then v_proof end
  ) returning id into v_order;

  -- Cost snapshot (admin-only P&L). A combo's cost is 0 unless every component has a cost.
  insert into public.order_items (order_id, kind, ref_id, name, image, unit, unit_price, unit_mrp, unit_cost, qty, line_total)
  select v_order, x ->> 'kind', (x ->> 'id')::uuid, x ->> 'name', x ->> 'image', x ->> 'unit',
         (x ->> 'unit_price')::int, (x ->> 'unit_mrp')::int,
         case when x ->> 'kind' = 'PRODUCT' then
           coalesce((select pc.cost_price from public.product_costs pc where pc.product_id = (x ->> 'id')::uuid), 0)
         else
           (select case when bool_and(coalesce(pc.cost_price, 0) > 0) then sum(pc.cost_price * ci.qty)::int else 0 end
            from public.combo_items ci left join public.product_costs pc on pc.product_id = ci.product_id
            where ci.combo_id = (x ->> 'id')::uuid)
         end,
         (x ->> 'qty')::int, (x ->> 'line_total')::int
  from jsonb_array_elements(q -> 'lines') x;

  return jsonb_build_object('id', v_order, 'order_number', v_number);
end $$;

-- Public order page. Anyone with the (unguessable) order id can view it; internal fields are left out.
create or replace function public.get_order(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select (to_jsonb(o) - 'admin_note' - 'customer_id' - 'payment_proof'
          - 'referrer_cashback' - 'referrer_cashback_paid') || jsonb_build_object(
    'has_payment_proof', o.payment_proof is not null,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'kind', i.kind, 'name', i.name, 'image', i.image, 'unit', i.unit,
        'unit_price', i.unit_price, 'qty', i.qty, 'line_total', i.line_total))
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)
  )
  from public.orders o
  where o.id = p_id;
$$;

-- Track Order page: finds an order only when both the order number and the checkout phone number match,
-- so a phone number alone can't be used to look up someone's orders. Returns the order id (or null).
create or replace function public.find_order(p_order_number text, p_phone text) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_phone text := regexp_replace(
    regexp_replace(coalesce(p_phone, ''), '[\s-]', '', 'g'), '^(\+91|91|0)(?=[6-9][0-9]{9}$)', '');
  v_id    uuid;
begin
  perform public._rate_limit('track', 20, interval '10 minutes');
  select id into v_id from public.orders
   where order_number = upper(btrim(coalesce(p_order_number, ''))) and phone = v_phone;
  return v_id;
end $$;

-- Customer attaches (or replaces) the UPI payment screenshot for an order; the admin then verifies it.
create or replace function public.attach_payment_proof(p_order_id uuid, p_proof text, p_upi_ref text default null)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  o     public.orders;
  v_ref text := nullif(btrim(coalesce(p_upi_ref, '')), '');
begin
  perform public._rate_limit('upi', 10, interval '10 minutes');
  if p_proof is null or p_proof !~ '^[0-9a-f-]{36}\.(webp|jpg)$' then raise exception 'Please upload your payment screenshot.'; end if;
  if v_ref is not null and v_ref !~ '^[A-Za-z0-9]{6,30}$' then raise exception 'Enter a valid UPI transaction / UTR number.'; end if;
  select * into o from public.orders where id = p_order_id;
  if not found or o.payment_method <> 'UPI' then raise exception 'Order not found.'; end if;
  if o.payment_status = 'PAID' or o.status = 'CANCELLED' then raise exception 'This order can no longer be updated.'; end if;
  if not public._proof_available(p_proof, o.id) then
    raise exception 'Screenshot not found or already used. Please upload it again.';
  end if;
  update public.orders
     set payment_proof = p_proof, upi_ref = coalesce(v_ref, upi_ref), payment_status = 'AWAITING_VERIFICATION'
   where id = o.id;
end $$;

-- ───────────────────────────── Order lifecycle triggers ─────────────────────────────

create or replace function public._orders_before_update() returns trigger
language plpgsql as $$
begin
  if old.status = 'CANCELLED' then
    new.status := 'CANCELLED'; -- cancelled orders are locked (their stock was already returned)
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists orders_before_update on public.orders;
create trigger orders_before_update before update on public.orders for each row execute function public._orders_before_update();

-- Put an order's items back into stock (including combo components).
create or replace function public._restock_order(p_order_id uuid) returns void
language sql security definer set search_path = '' as $$
  update public.products p
     set stock = p.stock + d.qty
    from (
      select pid, sum(qty)::int as qty from (
        select i.ref_id as pid, i.qty from public.order_items i where i.order_id = p_order_id and i.kind = 'PRODUCT'
        union all
        select ci.product_id, ci.qty * i.qty
        from public.order_items i join public.combo_items ci on ci.combo_id = i.ref_id
        where i.order_id = p_order_id and i.kind = 'COMBO'
      ) x group by pid
    ) d
   where p.id = d.pid;
$$;

-- Cancelling an order returns its stock.
create or replace function public._orders_restock() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public._restock_order(new.id);
  return null;
end $$;
drop trigger if exists orders_restock on public.orders;
create trigger orders_restock after update of status on public.orders
  for each row when (new.status = 'CANCELLED' and old.status <> 'CANCELLED')
  execute function public._orders_restock();

-- Deleting an order that wasn't cancelled also returns its stock (runs before its items are removed).
create or replace function public._orders_before_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.status <> 'CANCELLED' then
    perform public._restock_order(old.id);
  end if;
  return old;
end $$;
drop trigger if exists orders_before_delete on public.orders;
create trigger orders_before_delete before delete on public.orders for each row execute function public._orders_before_delete();

-- Customers exist only through their orders: remove one once their last order is deleted.
create or replace function public._orders_after_delete() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.customer_id is not null then
    delete from public.customers c
     where c.id = old.customer_id
       and not exists (select 1 from public.orders o where o.customer_id = c.id);
  end if;
  return null;
end $$;
drop trigger if exists orders_after_delete on public.orders;
create trigger orders_after_delete after delete on public.orders for each row execute function public._orders_after_delete();

-- One-time cleanup for customers whose orders were deleted before this trigger existed.
delete from public.customers c where not exists (select 1 from public.orders o where o.customer_id = c.id);

-- ───────────────────────────── Row Level Security ─────────────────────────────

alter table public.admins        enable row level security;
alter table public.products      enable row level security;
alter table public.product_costs enable row level security;
alter table public.combos        enable row level security;
alter table public.combo_items   enable row level security;
alter table public.coupons       enable row level security;
alter table public.referral_codes enable row level security;
alter table public.customers     enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.quotes        enable row level security;
alter table public.settings      enable row level security;
alter table public.request_log   enable row level security; -- no policies: only reachable via functions

drop policy if exists "admins read own row" on public.admins;
create policy "admins read own row" on public.admins for select to authenticated using (user_id = auth.uid());

drop policy if exists "public reads visible products" on public.products;
create policy "public reads visible products" on public.products for select using (is_visible or public.is_admin());
drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage product costs" on public.product_costs;
create policy "admins manage product costs" on public.product_costs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public reads visible combos" on public.combos;
create policy "public reads visible combos" on public.combos for select using (is_visible or public.is_admin());
drop policy if exists "admins manage combos" on public.combos;
create policy "admins manage combos" on public.combos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public reads combo items" on public.combo_items;
create policy "public reads combo items" on public.combo_items for select using (true);
drop policy if exists "admins manage combo items" on public.combo_items;
create policy "admins manage combo items" on public.combo_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public reads settings" on public.settings;
create policy "public reads settings" on public.settings for select using (true);
drop policy if exists "admins update settings" on public.settings;
create policy "admins update settings" on public.settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "anyone submits a quote" on public.quotes;
create policy "anyone submits a quote" on public.quotes for insert to anon, authenticated with check (status = 'NEW');

do $$
declare t text;
begin
  foreach t in array array['coupons', 'referral_codes', 'customers', 'orders', 'order_items', 'quotes'] loop
    execute format('drop policy if exists "admins manage %1$s" on public.%1$I', t);
    execute format('create policy "admins manage %1$s" on public.%1$I for all to authenticated
                    using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ───────────────────────────── Function permissions ─────────────────────────────

revoke all on function public._touch_updated_at() from public, anon, authenticated;
revoke all on function public._rate_limit(text, int, interval) from public, anon, authenticated;
revoke all on function public._quotes_rate_limit() from public, anon, authenticated;
revoke all on function public._code_not_taken() from public, anon, authenticated;
revoke all on function public._pincode_error(text, text, text) from public, anon, authenticated;
revoke all on function public._proof_available(text, uuid) from public, anon, authenticated;
revoke all on function public._orders_before_update() from public, anon, authenticated;
revoke all on function public._orders_restock() from public, anon, authenticated;
revoke all on function public._restock_order(uuid) from public, anon, authenticated;
revoke all on function public._orders_before_delete() from public, anon, authenticated;
revoke all on function public._orders_after_delete() from public, anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.site_settings() to anon, authenticated;
grant execute on function public.price_cart(jsonb, text, text, text) to anon, authenticated;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.get_order(uuid) to anon, authenticated;
grant execute on function public.find_order(text, text) to anon, authenticated;
grant execute on function public.attach_payment_proof(uuid, text, text) to anon, authenticated;

-- ───────────────────────────── Storage ─────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-images', 'product-images', true, 8388608, array['image/webp', 'image/png', 'image/jpeg']),
  ('payment-proofs', 'payment-proofs', false, 8388608, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

-- Customers can only add new screenshots (random names, no overwrite, no listing or reading).
drop policy if exists "anyone uploads a payment proof" on storage.objects;
create policy "anyone uploads a payment proof" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'payment-proofs' and name ~ '^[0-9a-f-]{36}\.(webp|jpg)$');
drop policy if exists "admins read payment proofs" on storage.objects;
create policy "admins read payment proofs" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());
drop policy if exists "admins delete payment proofs" on storage.objects;
create policy "admins delete payment proofs" on storage.objects for delete to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

-- Product photos and the UPI QR live in the public product-images bucket; only admins can change them.
drop policy if exists "admins manage product images" on storage.objects;
create policy "admins manage product images" on storage.objects for all to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
