import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/site/InfoPage";

export async function generateMetadata() {
  const s = await getSettings();
  return pageMeta({
    title: "About Us: Sivakasi Crackers Online",
    description: `${s.storeName} brings genuine Sivakasi crackers to your doorstep at up to ${s.maxDiscountPercent}% off MRP.`,
    path: "/about",
  });
}

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <InfoPage title="About Us" path="/about" intro={`Celebrating Diwali with genuine Sivakasi crackers since day one.`}>
      <p>
        {s.storeName} is a licensed crackers seller bringing you trusted brands straight from Sivakasi, India&apos;s fireworks
        capital. By sourcing directly from manufacturers we cut out middlemen, which is why you get 50% to {s.maxDiscountPercent}% off MRP.
      </p>
      <h2>What we stand for</h2>
      <ul>
        <li>Genuine, branded products: Cornation, Balaji&apos;s, Sarvam, Blue Stars, Rathnaa&apos;s and more.</li>
        <li>Green crackers wherever available, clearly marked on every product.</li>
        <li>Safe, compliant selling: we don&apos;t sell or deliver where crackers are banned.</li>
        <li>Honest prices with MRP shown, and no hidden charges.</li>
      </ul>
      <h2>Licence</h2>
      <p>{s.licenceNumber || "Licence details available on request."}</p>
      <p>
        Have a bulk requirement? <Link href="/quote">Request a wholesale quote</Link>.
      </p>
    </InfoPage>
  );
}
