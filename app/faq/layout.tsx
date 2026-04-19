import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "FAQ — Modvora Labs",
  description: "Answers to common questions about Modvora Labs — what we do, how it works, pricing, and more.",
};

export default function FaqLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
