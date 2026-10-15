-- Seed data exported from the original store database.
-- Safe to re-run: existing rows (matched by slug / code) are left untouched.

insert into public.products (slug, name, brand, category, unit, price, mrp, stock, images, short_desc, description, contents, safety_info, is_green, is_best_seller, is_featured, is_visible, min_qty, qty_step, sort_order) values
  ('cornation-nazi-green', 'Nazi Green', 'Cornation', 'SOUND', 'box', 250, 750, 193, array['/products/nazi-green-1.webp', '/products/nazi-green-2.webp'], 'Classic green-thread sound bombs with a loud, sharp report.', 'Cornation Nazi Green is a much-loved sound cracker from Sivakasi. Each bomb is tightly wound in green thread for a loud, satisfying boom. A Diwali night essential for sound lovers.', '10 bombs per box', 'Place on flat open ground, light the fuse and move away at least 5 metres immediately. Light at arm''s length using an incense stick (agarbatti). Keep a bucket of water or sand nearby. Never relight a dud; wait 15 minutes and soak it in water. Adult supervision required for children. Use only in permitted areas and during time slots allowed by local authorities.', true, true, true, true, 1, 1, 0),
  ('balaji-mega-crackling-coconut', 'Mega Crackling Coconut', 'Balaji''s', 'FOUNTAINS', 'box', 450, 1200, 119, array['/products/mega-crackling-coconut-1.webp', '/products/mega-crackling-coconut-2.webp'], 'Tall golden coconut-tree fountain that ends in a shower of crackles.', 'Balaji''s Mega Crackling Coconut throws up a tall golden coconut-tree shaped fountain with loud crackling stars. A Best Seller from Sree Balaji Pyrotechnics, Sivakasi, and a showstopper for family celebrations.', null, 'Place upright on hard, level ground. Light the tip and step back 5 metres. Light at arm''s length using an incense stick (agarbatti). Keep a bucket of water or sand nearby. Never relight a dud; wait 15 minutes and soak it in water. Adult supervision required for children. Use only in permitted areas and during time slots allowed by local authorities.', false, true, true, true, 1, 1, 1),
  ('cornation-paanch-awathar', 'Paanch Awathar', 'Cornation', 'SKY_SHOTS', 'box', 350, 1000, 148, array['/products/paanch-awathar-1.webp'], 'Five colourful aerial shells in one box: five different sky effects.', 'Cornation Paanch Awathar brings five aerial shells, each bursting into a different colourful pattern in the night sky. Green fireworks marked pack from Bee Cee Fireworks Industries, Sivakasi.', '5 shells per box', 'Fire only in an open area away from buildings, trees and overhead wires. Place the shell upright, never lean over it. Light at arm''s length using an incense stick (agarbatti). Keep a bucket of water or sand nearby. Never relight a dud; wait 15 minutes and soak it in water. Adult supervision required for children. Use only in permitted areas and during time slots allowed by local authorities.', true, false, true, true, 1, 1, 2),
  ('cornation-flowerpots-special-anar', 'Flowerpots Special (Anar)', 'Cornation', 'FOUNTAINS', 'box', 260, 700, 252, array['/products/flowerpots-special-anar-1.webp'], 'Bright golden flowerpot fountains, the safest crowd favourite.', 'Cornation Flowerpots Special (Anar) produce a tall, steady fountain of golden sparks. Perfect for kids and family under supervision, and great for lining your entrance on Diwali night.', null, 'Place on hard, level ground. Light the top and step back. Never hold an anar in the hand. Light at arm''s length using an incense stick (agarbatti). Keep a bucket of water or sand nearby. Never relight a dud; wait 15 minutes and soak it in water. Adult supervision required for children. Use only in permitted areas and during time slots allowed by local authorities.', true, true, true, true, 1, 1, 3),
  ('blue-stars-ground-chakkar', 'Ground Chakkar Special', 'Blue Stars', 'GROUND', 'box', 230, 600, 249, array['/products/ground-chakkar-1.webp'], 'Spinning ground wheels with colourful sparks.', 'Blue Stars Ground Chakkar Special spins rapidly on the ground throwing a colourful circle of sparks. A must-have for kids and family celebrations.', '10 chakkars per box', 'Use on smooth, hard ground away from dry leaves. Light the fuse and step away. Light at arm''s length using an incense stick (agarbatti). Keep a bucket of water or sand nearby. Never relight a dud; wait 15 minutes and soak it in water. Adult supervision required for children. Use only in permitted areas and during time slots allowed by local authorities.', false, false, true, true, 1, 1, 4),
  ('colour-sparklers-fuljhadi-big', 'Fuljhadi Sparklers (Big)', 'Colour Sparklers', 'SPARKLERS', 'pack', 80, 200, 402, array['/products/colour-sparklers-big-1.webp'], 'Long colour sparklers that burn bright and long.', 'Big Colour Sparklers (Fuljhadi) burn with bright, colourful sparks. Long sticks keep little hands at a safe distance. A Diwali classic for all ages.', null, 'Hold at arm''s length, pointing away from the body and face. Drop used sticks into a bucket of water (they stay hot). Light at arm''s length using an incense stick (agarbatti). Keep a bucket of water or sand nearby. Never relight a dud; wait 15 minutes and soak it in water. Adult supervision required for children. Use only in permitted areas and during time slots allowed by local authorities.', true, true, false, true, 1, 1, 5),
  ('fuljhadi-sparklers-small', 'Fuljhadi Sparklers (Small)', 'Colour Sparklers', 'SPARKLERS', 'pack', 60, 150, 400, array['/products/fuljhadi-small-placeholder.webp'], 'Short sparklers, great for kids and quick fun.', 'Small Fuljhadi sparklers with bright sparks, ideal for kids under adult supervision. (Photo coming soon; the owner can upload one from the admin panel.)', null, 'Hold at arm''s length, pointing away from the body and face. Drop used sticks into a bucket of water. Light at arm''s length using an incense stick (agarbatti). Keep a bucket of water or sand nearby. Never relight a dud; wait 15 minutes and soak it in water. Adult supervision required for children. Use only in permitted areas and during time slots allowed by local authorities.', false, false, false, true, 1, 1, 6),
  ('sarvam-sky-shot-30-shots', 'Sky Shot Peti, 30 Shots (Block Buster / Twilight)', 'Sarvam', 'SKY_SHOTS', 'box', 650, 2000, 80, array['/products/sky-shot-30-shots-1.webp'], '30 back-to-back repeated sky shots. Pure celebration.', 'Sarvam repeated sky shot peti fires 30 colourful shots one after another. Available in Block Buster or Twilight (subject to stock). The perfect finale for your Diwali night.', '30 shots per box', 'Place on flat, open ground away from buildings and wires. Light the fuse and move at least 10 metres away. Never stand over the box. Light at arm''s length using an incense stick (agarbatti). Keep a bucket of water or sand nearby. Never relight a dud; wait 15 minutes and soak it in water. Adult supervision required for children. Use only in permitted areas and during time slots allowed by local authorities.', false, true, true, true, 1, 1, 7),
  ('rathnaas-turkey-murgachap', 'Turkey Red Crackers (Murgachap)', 'Rathnaa''s', 'SOUND', 'piece', 35, 100, 1950, array['/products/murgachap-turkey-1.webp', '/products/murgachap-turkey-2.webp', '/products/murgachap-turkey-3.webp'], 'The iconic red string crackers. Order by the piece or in bulk.', 'Rathnaa''s Turkey (Murgachap) red crackers are the iconic Diwali string crackers from The Rathnaa Fireworks Industries, Sivakasi. Buy single pieces or in bulk bundles for the whole street.', null, 'Lay flat on open ground, light one end and move away. Light at arm''s length using an incense stick (agarbatti). Keep a bucket of water or sand nearby. Never relight a dud; wait 15 minutes and soak it in water. Adult supervision required for children. Use only in permitted areas and during time slots allowed by local authorities.', false, true, false, true, 1, 1, 8)
