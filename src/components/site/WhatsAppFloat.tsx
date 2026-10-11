import { WhatsAppIcon } from "@/components/ui/Icons";
import { waLink } from "@/lib/format";

export function WhatsAppFloat({ number, storeName }: { number: string; storeName: string }) {
  if (!number) return null;
  return (
    <a
      href={waLink(number, `Hi ${storeName}, I'd like to order Diwali crackers.`)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-[#25D366] px-4 font-semibold text-[#06290f] shadow-[0_10px_30px_-8px_rgba(37,211,102,0.8)] transition-transform hover:scale-105"
      aria-label="Order on WhatsApp"
    >
      <WhatsAppIcon width={26} height={26} />
      <span className="hidden sm:inline">Order on WhatsApp</span>
    </a>
  );
}
