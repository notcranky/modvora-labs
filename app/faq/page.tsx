"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import AnimateIn from "@/components/ui/AnimateIn";

const faqs = [
  {
    q: "Do you sell parts?",
    a: "No. Modvora is a planning platform, not a parts store. We help you figure out what fits, what makes sense, and what to buy next — but sourcing and purchasing are still up to you.",
  },
  {
    q: "Is this for any car?",
    a: "Yes. We work with all makes and models — domestic, import, European, classic, and modern. As long as you can describe your vehicle, we can build a plan around it.",
  },
  {
    q: "What do I get on the free tier?",
    a: "Free gives you a usable starting point: one vehicle slot, recommendations tied to your platform, phased planning, visualizer access, and dashboard tracking.",
  },
  {
    q: "What does Premium include?",
    a: "Premium is the deeper monthly layer. It adds more detailed planner features, richer recommendations, saved build progress, premium tools, and support for extra vehicle slots at a one-time $2 per car.",
  },
  {
    q: "Do I need Premium to use Modvora?",
    a: "No. The product is intentionally useful before you pay. Premium is for people who want a more involved planning workspace over time.",
  },
  {
    q: "Can I track more than one car?",
    a: "Yes. Premium includes your main vehicle, and you can add extra car slots for a one-time $2 per car — no recurring charge.",
  },
  {
    q: "Is expert help still available?",
    a: "Yes. Consultation is still available as an optional add-on when you want a human opinion on a tricky decision, but it is no longer the core product.",
  },
  {
    q: "Can you help with older cars?",
    a: "Yes. We regularly work on classic builds, older platform builds, and vintage restorations. Just include your car's year, make, and model in the intake form and we'll tailor the plan accordingly.",
  },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <AnimateIn delay={index * 60}>
      <div
        className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
          open
            ? "border-[#A020F0]/30 bg-[#1a1a1e] shadow-[0_4px_20px_rgba(160,32,240,0.08)]"
            : "border-[#2c2c32] bg-[#1a1a1e] hover:border-[#A020F0]/20"
        }`}
      >
        <button
          className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <span className={`font-medium text-sm md:text-base transition-colors duration-200 ${open ? "text-white" : "text-zinc-300"}`}>
            {q}
          </span>
          <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200 ${
            open
              ? "border-[#A020F0]/50 bg-[#A020F0]/15 text-purple-400"
              : "border-[#3a3a40] text-zinc-500"
          }`}>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Smooth height animation via CSS grid trick */}
        <div className={`accordion-body ${open ? "open" : ""}`}>
          <div>
            <p className="text-zinc-500 text-sm leading-relaxed px-6 pb-5">{a}</p>
          </div>
        </div>
      </div>
    </AnimateIn>
  );
}

export default function FaqPage() {
  return (
    <>
      <section className="pt-32 pb-16 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#A020F0]/8 rounded-full blur-[120px] pointer-events-none orb-float" />
        <div className="relative max-w-2xl mx-auto">
          <AnimateIn>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4">FAQ</p>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-5 leading-tight">
              Common Questions
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Everything you need to know before setting up your build.
            </p>
          </AnimateIn>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} index={i} />
          ))}
        </div>
      </section>

      <section className="py-20 px-6 text-center">
        <div className="max-w-lg mx-auto">
          <AnimateIn variant="zoom">
            <div className="bg-[#1a1a1e] border border-[#2c2c32] rounded-2xl p-10">
              <h2 className="font-display text-xl font-bold text-white mb-3">Still have questions?</h2>
              <p className="text-zinc-500 text-sm mb-6">
                Send us a message and we&apos;ll get back to you before you commit to anything.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button href="/contact" variant="primary">Contact Us</Button>
                <Button href="/intake" variant="outline">Get Started</Button>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
