import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { pageMeta } from "@/lib/seo";
import { waLink } from "@/lib/format";
import { InfoPage } from "@/components/site/InfoPage";

export async function generateMetadata() {
  const s = await getSettings();
  return pageMeta({
    title: "Contact Us",
    description: `Contact ${s.storeName} for Diwali crackers orders, bulk quotes and delivery questions. Call or WhatsApp us.`,
    path: "/contact",
  });
}

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <InfoPage title="Contact Us" path="/contact" intro="We're happy to help with orders, delivery and bulk pricing.">
      <ul>
        {s.phone && (
          <li>
            Phone: <a href={`tel:${s.phone.replace(/\s/g, "")}`}>{s.phone}</a>
          </li>
        )}
        {s.whatsappNumber && (
          <li>
            WhatsApp:{" "}
            <a href={waLink(s.whatsappNumber, "Hi! I have a question about crackers.")} target="_blank" rel="noopener noreferrer">
              Chat with us
            </a>
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
        For wholesale, apartment or corporate orders, use the <Link href="/quote">Get a Quote</Link> form for the fastest response.
      </p>
      <h2>Pickup from shop</h2>
      <p>
        If delivery isn&apos;t available in your area, choose &quot;Pickup from shop&quot; at checkout or message us on WhatsApp.
      </p>
    </InfoPage>
  );
}
