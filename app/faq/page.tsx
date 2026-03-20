"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

const faqs = [
  {
    q: "Do you sell parts?",
    a: "No. Modvora Labs is a planning and advisory service only. We do not sell, stock, or ship any physical parts. Our plans tell you what to look for — sourcing and purchasing is up to you.",
  },
  {
    q: "Is this for any car?",
    a: "Yes. We work with all makes and models — domestic, import, European, classic, and modern. As long as you can describe your vehicle, we can build a plan around it.",
  },
  {
    q: "How long does it take to receive my plan?",
    a: "Delivery times range from 2 to 5 business days depending on the service selected. Consultations are typically delivered within 2 business days, while Full Build Plans take up to 5.",
  },
  {
    q: "Do you give exact part suggestions?",
    a: "We provide specific part categories, brands, and types based on your car and goals. While we don't provide live pricing or specific purchase links, our plans give you enough detail to shop with confidence.",
  },
  {
    q: "Can I ask questions after receiving my plan?",
    a: "Yes. Every plan includes a follow-up window where you can ask clarifying questions. We want to make sure you fully understand your recommendations before you commit to anything.",
  },
  {
    q: "Is this for performance or looks?",
    a: "Both. We offer separate services for performance-focused builds (Performance Path) and style-focused builds (Style Upgrade Plan), as well as combined plans that address both. You choose your direction when you submit your vehicle.",
  },
  {
    q: "Do you help with budget builds?",
    a: "Absolutely — that's what the Budget Build Strategy is designed for. We'll identify the highest-impact modifications for your car at the lowest possible cost, with DIY-friendly options highlighted.",
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
      {/* Header */}
      <section className="pt-32 pb-16 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-3">FAQ</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5">
            Common Questions
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Everything you need to know before submitting your vehicle.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* Still have questions */}
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