on conflict (slug) do nothing;

insert into public.product_costs (product_id, cost_price, price_note)
select p.id, v.cost_price, v.price_note from (values
  ('cornation-nazi-green', 150, null),
  ('balaji-mega-crackling-coconut', 350, 'Owner''s listed range ₹450–500; using ₹450. Update in Admin → Products if needed.'),
  ('cornation-paanch-awathar', 200, null),
  ('cornation-flowerpots-special-anar', 180, null),
  ('blue-stars-ground-chakkar', 150, null),
  ('colour-sparklers-fuljhadi-big', 65, null),
  ('fuljhadi-sparklers-small', 50, null),
  ('sarvam-sky-shot-30-shots', 400, 'Owner''s listed range ₹650–700; using ₹650. Update in Admin → Products if needed.'),
  ('rathnaas-turkey-murgachap', 18, 'Owner''s listed range ₹35–40; using ₹35. Update in Admin → Products if needed.')
) as v(slug, cost_price, price_note)
join public.products p on p.slug = v.slug
on conflict (product_id) do nothing;

insert into public.combos (slug, name, tagline, description, image, extra_discount, is_visible, sort_order) values
  ('family-pack', 'Family Pack', 'Something for everyone at home', 'A balanced mix of sound, ground, fountain and sparklers for a complete family Diwali.', '/products/combo-family-pack.webp', 10, true, 0),
  ('party-pack', 'Party Pack', 'Light up the whole street', 'Sky shots, shells, a Murgachap bundle and more for the biggest celebration on the block.', '/products/combo-party-pack.webp', 12, true, 1),
  ('kids-pack', 'Kids Delight Pack', 'Safe, sparkly fun for little ones', 'Sparklers, chakkars and flowerpots: low-noise fun for kids (with adult supervision).', '/products/combo-kids-pack.webp', 8, true, 2)
