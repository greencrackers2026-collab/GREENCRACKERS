/**
 * Seed script: `npm run seed`
 * Loads products, combo packs, coupons, offer settings and some demo orders/quotes.
 * Product names, brands and prices live here (and are editable later in Admin → Products),
 * so nothing is hard-coded in the UI.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SAFETY_COMMON =
  "Light at arm's length using an incense stick (agarbatti). Keep a bucket of water or sand nearby. Never relight a dud; wait 15 minutes and soak it in water. Adult supervision required for children. Use only in permitted areas and during time slots allowed by local authorities.";

type SeedProduct = {
  slug: string;
  name: string;
  brand: string;
  category: "SOUND" | "GROUND" | "SKY_SHOTS" | "SPARKLERS" | "FOUNTAINS";
  unit: string;
  price: number;
  mrp: number;
  priceNote?: string;
  images: string[];
  shortDesc: string;
  description: string;
  contents?: string;
  safetyInfo?: string;
  isGreen?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  minQty?: number;
  qtyStep?: number;
  stock?: number;
};

export const PRODUCTS: SeedProduct[] = [
  {
    slug: "cornation-nazi-green",
    name: "Nazi Green",
    brand: "Cornation",
    category: "SOUND",
    unit: "box",
    price: 250,
    mrp: 750,
    images: ["/products/nazi-green-1.webp", "/products/nazi-green-2.webp"],
    shortDesc: "Classic green-thread sound bombs with a loud, sharp report.",
    description:
      "Cornation Nazi Green is a much-loved sound cracker from Sivakasi. Each bomb is tightly wound in green thread for a loud, satisfying boom. A Diwali night essential for sound lovers.",
    contents: "10 bombs per box",
    safetyInfo:
      "Place on flat open ground, light the fuse and move away at least 5 metres immediately. " + SAFETY_COMMON,
    isGreen: true,
    isBestSeller: true,
    isFeatured: true,
    stock: 200,
  },
  {
    slug: "balaji-mega-crackling-coconut",
    name: "Mega Crackling Coconut",
    brand: "Balaji's",
    category: "FOUNTAINS",
    unit: "box",
    price: 450,
    mrp: 1200,
    priceNote: "Owner's listed range ₹450–500; using ₹450. Update in Admin → Products if needed.",
    images: ["/products/mega-crackling-coconut-1.webp", "/products/mega-crackling-coconut-2.webp"],
    shortDesc: "Tall golden coconut-tree fountain that ends in a shower of crackles.",
    description:
      "Balaji's Mega Crackling Coconut throws up a tall golden coconut-tree shaped fountain with loud crackling stars. A Best Seller from Sree Balaji Pyrotechnics, Sivakasi, and a showstopper for family celebrations.",
    safetyInfo: "Place upright on hard, level ground. Light the tip and step back 5 metres. " + SAFETY_COMMON,
    isBestSeller: true,
    isFeatured: true,
    stock: 120,
  },
  {
    slug: "cornation-paanch-awathar",
    name: "Paanch Awathar",
    brand: "Cornation",
    category: "SKY_SHOTS",
    unit: "box",
    price: 350,
    mrp: 1000,
    images: ["/products/paanch-awathar-1.webp"],
    shortDesc: "Five colourful aerial shells in one box: five different sky effects.",
    description:
      "Cornation Paanch Awathar brings five aerial shells, each bursting into a different colourful pattern in the night sky. Green fireworks marked pack from Bee Cee Fireworks Industries, Sivakasi.",
    contents: "5 shells per box",
    safetyInfo:
      "Fire only in an open area away from buildings, trees and overhead wires. Place the shell upright, never lean over it. " +
      SAFETY_COMMON,
    isGreen: true,
    isFeatured: true,
    stock: 150,
  },
  {
    slug: "cornation-flowerpots-special-anar",
    name: "Flowerpots Special (Anar)",
    brand: "Cornation",
    category: "FOUNTAINS",
    unit: "box",
    price: 260,
    mrp: 700,
    images: ["/products/flowerpots-special-anar-1.webp"],
    shortDesc: "Bright golden flowerpot fountains, the safest crowd favourite.",
    description:
      "Cornation Flowerpots Special (Anar) produce a tall, steady fountain of golden sparks. Perfect for kids and family under supervision, and great for lining your entrance on Diwali night.",
    safetyInfo: "Place on hard, level ground. Light the top and step back. Never hold an anar in the hand. " + SAFETY_COMMON,
    isGreen: true,
    isBestSeller: true,
    isFeatured: true,
    stock: 250,
  },
  {
    slug: "blue-stars-ground-chakkar",
    name: "Ground Chakkar Special",
    brand: "Blue Stars",
    category: "GROUND",
    unit: "box",
    price: 230,
    mrp: 600,
    images: ["/products/ground-chakkar-1.webp"],
    shortDesc: "Spinning ground wheels with colourful sparks.",
    description:
      "Blue Stars Ground Chakkar Special spins rapidly on the ground throwing a colourful circle of sparks. A must-have for kids and family celebrations.",
    contents: "10 chakkars per box",
    safetyInfo: "Use on smooth, hard ground away from dry leaves. Light the fuse and step away. " + SAFETY_COMMON,
    isFeatured: true,
    stock: 250,
  },
  {
    slug: "colour-sparklers-fuljhadi-big",
    name: "Fuljhadi Sparklers (Big)",
    brand: "Colour Sparklers",
    category: "SPARKLERS",
    unit: "pack",
    price: 80,
    mrp: 200,
    images: ["/products/colour-sparklers-big-1.webp"],
    shortDesc: "Long colour sparklers that burn bright and long.",
    description:
      "Big Colour Sparklers (Fuljhadi) burn with bright, colourful sparks. Long sticks keep little hands at a safe distance. A Diwali classic for all ages.",
    safetyInfo:
      "Hold at arm's length, pointing away from the body and face. Drop used sticks into a bucket of water (they stay hot). " +
      SAFETY_COMMON,
    isGreen: true,
    isBestSeller: true,
    stock: 400,
  },
  {
    slug: "fuljhadi-sparklers-small",
    name: "Fuljhadi Sparklers (Small)",
    brand: "Colour Sparklers",
    category: "SPARKLERS",
    unit: "pack",
    price: 60,
    mrp: 150,
    images: ["/products/fuljhadi-small-placeholder.webp"],
    shortDesc: "Short sparklers, great for kids and quick fun.",
    description:
      "Small Fuljhadi sparklers with bright sparks, ideal for kids under adult supervision. (Photo coming soon; the owner can upload one from the admin panel.)",
    safetyInfo:
      "Hold at arm's length, pointing away from the body and face. Drop used sticks into a bucket of water. " + SAFETY_COMMON,
    stock: 400,
  },
  {
    slug: "sarvam-sky-shot-30-shots",
    name: "Sky Shot Peti, 30 Shots (Block Buster / Twilight)",
    brand: "Sarvam",
    category: "SKY_SHOTS",
    unit: "box",
    price: 650,
    mrp: 2000,
    priceNote: "Owner's listed range ₹650–700; using ₹650. Update in Admin → Products if needed.",
    images: ["/products/sky-shot-30-shots-1.webp"],
    shortDesc: "30 back-to-back repeated sky shots. Pure celebration.",
    description:
      "Sarvam repeated sky shot peti fires 30 colourful shots one after another. Available in Block Buster or Twilight (subject to stock). The perfect finale for your Diwali night.",
    contents: "30 shots per box",
    safetyInfo:
      "Place on flat, open ground away from buildings and wires. Light the fuse and move at least 10 metres away. Never stand over the box. " +
      SAFETY_COMMON,
    isBestSeller: true,
    isFeatured: true,
    stock: 80,
  },
  {
    slug: "rathnaas-turkey-murgachap",
    name: "Turkey Red Crackers (Murgachap)",
    brand: "Rathnaa's",
    category: "SOUND",
    unit: "piece",
    price: 35,
    mrp: 100,
    priceNote: "Owner's listed range ₹35–40; using ₹35. Update in Admin → Products if needed.",
    images: [
      "/products/murgachap-turkey-1.webp",
      "/products/murgachap-turkey-2.webp",
      "/products/murgachap-turkey-3.webp",
    ],
    shortDesc: "The iconic red string crackers. Order by the piece or in bulk.",
    description:
      "Rathnaa's Turkey (Murgachap) red crackers are the iconic Diwali string crackers from The Rathnaa Fireworks Industries, Sivakasi. Buy single pieces or in bulk bundles for the whole street.",
    safetyInfo: "Lay flat on open ground, light one end and move away. " + SAFETY_COMMON,
    isBestSeller: true,
    stock: 2000,
  },
];

const COMBOS = [
  {
    slug: "family-pack",
    name: "Family Pack",
    tagline: "Something for everyone at home",
    description: "A balanced mix of sound, ground, fountain and sparklers for a complete family Diwali.",
    image: "/products/combo-family-pack.webp",
    extraDiscount: 10,
    items: [
      ["cornation-nazi-green", 1],
      ["cornation-flowerpots-special-anar", 2],
      ["blue-stars-ground-chakkar", 1],
      ["colour-sparklers-fuljhadi-big", 3],
      ["balaji-mega-crackling-coconut", 1],
    ] as [string, number][],
  },
  {
    slug: "party-pack",
    name: "Party Pack",
    tagline: "Light up the whole street",
    description: "Sky shots, shells, a Murgachap bundle and more for the biggest celebration on the block.",
    image: "/products/combo-party-pack.webp",
    extraDiscount: 12,
    items: [
      ["sarvam-sky-shot-30-shots", 1],
      ["cornation-paanch-awathar", 1],
      ["rathnaas-turkey-murgachap", 20],
      ["cornation-nazi-green", 1],
      ["balaji-mega-crackling-coconut", 1],
    ] as [string, number][],
  },
  {
    slug: "kids-pack",
    name: "Kids Delight Pack",
    tagline: "Safe, sparkly fun for little ones",
    description: "Sparklers, chakkars and flowerpots: low-noise fun for kids (with adult supervision).",
    image: "/products/combo-kids-pack.webp",
    extraDiscount: 8,
    items: [
      ["fuljhadi-sparklers-small", 3],
      ["colour-sparklers-fuljhadi-big", 2],
      ["blue-stars-ground-chakkar", 1],
      ["cornation-flowerpots-special-anar", 1],
    ] as [string, number][],
  },
];

async function main() {
  const diwali = new Date(process.env.DIWALI_DATE || "2026-11-08T18:00:00+05:30");

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      storeName: "Green Crackers Limited",
      announcement: "Mega Pre-Diwali Sale is LIVE: up to 70% OFF + FREE delivery with DIWALI10 (auto-applied)",
      highlightCoupon: "DIWALI10",
      heroTitle: "MEGA PRE-DIWALI SALE: UP TO 70% OFF",
      heroSubtitle: "Genuine Sivakasi crackers, combo packs and green crackers delivered to your doorstep.",
      maxDiscountPercent: 70,
      taglines: JSON.stringify([
        "Light Up Your Diwali, Pay Less!",
        "50% to 70% OFF: Pre-Diwali Mega Sale",
        "Direct from Sivakasi, Best Price Guaranteed",
        "Sparkle More, Spend Less",
      ]),
      diwaliDate: diwali,
      autoOfferThreshold: 3000,
      autoOfferPercent: 5,
      shippingFee: 65,
      codFee: 50,
      freeShippingAbove: 2000,
      minOrderValue: 500,
      codEnabled: true,
      upiEnabled: true,
      upiId: process.env.UPI_ID || "",
      upiPayeeName: "Green Crackers Limited",
      whatsappNumber: process.env.WHATSAPP_NUMBER || "918920345119",
      phone: "+91 89203 45119",
      email: "",
      address: "",
      licenceNumber: "",
      restrictionEnabled: false,
      restrictionNotice:
        "Sale and delivery of firecrackers is banned or restricted in some states/cities (for example Delhi-NCR). We do not deliver to restricted areas. Please check your pincode before ordering, and burst crackers only in permitted areas and time slots.",
      blockedPincodePrefixes: "",
      serviceablePrefixes: "",
      seoCities: "Chennai, Bengaluru, Hyderabad, Coimbatore, Madurai, Sivakasi",
    },
  });

  const productIds: Record<string, string> = {};
  for (const [i, p] of PRODUCTS.entries()) {
    const data = {
      name: p.name,
      brand: p.brand,
      category: p.category,
      unit: p.unit,
      price: p.price,
      mrp: p.mrp,
      priceNote: p.priceNote ?? null,
      images: JSON.stringify(p.images),
      shortDesc: p.shortDesc,
      description: p.description,
      contents: p.contents ?? null,
      safetyInfo: p.safetyInfo ?? SAFETY_COMMON,
      isGreen: p.isGreen ?? false,
      isBestSeller: p.isBestSeller ?? false,
      isFeatured: p.isFeatured ?? false,
      minQty: p.minQty ?? 1,
      qtyStep: p.qtyStep ?? 1,
      stock: p.stock ?? 100,
      sortOrder: i,
    };
    const row = await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: { slug: p.slug, ...data } });
    productIds[p.slug] = row.id;
  }

  for (const [i, c] of COMBOS.entries()) {
    const existing = await prisma.combo.findUnique({ where: { slug: c.slug } });
    if (existing) continue;
    await prisma.combo.create({
      data: {
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        image: c.image,
        extraDiscount: c.extraDiscount,
        sortOrder: i,
        items: { create: c.items.map(([slug, qty]) => ({ productId: productIds[slug], qty })) },
      },
    });
  }

  const coupons = [
    { code: "DIWALI10", type: "FREESHIP", value: 0, minOrder: 0, maxDiscount: null },
    { code: "SPARKLE200", type: "FLAT", value: 200, minOrder: 2500, maxDiscount: null },
    { code: "FIRST5", type: "PERCENT", value: 5, minOrder: 500, maxDiscount: 250 },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: { ...c, expiresAt: new Date(diwali.getTime() + 3 * 86400000) },
    });
  }

  // ---- Demo data (only if there are no orders yet) ----
  if ((await prisma.order.count()) === 0) {
    const all = await prisma.product.findMany();
    const bySlug = Object.fromEntries(all.map((p) => [p.slug, p]));
    const demoCustomers = [
      { name: "Priya Raman", phone: "9840012345", email: "priya.r@example.com", address1: "12, 3rd Cross Street", address2: "Anna Nagar", city: "Chennai", state: "Tamil Nadu", pincode: "600040" },
      { name: "Arjun Mehta", phone: "9886023456", email: "arjun.m@example.com", address1: "45, 6th Main", address2: "Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038" },
      { name: "Lakshmi Narayanan", phone: "9443034567", email: null, address1: "8, Gandhi Road", address2: null, city: "Madurai", state: "Tamil Nadu", pincode: "625001" },
      { name: "Rahul Verma", phone: "9908045678", email: "rahul.v@example.com", address1: "Plot 22, Jubilee Hills", address2: "Road No. 10", city: "Hyderabad", state: "Telangana", pincode: "500033" },
      { name: "Meena Krishnan", phone: "9790056789", email: "meena.k@example.com", address1: "3/14, RS Puram", address2: null, city: "Coimbatore", state: "Tamil Nadu", pincode: "641002" },
      { name: "Suresh Babu", phone: "9677067890", email: null, address1: "21, Car Street", address2: null, city: "Tiruchirappalli", state: "Tamil Nadu", pincode: "620002" },
    ];
    const baskets: [string, number][][] = [
      [["cornation-nazi-green", 2], ["colour-sparklers-fuljhadi-big", 4], ["cornation-flowerpots-special-anar", 2]],
      [["sarvam-sky-shot-30-shots", 2], ["cornation-paanch-awathar", 1], ["rathnaas-turkey-murgachap", 30]],
      [["blue-stars-ground-chakkar", 2], ["fuljhadi-sparklers-small", 5]],
      [["balaji-mega-crackling-coconut", 2], ["sarvam-sky-shot-30-shots", 1], ["cornation-nazi-green", 3]],
      [["colour-sparklers-fuljhadi-big", 6], ["cornation-flowerpots-special-anar", 3], ["blue-stars-ground-chakkar", 2]],
      [["rathnaas-turkey-murgachap", 50], ["cornation-nazi-green", 2]],
      [["cornation-paanch-awathar", 2], ["balaji-mega-crackling-coconut", 1]],
      [["sarvam-sky-shot-30-shots", 3], ["cornation-flowerpots-special-anar", 4], ["colour-sparklers-fuljhadi-big", 5]],
      [["fuljhadi-sparklers-small", 4], ["blue-stars-ground-chakkar", 1]],
      [["cornation-nazi-green", 1], ["rathnaas-turkey-murgachap", 10], ["cornation-flowerpots-special-anar", 2]],
    ];
    const statuses = ["NEW", "NEW", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "NEW", "CONFIRMED", "CANCELLED", "NEW"];
    const methods = ["COD", "RAZORPAY", "UPI", "COD", "RAZORPAY", "UPI", "COD", "RAZORPAY", "COD", "UPI"];
    const s = await prisma.settings.findUniqueOrThrow({ where: { id: 1 } });

    for (let i = 0; i < baskets.length; i++) {
      const c = demoCustomers[i % demoCustomers.length];
      const customer = await prisma.customer.upsert({
        where: { phone: c.phone },
        update: {},
        create: { phone: c.phone, name: c.name, email: c.email, city: c.city },
      });
      const items = baskets[i].map(([slug, qty]) => {
        const p = bySlug[slug];
        return {
          kind: "PRODUCT",
          refId: p.id,
          name: `${p.brand} ${p.name}`,
          image: JSON.parse(p.images)[0] ?? null,
          unit: p.unit,
          unitPrice: p.price,
          unitMrp: p.mrp,
          qty,
          lineTotal: p.price * qty,
        };
      });
      const subtotal = items.reduce((a, b) => a + b.lineTotal, 0);
      const mrpTotal = items.reduce((a, b) => a + b.unitMrp * b.qty, 0);
      // Demo: DIWALI10 (free delivery) on most orders; COD orders pay the COD fee.
      const autoDiscount = subtotal >= s.autoOfferThreshold ? Math.round((subtotal * s.autoOfferPercent) / 100) : 0;
      const shippingFee = subtotal >= s.freeShippingAbove ? 0 : s.shippingFee;
      const useCoupon = i % 4 !== 3;
      const couponDiscount = useCoupon ? shippingFee : 0;
      const codFee = methods[i] === "COD" ? s.codFee : 0;
      const total = subtotal - couponDiscount - autoDiscount + shippingFee + codFee;
      const method = methods[i];
      const status = statuses[i];
      const paid = method === "RAZORPAY" || (status === "DELIVERED");
      const created = new Date(Date.now() - (i < 3 ? i * 3600_000 : i * 0.7 * 86400_000));
      const ymd = created.toISOString().slice(2, 10).replace(/-/g, "");
      await prisma.order.create({
        data: {
          orderNumber: `DW-${ymd}-${String(1001 + i)}`,
          customerId: customer.id,
          ...c,
          deliveryMode: "DELIVERY",
          subtotal,
          mrpTotal,
          couponCode: useCoupon ? "DIWALI10" : null,
          couponDiscount,
          autoDiscount,
          shippingFee,
          codFee,
          total,
          paymentMethod: method,
          paymentStatus: status === "CANCELLED" ? "FAILED" : paid ? "PAID" : method === "UPI" ? "AWAITING_VERIFICATION" : "PENDING",
          upiRef: method === "UPI" ? `4${String(10000000000 + i * 7919)}` : null,
          razorpayOrderId: method === "RAZORPAY" ? `order_demo${i}` : null,
          razorpayPaymentId: method === "RAZORPAY" ? `pay_demo${i}` : null,
          status,
          createdAt: created,
          items: { create: items },
        },
      });
    }

    const quotes = [
      { name: "Venkatesh Traders", phone: "9443098765", email: "venkat.traders@example.com", city: "Salem", items: [{ product: "Turkey Red Crackers (Murgachap)", qty: 1000 }, { product: "Nazi Green", qty: 50 }], message: "Wholesale rate needed for our shop. Delivery before 25th Oct.", status: "NEW" },
      { name: "Green Valley Apartments RWA", phone: "9845087654", email: null, city: "Bengaluru", items: [{ product: "Family Pack", qty: 40 }, { product: "Fuljhadi Sparklers (Big)", qty: 200 }], message: "Community Diwali celebration for 40 families.", status: "CONTACTED" },
      { name: "Karthik S", phone: "9952076543", email: "karthik.s@example.com", city: "Chennai", items: [{ product: "Sky Shot Peti, 30 Shots", qty: 25 }], message: "Corporate event, need invoice with GST.", status: "NEW" },
      { name: "Anitha R", phone: "9894065432", email: null, city: "Coimbatore", items: [{ product: "Kids Delight Pack", qty: 15 }], message: "", status: "CLOSED" },
    ];
    for (const [i, q] of quotes.entries()) {
      await prisma.quote.create({
        data: { ...q, items: JSON.stringify(q.items), createdAt: new Date(Date.now() - i * 1.3 * 86400_000) },
      });
    }
  }

  console.log("Seed complete ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
