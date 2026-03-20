import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Modvora Labs — Custom Car Modification Planning",
  description:
    "Custom car upgrade plans, performance guidance, and build strategy for your vehicle, your budget, and your goals.",
  keywords: "car modifications, custom build plans, performance upgrades, automotive tuning, mod planning",
  openGraph: {
    title: "Modvora Labs",
    description: "Smarter Mod Plans for Real Builds",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0b] text-[#f4f4f5] antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
