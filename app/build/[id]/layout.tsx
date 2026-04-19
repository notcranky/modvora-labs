import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Build Profile — Modvora Labs",
  description: "Explore this car build on Modvora Labs — mods, milestones, budget, and the full build journal.",
};

export default function BuildLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
