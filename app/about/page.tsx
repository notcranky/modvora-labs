import type { Metadata } from "next";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AnimateIn from "@/components/ui/AnimateIn";

export const metadata: Metadata = {
  title: "About — Modvora Labs",
  description: "Modvora Labs helps car people plan smarter modifications. Built around your car, your budget, and your goals.",
};

const values = [
  {
    title: "No Parts. Just Plans.",
    text: "We don't sell parts or earn commissions. Every recommendation is based purely on what works best for your car and goals.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Built Around Your Car",
    text: "Generic mod lists waste money. Our plans account for your exact vehicle, the mods you already have, and your platform's real-world limitations.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Budget as a Hard Constraint",
    text: "We respect your budget — not as a suggestion, but as a line that doesn't get crossed. Every plan is scoped to work within what you actually have to spend.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "For Serious Builders",
    text: "Track car, clean daily, budget sleeper — it doesn't matter. We take your build as seriously as you do, whatever direction that is.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const notList = [
  "We are not a parts retailer. We do not sell physical products.",
  "We are not a generic mod list generator. Every plan is custom.",
  "We are not affiliated with any manufacturer or parts brand.",
  "We are not a mechanic service. We do not perform installations.",
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#A020F0]/8 rounded-full blur-[120px] pointer-events-none orb-float" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-900/5 rounded-full blur-[80px] pointer-events-none hidden lg:block" />
        <div className="relative max-w-4xl mx-auto">
          <AnimateIn>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4">About Modvora Labs</p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.06]">
              We help drivers<br className="hidden md:block" /> build smarter.
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl mb-10">
              Modvora Labs was built around one idea: most people waste money on modifications because
              they don't have a plan. We fix that — with a build journal, budget tracker, and milestone
              system built around your exact car and goals.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/intake" size="lg">Start My Build</Button>
              <Button href="/how-it-works" variant="outline" size="lg">See How It Works</Button>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6 bg-[#161618]">
        <div className="max-w-3xl mx-auto">
          <AnimateIn variant="zoom">
            <div className="rounded-3xl border border-[#A020F0]/20 bg-gradient-to-br from-[#A020F0]/8 to-[#1a1a1e] p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#A020F0]/8 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative">
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#A020F0] mb-5">Our Mission</p>
                <p className="text-white text-xl md:text-2xl font-medium leading-[1.6] mb-6">
                  &ldquo;Help drivers plan smarter modifications — designed around their actual car, budget, and goals. No guesswork. No wasted money.&rdquo;
                </p>
                <p className="text-zinc-500 leading-relaxed text-sm">
                  Whether you're building a weekend track car, a clean daily driver, or a full-send project —
                  you deserve a plan that actually makes sense for your specific situation, not a generic list
                  pulled from a forum thread.
                </p>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Values */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <AnimateIn>
            <div className="max-w-xl mb-14">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4">What We Stand For</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">Principles behind every plan</h2>
            </div>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {values.map((v, i) => (
              <AnimateIn key={v.title} delay={i * 100}>
                <Card className="h-full">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#A020F0]/10 border border-[#A020F0]/20 flex items-center justify-center text-purple-400 shrink-0">
                      {v.icon}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-2">{v.title}</h3>
                      <p className="text-zinc-500 text-sm leading-relaxed">{v.text}</p>
                    </div>
                  </div>
                </Card>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* What we're not */}
      <section className="py-20 px-6 bg-[#161618]">
        <div className="max-w-3xl mx-auto">
          <AnimateIn>
            <h2 className="font-display text-3xl font-bold text-white mb-10">What Modvora Labs is not</h2>
          </AnimateIn>
          <div className="space-y-4">
            {notList.map((item, i) => (
              <AnimateIn key={item} variant="left" delay={i * 80}>
                <div className="flex items-start gap-4 rounded-2xl border border-[#2c2c32] bg-[#1a1a1e] px-5 py-4">
                  <svg className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <AnimateIn variant="zoom">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
              Ready to build with a plan?
            </h2>
            <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
              Add your car for free and get a build dashboard tailored to your vehicle, goals, and budget in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button href="/intake" size="lg">Get Started — It's Free</Button>
              <Button href="/contact" variant="outline" size="lg">Talk to Us</Button>
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