on conflict (slug) do nothing;

insert into public.combo_items (combo_id, product_id, qty)
select c.id, p.id, v.qty from (values
  ('family-pack', 'cornation-nazi-green', 1),
  ('family-pack', 'cornation-flowerpots-special-anar', 2),
  ('family-pack', 'blue-stars-ground-chakkar', 1),
  ('family-pack', 'colour-sparklers-fuljhadi-big', 3),
  ('family-pack', 'balaji-mega-crackling-coconut', 1),
  ('party-pack', 'sarvam-sky-shot-30-shots', 1),
  ('party-pack', 'cornation-paanch-awathar', 1),
  ('party-pack', 'rathnaas-turkey-murgachap', 20),
  ('party-pack', 'cornation-nazi-green', 1),
  ('party-pack', 'balaji-mega-crackling-coconut', 1),
  ('kids-pack', 'fuljhadi-sparklers-small', 3),
  ('kids-pack', 'colour-sparklers-fuljhadi-big', 2),
  ('kids-pack', 'blue-stars-ground-chakkar', 1),
  ('kids-pack', 'cornation-flowerpots-special-anar', 1)
) as v(combo_slug, product_slug, qty)
join public.combos c on c.slug = v.combo_slug
join public.products p on p.slug = v.product_slug
where not exists (select 1 from public.combo_items x where x.combo_id = c.id and x.product_id = p.id);

insert into public.coupons (code, type, value, min_order, max_discount, expires_at, active) values
  ('DIWALI10', 'FREESHIP', 0, 0, null, '2026-11-11T12:30:00.000Z', true),
  ('SPARKLE200', 'FLAT', 200, 2500, null, '2026-11-11T12:30:00.000Z', true),
  ('FIRST5', 'PERCENT', 5, 500, 250, '2026-11-11T12:30:00.000Z', true)
on conflict (code) do nothing;

insert into public.settings (id, store_name, announcement, highlight_coupon, hero_title, hero_subtitle, max_discount_percent, diwali_date, auto_offer_threshold, auto_offer_percent, shipping_fee, cod_fee, free_shipping_above, min_order_value, cod_enabled, upi_enabled, upi_id, upi_payee_name, upi_qr_image, whatsapp_number, phone, email, address, licence_number, restriction_enabled, restriction_notice, blocked_pincode_prefixes, serviceable_prefixes, seo_cities, taglines) values
  (1, 'Green Crackers Limited', 'Mega Pre-Diwali Sale is LIVE: up to 70% OFF + FREE delivery with DIWALI10 (auto-applied)', 'DIWALI10', 'MEGA PRE-DIWALI SALE: UP TO 70% OFF', 'Genuine Sivakasi crackers, combo packs and green crackers delivered to your doorstep.', 70, '2026-11-08T12:30:00.000Z', 3000, 5, 65, 50, 2000, 500, true, true, '8920345119@slc', 'Green Crackers Limited', '/upi-qr.webp', '918130861427', '+91 81308 61427', 'greencrackers2026@gmail.com', '', '', false, 'Sale and delivery of firecrackers is banned or restricted in some states/cities (for example Delhi-NCR). We do not deliver to restricted areas. Please check your pincode before ordering, and burst crackers only in permitted areas and time slots.', '', '', 'Chennai, Bengaluru, Hyderabad, Coimbatore, Madurai, Sivakasi', array['Light Up Your Diwali, Pay Less!', '50% to 70% OFF: Pre-Diwali Mega Sale', 'Direct from Sivakasi, Best Price Guaranteed', 'Sparkle More, Spend Less'])
on conflict (id) do nothing;
