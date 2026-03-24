"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

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
    a: "Premium is the deeper monthly layer. It adds more detailed planner features, richer recommendations, saved build progress, premium tools, and support for extra vehicle slots at $2/month each.",
  },
  {
    q: "Do I need Premium to use Modvora?",
    a: "No. The product is intentionally useful before you pay. Premium is for people who want a more involved planning workspace over time.",
  },
  {
    q: "Can I track more than one car?",
    a: "Yes. Premium includes your main vehicle, and you can add extra car slots for $2/month each if you want to manage more builds in the same account.",
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

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`border rounded-xl transition-all duration-150 ${
        open ? "border-purple-600/30 bg-[#16161a]" : "border-[#2a2a30] bg-[#16161a]"
      }`}
    >
      <button
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className={`font-medium text-sm md:text-base transition-colors ${open ? "text-white" : "text-zinc-300"}`}>
          {q}
        </span>
        <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-150 ${
          open ? "border-purple-500 bg-purple-600/15 text-purple-400" : "border-[#3a3a40] text-zinc-500"
        }`}>
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-6 pb-5">
          <p className="text-zinc-500 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <>
      <section className="pt-32 pb-16 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-3">FAQ</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5">
            Common Questions
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Everything you need to know before setting up your build.
          </p>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      <section className="py-20 px-6 text-center">
        <div className="max-w-lg mx-auto bg-[#16161a] border border-[#2a2a30] rounded-2xl p-10">
          <h2 className="text-xl font-bold text-white mb-3">Still have questions?</h2>
          <p className="text-zinc-500 text-sm mb-6">
            Send us a message and we&apos;ll get back to you before you commit to anything.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button href="/contact" variant="primary">Contact Us</Button>
            <Button href="/intake" variant="outline">Get Started</Button>
          </div>
        </div>
      </section>
    </>
  );
}
