import type { Metadata } from "next";
import Button from "@/components/ui/Button";
import AnimateIn from "@/components/ui/AnimateIn";

export const metadata: Metadata = {
  title: "How It Works — Modvora Labs",
  description: "Add your car, log every mod, set milestones, and share your build. See exactly how Modvora Labs works.",
};

const steps = [
  {
    number: "01",
    title: "Add your car to the garage",
    description: "Start free by entering your vehicle details — year, make, model, trim, engine. It takes two minutes and immediately unlocks your personal build dashboard with journal, tracker, and milestones.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Log your mods and track progress",
    description: "Record every modification you've made or plan to make — with cost, status, notes, and photos. Mark things as planned, purchased, or installed as your build moves forward.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Set milestones and plan ahead",
    description: "Create custom milestones for your build roadmap and check them off as you go. Add your own steps — engine swap, wrap, track day prep, anything. See exactly how far along you are.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M5 3l14 9-14 9V3z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Share your build with the community",
    description: "When you're ready, publish your build to the community gallery. Other builders can discover your car, see your mods, and get inspired — and you can browse theirs.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const faqs = [
  {
    q: "Do I need Premium to use Modvora?",
    a: "No. The full garage, build journal, milestone tracker, and community browse are all free. Premium adds extra tools and car slots for builders who want to go further.",
  },
  {
    q: "What do I get after adding my car?",
    a: "You immediately get a personal build dashboard where you can log mods, track costs, set milestones, add photos, and plan your next steps.",
  },
  {
    q: "Can I track multiple cars?",
    a: "Yes. You can manage multiple vehicles in your garage, each with its own build journal, tracker, and history. Extra car slots are available as a one-time $2 add-on.",
  },
  {
    q: "Is my data safe if I cancel?",
    a: "Your data stays intact even on the free tier. If you delete your account, we remove everything within 30 days per our Privacy Policy.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#A020F0]/8 rounded-full blur-[130px] pointer-events-none orb-float" />
        <div className="relative max-w-3xl mx-auto">
          <AnimateIn>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4">Process</p>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              How Modvora works
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Add your car, start logging your build, and share it when you're ready.
              Useful from day one — a real home for your project, not a one-time tool.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Steps */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[27px] top-10 bottom-10 w-px bg-gradient-to-b from-[#A020F0]/40 via-[#A020F0]/15 to-transparent hidden md:block" />

            <div className="space-y-5">
              {steps.map((step, i) => (
                <AnimateIn key={step.number} variant="left" delay={i * 100}>
                  <div className="relative flex gap-6 md:gap-8 bg-[#1a1a1e] border border-[#2c2c32] rounded-2xl p-7 transition-all duration-200 hover:border-[#A020F0]/25 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
                    <div className="shrink-0 relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-[#A020F0]/10 border border-[#A020F0]/20 flex items-center justify-center text-purple-400">
                        {step.icon}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[#A020F0]/60 text-xs font-bold font-mono">{step.number}</span>
                        <h3 className="text-white font-bold text-lg">{step.title}</h3>
                      </div>
                      <p className="text-zinc-500 leading-relaxed text-sm">{step.description}</p>
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-[#161618]">
        <div className="max-w-2xl mx-auto">
          <AnimateIn>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-12 text-center">Quick answers</h2>
          </AnimateIn>
          <div className="space-y-4">
            {faqs.map((f, i) => (
              <AnimateIn key={f.q} delay={i * 80}>
                <div className="rounded-2xl border border-[#2c2c32] bg-[#1a1a1e] p-6">
                  <p className="text-white font-semibold text-sm mb-2">{f.q}</p>
                  <p className="text-zinc-500 text-sm leading-relaxed">{f.a}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <AnimateIn variant="zoom">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-5 leading-tight">
              Ready to set up your build?
            </h2>
            <p className="text-zinc-500 mb-10 leading-relaxed">Add your car for free and start tracking in under two minutes.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button href="/intake" size="lg">Start My Build</Button>
              <Button href="/services" variant="outline" size="lg">Compare Plans</Button>
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
