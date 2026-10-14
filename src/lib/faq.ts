import type { SiteSettings } from "./settings";
import { formatINR } from "./format";

export function getFaqs(s: SiteSettings) {
  return [
    {
      q: "Are your crackers genuine Sivakasi crackers?",
      a: "Yes. We source directly from licensed manufacturers in Sivakasi, Tamil Nadu, including Cornation, Balaji's, Sarvam, Blue Stars and Rathnaa's. That is how we can offer 50% to 70% off MRP.",
    },
    {
      q: `How does the ${s.maxDiscountPercent}% OFF pre-Diwali offer work?`,
      a: `All listed prices are already discounted (MRP shown struck through).${
        s.autoCoupon?.type === "FREESHIP" ? ` Code ${s.autoCoupon.code} is applied automatically at checkout for FREE delivery.` : ""
      } Orders above ${formatINR(s.autoOfferThreshold)} also get an automatic extra ${s.autoOfferPercent}% off.`,
    },
    {
      q: "Do you deliver to my city?",
      a: "Yes, we take orders from all over India. After you order, we will call you to confirm delivery details for your area. Pickup from our shop is also available.",
    },
    {
      q: "What payment options are available?",
      a: `Pay by UPI: scan our QR at checkout, pay, and upload the payment screenshot. We confirm your order after verifying it. Or choose Cash on Delivery (₹${s.codFee} extra COD charges).`,
    },
    {
      q: "Do you sell green crackers?",
      a: "Yes. Products marked with the 🌿 Green badge carry the green fireworks marking on the pack. They produce lower emissions. Check the product page for details.",
    },
    {
      q: "Can I get a wholesale or bulk price?",
      a: "Absolutely. Use our Get a Quote form with the products and quantities you need, and we will reply by phone with the best bulk price.",
    },
    {
      q: `Is there a delivery charge?`,
      a: `Delivery charge is ${formatINR(s.shippingFee)}${
        s.autoCoupon?.type === "FREESHIP" ? `, waived with code ${s.autoCoupon.code} (applied automatically)` : ""
      }. Delivery is also free on orders above ${formatINR(s.freeShippingAbove)}. Cash on Delivery orders have ${formatINR(
        s.codFee,
      )} extra COD charges. Minimum order value is ${formatINR(s.minOrderValue)}.`,
    },
  ];
}
