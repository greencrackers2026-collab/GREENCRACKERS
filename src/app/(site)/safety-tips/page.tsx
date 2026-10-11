import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/site/InfoPage";

export const metadata = pageMeta({
  title: "Diwali Crackers Safety Tips",
  description:
    "Essential firecracker safety tips for a happy Diwali: how to burst crackers safely, what to keep ready, first aid, and using crackers only in permitted areas and time slots.",
  path: "/safety-tips",
  keywords: ["crackers safety tips", "Diwali safety", "green crackers"],
});

export default function SafetyPage() {
  return (
    <InfoPage title="Safety Tips" path="/safety-tips" intro="A safe Diwali is a happy Diwali. Please read before you celebrate.">
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
