import { Link } from "react-router";
import { useStore } from "@/lib/store";
import { formatINR } from "@/lib/format";
import { InfoPage } from "@/components/site/InfoPage";

export function AboutPage() {
  const { settings: s } = useStore();
  return (
    <InfoPage
      title="About Us"
      seoTitle="About Us: Sivakasi Crackers Online"
      description={`${s.store_name} brings genuine Sivakasi crackers to your doorstep at up to ${s.max_discount_percent}% off MRP.`}
      path="/about"
      intro="Celebrating Diwali with genuine Sivakasi crackers since day one."
    >
      <p>
        {s.store_name} is a licensed crackers seller bringing you trusted brands straight from Sivakasi, India&apos;s fireworks
        capital. By sourcing directly from manufacturers we cut out middlemen, which is why you get 50% to {s.max_discount_percent}% off MRP.
      </p>
      <h2>What we stand for</h2>
      <ul>
        <li>Genuine, branded products: Cornation, Balaji&apos;s, Sarvam, Blue Stars, Rathnaa&apos;s and more.</li>
        <li>Green crackers wherever available, clearly marked on every product.</li>
        <li>Safe, compliant selling: we don&apos;t sell or deliver where crackers are banned.</li>
        <li>Honest prices with MRP shown, and no hidden charges.</li>
      </ul>
      <h2>Licence</h2>
      <p>{s.licence_number || "Licence details available on request."}</p>
      <p>
        Have a bulk requirement? <Link to="/quote">Request a wholesale quote</Link>.
      </p>
    </InfoPage>
  );
}

export function ContactPage() {
  const { settings: s } = useStore();
  return (
    <InfoPage
      title="Contact Us"
      description={`Contact ${s.store_name} for Diwali crackers orders, bulk quotes and delivery questions. Call us.`}
      path="/contact"
      intro="We're happy to help with orders, delivery and bulk pricing."
    >
      <ul>
        {s.phone && (
          <li>
            Phone: <a href={`tel:${s.phone.replace(/\s/g, "")}`}>{s.phone}</a>
          </li>
        )}
        {s.email && (
          <li>
            Email: <a href={`mailto:${s.email}`}>{s.email}</a>
          </li>
        )}
        {s.address && <li>Shop: {s.address}</li>}
      </ul>
      <h2>Bulk orders</h2>
      <p>
        For wholesale, apartment or corporate orders, use the <Link to="/quote">Get a Quote</Link> form for the fastest response.
      </p>
      <h2>Pickup from shop</h2>
      <p>
        If delivery isn&apos;t available in your area, choose &quot;Pickup from shop&quot; at checkout or call us.
      </p>
    </InfoPage>
  );
}

export function PrivacyPage() {
  const { settings: s } = useStore();
  return (
    <InfoPage title="Privacy Policy" description="How we collect, use and protect your personal information." path="/privacy">
      <p>{s.store_name} respects your privacy. This policy explains what we collect and why.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Name, phone number, email and delivery address you enter at checkout or in the quote form.</li>
        <li>Order details, payment status and the UPI payment screenshot you upload. Only our staff can view screenshots.</li>
        <li>Your cart is saved in your own browser (local storage) so it isn&apos;t lost on refresh.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To process, deliver and support your orders, including calling you about your order.</li>
        <li>To respond to quote requests.</li>
        <li>We do not sell your data. We share it only with delivery partners as needed to fulfil your order.</li>
      </ul>
      <h2>Your choices</h2>
      <p>
        To access, correct or delete your data, contact us{s.email ? ` at ${s.email}` : ""}. We keep order records as required by
        tax law.
      </p>
    </InfoPage>
  );
}

