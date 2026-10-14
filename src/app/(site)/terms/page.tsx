import { getSettings } from "@/lib/settings";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/site/InfoPage";

export const metadata = pageMeta({
  title: "Terms & Conditions",
  description: "Terms and conditions for buying crackers online.",
  path: "/terms",
});

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <InfoPage title="Terms & Conditions" path="/terms">
      <p>By placing an order with {s.storeName} you agree to the following terms.</p>
      <h2>Eligibility</h2>
      <p>You must be 18 years or older to purchase. Crackers must be used under adult supervision.</p>
      <h2>Legal compliance</h2>
      <ul>
        <li>You confirm that the sale, possession and use of crackers is permitted at your delivery location.</li>
        <li>You agree to use crackers only in permitted areas and time slots, following Supreme Court and local authority directions.</li>
        <li>If we cannot deliver to your location, we will contact you by phone to arrange pickup or refund.</li>
      </ul>
      <h2>Pricing &amp; offers</h2>
      <ul>
        <li>All prices are in INR. MRP is printed by the manufacturer; sale prices are our discounted prices.</li>
        <li>Coupons and offers are subject to availability, minimum order values and expiry dates, and cannot be combined unless stated.</li>
        <li>We reserve the right to correct pricing errors and cancel affected orders with a full refund.</li>
      </ul>
      <h2>Product images</h2>
      <p>Images are for representation. Packaging and designs may vary by batch.</p>
      <h2>Liability</h2>
      <p>We are not liable for injury or damage arising from misuse of products or failure to follow safety instructions.</p>
      {s.licenceNumber && (
        <>
          <h2>Licence</h2>
          <p>{s.licenceNumber}</p>
        </>
      )}
    </InfoPage>
  );
}
