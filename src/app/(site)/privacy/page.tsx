import { getSettings } from "@/lib/settings";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/site/InfoPage";

export const metadata = pageMeta({
  title: "Privacy Policy",
  description: "How we collect, use and protect your personal information.",
  path: "/privacy",
});

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <InfoPage title="Privacy Policy" path="/privacy">
      <p>{s.storeName} respects your privacy. This policy explains what we collect and why.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Name, phone number, email and delivery address you enter at checkout or in the quote form.</li>
        <li>Order details and payment status. Card and UPI details are handled by Razorpay and are never stored by us.</li>
        <li>Your cart is saved in your own browser (local storage) so it isn&apos;t lost on refresh.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To process, deliver and support your orders, including calling you about your order.</li>
        <li>To respond to quote requests.</li>
        <li>We do not sell your data. We share it only with delivery and payment partners as needed to fulfil your order.</li>
      </ul>
      <h2>Your choices</h2>
      <p>
        To access, correct or delete your data, contact us{s.email ? ` at ${s.email}` : ""}. We keep order records as required by
        tax law.
      </p>
    </InfoPage>
  );
}
