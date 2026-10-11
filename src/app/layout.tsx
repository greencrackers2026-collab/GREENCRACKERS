import type { Metadata, Viewport } from "next";
import { Outfit, Yatra_One } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/seo";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const yatra = Yatra_One({ subsets: ["latin"], weight: "400", variable: "--font-yatra", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Diwali Crackers Store",
  formatDetection: { telephone: false },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#140b33",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${outfit.variable} ${yatra.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
