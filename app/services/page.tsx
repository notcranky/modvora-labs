import type { Metadata } from "next";
import Button from "@/components/ui/Button";
import AnimateIn from "@/components/ui/AnimateIn";

export const metadata: Metadata = {
  title: "Plans & Pricing — Modvora Labs",
  description: "Free to start. Upgrade when your build gets serious. Compare all Modvora Labs plans.",
};

const services = [
  {
    title: "Free",
    price: "$0",
    cadence: "always free",
    badge: null,
    isPopular: false,
    description: "Add one car, log your mods, set milestones, and track your build progress — no credit card needed.",
    includes: [
      "1 vehicle in your garage",
      "Full build log — mod name, status, notes",
      "Up to 3 milestones",
      "Browse the community gallery",
      "Spend tracker",
      "Build journal",
    ],
    cta: "Start Free",
    href: "/intake",
  },
  {
    title: "Premium",
    price: "$5",
    cadence: "/month",
    badge: "Most Popular",
    isPopular: true,
    description: "Unlock the full build journal with photos, unlimited milestones, cost tracking, and the ability to publish your build.",
    includes: [
      "Everything in Free",
      "Full build log — cost, vendor, notes, photos",
      "Unlimited milestones",
      "Publish your build to the community",
      "Multiple vehicle slots",
      "Priority support",
    ],
    cta: "Go Premium",
    href: "/intake",
  },
  {
    title: "Ultra",
    price: "$7",
    cadence: "/month",
    badge: "Best Value",
    isPopular: false,
    description: "Everything in Premium plus the Mod Law Map — an interactive guide to what's legal in every US state.",
    includes: [
      "Everything in Premium",
      "Mod Law Map — all 50 states",
      "Window tint & exhaust laws",
      "Emissions & underglow rules by state",
      "Straight pipe & headlight laws",
      "Updated as laws change",
    ],
    cta: "Go Ultra",
    href: "/intake",
  },
  {
    title: "Extra Car",
    price: "$2",
    cadence: "one-time per car",
    badge: "Add-on",
    isPopular: false,
    description: "Add another vehicle to your garage for a one-time $2 fee. No recurring charge — it's yours forever.",
    includes: [
      "1 additional vehicle",
      "Own build journal & tracker",
      "Full milestone support",
      "Perfect for project cars or dailies",
      "Stackable — add as many as you want",
    ],
    cta: "Add a Car",
    href: "/intake",
  },
];

const faqs = [
  {
    q: "Is the free tier actually free forever?",
    a: "Yes. The free tier never expires, never prompts you to upgrade, and has no feature gates on the core journal and tracker. We mean it.",
  },
  {
    q: "What happens if I cancel Premium?",
    a: "Your access continues until the end of your billing period. After that you drop to the free tier — your data stays intact, you just lose the premium features.",
  },
  {
    q: "Can I manage multiple cars?",
    a: "Yes. Premium includes multiple vehicle slots. You can also buy extra car slots for a one-time $2 each — no recurring charge.",
  },
  {
    q: "What is the Mod Law Map?",
    a: "An interactive guide covering modification laws across all 50 US states — window tint limits, exhaust noise rules, underglow legality, emissions, and more. Exclusive to Ultra.",
  },
  {
    q: "Do you offer refunds?",
    a: "We don't offer refunds for partial months, but you can cancel at any time. If something went wrong, reach out and we'll make it right.",
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#A020F0]/8 rounded-full blur-[130px] pointer-events-none orb-float" />
        <div className="relative max-w-3xl mx-auto">
          <AnimateIn>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4">Plans & Pricing</p>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Start free. Upgrade when<br className="hidden md:block" /> your build gets serious.
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              The core build journal is free — no expiry, no gotchas. Premium and Ultra unlock
              deeper tools for builders who want to go further.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Pricing grid */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {services.map((svc, i) => (
              <AnimateIn key={svc.title} variant="zoom" delay={i * 100}>
                <div
                  className={`rounded-2xl p-7 flex flex-col h-full transition-all duration-200 hover:-translate-y-1 ${
                    svc.isPopular
                      ? "border border-[#A020F0]/45 bg-gradient-to-b from-[#A020F0]/10 to-[#1a1a1e] shadow-[0_0_40px_rgba(160,32,240,0.12)]"
                      : "border border-[#2c2c32] bg-[#1a1a1e]"
                  }`}
                >
                  {/* Header */}
                  <div className="mb-5">
                    {svc.badge && (
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3 ${
                        svc.isPopular
                          ? "bg-[#A020F0] text-white"
                          : "bg-[#A020F0]/10 text-purple-400 border border-[#A020F0]/20"
                      }`}>
                        {svc.badge}
                      </span>
                    )}
                    <div className="flex items-end justify-between gap-2">
                      <h3 className="text-white font-bold text-xl">{svc.title}</h3>
                      <div className="text-right">
                        <span className={`text-2xl font-bold ${svc.isPopular ? "text-[#A020F0]" : "text-white"}`}>{svc.price}</span>
                        <p className="text-zinc-600 text-xs">{svc.cadence}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-zinc-500 text-sm leading-relaxed mb-6">{svc.description}</p>

                  {/* Includes */}
                  <div className="flex-1 mb-7">
                    <p className="text-zinc-600 text-[10px] font-semibold uppercase tracking-[0.15em] mb-3">What's included</p>
                    <ul className="space-y-2.5">
                      {svc.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-400">
                          <svg className="w-4 h-4 text-[#A020F0] mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button href={svc.href} variant={svc.isPopular ? "primary" : "outline"}>
                    {svc.cta}
                  </Button>
                </div>
              </AnimateIn>
            ))}
          </div>

          {/* Trust line */}
          <AnimateIn delay={200}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-zinc-600 text-sm">
              {["No credit card required to start", "Cancel Premium anytime", "Your data stays yours — export anytime"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-green-500/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {t}
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-[#161618]">
        <div className="max-w-2xl mx-auto">
          <AnimateIn>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-12 text-center">Common questions</h2>
          </AnimateIn>
          <div className="space-y-5">
            {faqs.map((faq, i) => (
              <AnimateIn key={faq.q} delay={i * 80}>
                <div className="rounded-2xl border border-[#2c2c32] bg-[#1a1a1e] p-6">
                  <p className="text-white font-semibold text-sm mb-2">{faq.q}</p>
                  <p className="text-zinc-500 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <AnimateIn variant="zoom">
            <h2 className="font-display text-3xl font-bold text-white mb-4">Still not sure?</h2>
            <p className="text-zinc-500 mb-8 leading-relaxed">Start free and see the dashboard before deciding if Premium is worth it. No card, no commitment.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button href="/intake" size="lg">Start Free</Button>
              <Button href="/how-it-works" variant="outline" size="lg">See How It Works</Button>
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