export function SafetyPage() {
  return (
    <InfoPage
      title="Safety Tips"
      seoTitle="Diwali Crackers Safety Tips"
      description="Essential firecracker safety tips for a happy Diwali: how to burst crackers safely, what to keep ready, first aid, and using crackers only in permitted areas and time slots."
      path="/safety-tips"
      keywords={["crackers safety tips", "Diwali safety", "green crackers"]}
      intro="A safe Diwali is a happy Diwali. Please read before you celebrate."
    >
      <h2>Before you start</h2>
      <ul>
        <li>Burst crackers only in open spaces, away from buildings, vehicles, dry grass and overhead wires.</li>
        <li>Keep two buckets ready: one of water and one of sand.</li>
        <li>Wear cotton clothes. Avoid loose, synthetic or flowing garments.</li>
        <li>Read the instructions printed on every box.</li>
      </ul>
      <h2>While bursting</h2>
      <ul>
        <li>Light with a long incense stick (agarbatti) at arm&apos;s length. Never use a matchstick or lighter directly.</li>
        <li>Light one cracker at a time and move away immediately.</li>
        <li>Never hold anar, bombs or sky shots in your hand, and never lean over them.</li>
        <li>Never relight a dud. Wait 15 minutes and soak it in water.</li>
        <li>Children must always be supervised by an adult. Sparklers: hold at arm&apos;s length, drop used sticks into water.</li>
        <li>Keep pets indoors in a quiet room.</li>
      </ul>
      <h2>Rules &amp; environment</h2>
      <ul>
        <li>Use crackers only in permitted areas and during time slots allowed by the Supreme Court and your local authorities.</li>
        <li>Prefer green crackers (CSIR-NEERI marked). They have lower emissions. Look for the 🌿 Green badge on our products.</li>
        <li>Avoid bursting near hospitals, schools, places of worship and silence zones.</li>
        <li>Clean up the debris afterwards and dispose of it safely.</li>
      </ul>
      <h2>First aid</h2>
      <ul>
        <li>For minor burns, hold the area under cool running water for 10 to 20 minutes. Don&apos;t apply ice, ink or toothpaste.</li>
        <li>For eye injuries, don&apos;t rub. Rinse gently with clean water and see a doctor immediately.</li>
        <li>In an emergency call <b>112</b> (national emergency) or <b>101</b> (fire).</li>
      </ul>
    </InfoPage>
  );
}

export function ShippingPage() {
  const { settings: s } = useStore();
  return (
    <InfoPage
      title="Shipping & Returns"
      description="Delivery timelines, charges, and our return and cancellation policy for crackers orders."
      path="/shipping-returns"
    >
      <h2>Delivery</h2>
      <ul>
        <li>Orders are dispatched within 1 to 3 working days after confirmation. Delivery usually takes 3 to 7 days depending on location.</li>
        <li>
          Delivery charge is {formatINR(s.shipping_fee)}
          {s.auto_coupon?.type === "FREESHIP" && <> (FREE with code {s.auto_coupon.code}, applied automatically at checkout)</>}, and
          delivery is free on orders above {formatINR(s.free_shipping_above)}. Cash on Delivery orders have {formatINR(s.cod_fee)} extra
          COD charges. Minimum order value is {formatINR(s.min_order_value)}.
        </li>
        <li>Crackers are transported by licensed carriers as per explosives transport rules, so some remote pincodes may not be serviceable.</li>
        <li>Pickup from our licensed shop is available. Choose it at checkout.</li>
      </ul>
      <h2>Cancellations</h2>
      <p>You can cancel an order before it is packed. Contact us by phone with your order ID. Prepaid orders are refunded to the original payment method within 5 to 7 working days.</p>
      <h2>Returns</h2>
      <p>
        For safety reasons crackers cannot be returned once delivered. If an item arrives damaged or is missing, share photos with us
        within 24 hours of delivery and we will replace it or refund you.
      </p>
    </InfoPage>
  );
}

export function TermsPage() {
  const { settings: s } = useStore();
  return (
    <InfoPage title="Terms & Conditions" description="Terms and conditions for buying crackers online." path="/terms">
      <p>By placing an order with {s.store_name} you agree to the following terms.</p>
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
      {s.licence_number && (
        <>
          <h2>Licence</h2>
          <p>{s.licence_number}</p>
        </>
      )}
    </InfoPage>
  );
}
