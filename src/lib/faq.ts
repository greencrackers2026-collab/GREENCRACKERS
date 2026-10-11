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
      a: `All listed prices are already discounted (MRP shown struck through). On top of that you can apply coupon codes${
        s.highlightCoupon ? ` like ${s.highlightCoupon}` : ""
      }, and orders above ${formatINR(s.autoOfferThreshold)} get an automatic extra ${s.autoOfferPercent}% off.`,
    },
    {
      q: "Do you deliver to my city?",
      a: "We deliver to most pincodes in India where the sale of crackers is permitted. Enter your pincode on any product page or at checkout to check. We do not deliver to areas with a ban (for example Delhi-NCR). You can still order on WhatsApp for pickup from our licensed shop.",
    },
    {
      q: "What payment options are available?",
      a: "You can pay online with Razorpay (UPI, cards, netbanking, wallets), pay directly by UPI (scan QR or use our UPI ID), or choose Cash on Delivery where available.",
    },
    {
      q: "Do you sell green crackers?",
      a: "Yes. Products marked with the 🌿 Green badge carry the green fireworks marking on the pack. They produce lower emissions. Check the product page for details.",
    },
    {
      q: "Can I get a wholesale or bulk price?",
      a: "Absolutely. Use our Get a Quote form with the products and quantities you need, and we will reply on WhatsApp or by phone with the best bulk price.",
    },
    {
      q: `Is there a delivery charge?`,
      a: `Delivery is FREE on orders above ${formatINR(s.freeShippingAbove)}. Below that a flat ${formatINR(
        s.shippingFee,
      )} delivery charge applies. Minimum order value is ${formatINR(s.minOrderValue)}.`,
    },
  ];
}
