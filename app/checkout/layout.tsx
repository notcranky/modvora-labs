import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Checkout — Modvora Labs",
  description: "Upgrade your Modvora Labs plan. Unlock premium build tools, unlimited milestones, and the Mod Law Map.",
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
