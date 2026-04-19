import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import Button from "@/components/ui/Button";
import AnimateIn from "@/components/ui/AnimateIn";

export const metadata: Metadata = {
  title: "Contact — Modvora Labs",
  description: "Get in touch with Modvora Labs. We're happy to answer questions before you commit.",
};

const infoCards = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    label: "Email us directly",
    value: "contact@modvoralabs.com",
    sub: null,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: "Response time",
    value: "1–2 business days",
    sub: "We read every message personally.",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#A020F0]/8 rounded-full blur-[130px] pointer-events-none orb-float" />
        <div className="relative max-w-2xl mx-auto">
          <AnimateIn>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4">Contact</p>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Get in touch
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Have a question before signing up? Want to know if Modvora is right for your build?
              Send us a message — we'll get back to you.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Form + Info */}
      <section className="pb-28 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Info column */}
          <div className="space-y-5">
            {infoCards.map((card, i) => (
              <AnimateIn key={card.label} variant="left" delay={i * 100}>
                <div className="bg-[#1a1a1e] border border-[#2c2c32] rounded-2xl p-6 transition-all duration-200 hover:border-[#A020F0]/25">
                  <div className="w-10 h-10 rounded-xl bg-[#A020F0]/10 border border-[#A020F0]/20 flex items-center justify-center text-purple-400 mb-4">
                    {card.icon}
                  </div>
                  <p className="text-zinc-500 text-xs font-semibold uppercase tracking-[0.15em] mb-1">{card.label}</p>
                  <p className="text-white font-medium text-sm">{card.value}</p>
                  {card.sub && <p className="text-zinc-600 text-xs mt-1">{card.sub}</p>}
                </div>
              </AnimateIn>
            ))}

            {/* Ready CTA card */}
            <AnimateIn variant="left" delay={200}>
              <div className="bg-gradient-to-br from-[#A020F0]/10 to-[#1a1a1e] border border-[#A020F0]/20 rounded-2xl p-6">
                <p className="text-white font-semibold text-sm mb-2">Ready to start your build?</p>
                <p className="text-zinc-500 text-sm mb-5 leading-relaxed">
                  Skip the questions and go straight to setting up your garage. Free to start.
                </p>
                <Button href="/intake" size="sm">Start Free</Button>
              </div>
            </AnimateIn>
          </div>

          {/* Form column */}
          <AnimateIn className="md:col-span-2" delay={100}>
            <ContactForm />
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
