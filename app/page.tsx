import type { Metadata } from "next";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import AnimateIn from "@/components/ui/AnimateIn";

export const metadata: Metadata = {
  title: "Modvora Labs — Build Journal & Mod Tracker for Car People",
  description: "Track every modification, set milestones, log your budget, and share your build. The free build journal built around your exact car and goals.",
};

const whyCards = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: "Your build journal",
    text: "Every mod, cost, and photo — logged and tied to your car forever.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 7h18M8 7V5a4 4 0 118 0v2m-9 4h10m-11 4h12m-13 4h14" />
      </svg>
    ),
    title: "Garage for all your cars",
    text: "One dashboard for every vehicle. Switch builds without losing a thing.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Community & inspiration",
    text: "Browse real builds on your platform, then share yours when you're ready.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "Milestone tracking",
    text: "Check off what's done, plan what's next. See your progress at a glance.",
  },
];

const testimonials = [
  {
    quote: "Finally stopped using a Notes app to track my build. Everything is in one place and I actually know where my money went.",
    name: "Marcus T.",
    build: "2019 Subaru STI — Stage 2",
    initials: "MT",
  },
  {
    quote: "The budget tracker made me realize I was about to overspend on parts I didn't need yet. Saved me probably $600.",
    name: "Dani K.",
    build: "FD RX-7 project",
    initials: "DK",
  },
  {
    quote: "Seeing other people document their builds properly made me want to start mine. The community feed is genuinely addictive.",
    name: "Alex R.",
    build: "E36 M3 daily driver",
    initials: "AR",
  },
];

const previewServices = [
  {
    title: "Free",
    price: "$0",
    desc: "Full build journal — one car, unlimited mods, milestone tracking, and community access. No expiry.",
  },
  {
    title: "Premium",
    price: "$5/mo",
    desc: "More cars, richer recommendations, deeper planning tools, and saved progress exports.",
  },
  {
    title: "Ultra",
    price: "$7/mo",
    desc: "Everything in Premium plus the Mod Law Map — what's legal to modify in all 50 states.",
  },
  {
    title: "Extra Car",
    price: "$2 one-time",
    desc: "Add another vehicle to your garage. One-time fee, no recurring charge — it's yours forever.",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Add your car",
    text: "Year, make, model, trim, engine. Your garage is set up in under two minutes.",
  },
  {
    step: "02",
    title: "Log mods as you go",
    text: "Track what's done, what you paid, and what's still planned. Notes and photos included.",
  },
  {
    step: "03",
    title: "Plan what's next",
    text: "Set goals, check off milestones, and watch your build take shape over time.",
  },
  {
    step: "04",
    title: "Share it",
    text: "Publish your build to the community when you're ready. Your car, your story.",
  },
];

const avatarSeeds = ["MT", "DK", "AR", "JS", "CL"];

const staggerDelays = [0, 100, 200, 300, 400, 500];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#A020F0]/8 rounded-full blur-[140px] pointer-events-none orb-float" />
        <div className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] bg-purple-800/6 rounded-full blur-[100px] pointer-events-none hidden lg:block" />
        <div className="absolute bottom-[10%] left-[-5%] w-[350px] h-[350px] bg-[#A020F0]/5 rounded-full blur-[100px] pointer-events-none hidden lg:block" />
        {/* Subtle dot-grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.018]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-32">
          <p className="text-sm text-zinc-600 mb-8 font-semibold tracking-[0.15em] uppercase fade-in">
            Build journal & garage for car people
          </p>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — copy & CTAs */}
            <div className="text-center lg:text-left fade-in-delay-1">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-[4.5rem] font-bold leading-[1.04] mb-6">
                <span className="text-white">Plan the right mods.</span>
                <br />
                <span className="text-shimmer">Track the build<br className="hidden sm:block" /> as it evolves.</span>
              </h1>

              <p className="text-zinc-400 text-lg mb-8 leading-relaxed mx-auto lg:mx-0 max-w-md">
                One place for every mod, every dollar, and every milestone on your build.
              </p>

              {/* Social proof */}
              <div className="flex items-center gap-3 justify-center lg:justify-start mb-8">
                <div className="flex -space-x-2">
                  {avatarSeeds.map((seed, idx) => (
                    <div
                      key={seed}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#121212] bg-gradient-to-br from-purple-700 to-purple-900 text-[9px] font-bold text-white"
                      style={{ zIndex: 5 - idx }}
                    >
                      {seed}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-zinc-400">
                  <span className="font-semibold text-white">2,400+</span> builders already tracking their builds
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button href="/intake" size="lg" className="btn-pulse">
                  Start My Build
                </Button>
                <Button href="/community" variant="outline" size="lg">
                  Browse Builds
                </Button>
              </div>

              <p className="mt-5 text-sm text-zinc-600 text-center lg:text-left">
                Free forever. No credit card required.
              </p>
            </div>

            {/* Right — dashboard mockup */}
            <div className="fade-in-delay-2">
              <div className="rounded-2xl border border-[#2a2a32] bg-[#141418] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(160,32,240,0.06)]">
                {/* Window chrome */}
                <div className="border-b border-[#1e1e22] px-4 py-3 flex items-center gap-1.5 bg-[#111115]">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]/70" />
                  <span className="ml-3 text-xs text-zinc-600 select-none">My Garage — Modvora Labs</span>
                </div>

                <div className="p-5">
                  {/* Car info */}
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">Active build</p>
                      <p className="font-semibold text-white">2020 Toyota GR86</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Stage 2 · OEM+</p>
                    </div>
                    <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-[10px] text-purple-300">
                      Building
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-1 flex justify-between text-[10px] text-zinc-600">
                    <span>Build progress</span>
                    <span>62%</span>
                  </div>
                  <div className="mb-5 h-1.5 w-full rounded-full bg-[#1e1e24]">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-purple-600 to-purple-400"
                      style={{ width: "62%" }}
                    />
                  </div>

                  {/* Mod list */}
                  <div className="space-y-2 mb-5">
                    {[
                      { done: true, label: "BC Racing coilovers", cost: "$980" },
                      { done: true, label: "Enkei RPF1 17×9", cost: "$1,240" },
                      { done: false, label: "Tomei catback exhaust", cost: "$620" },
                      { done: false, label: "Cusco strut brace", cost: "$210" },
                    ].map((mod) => (
                      <div key={mod.label} className="flex items-center gap-2.5 rounded-lg bg-[#13131a] px-3 py-2.5">
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                            mod.done ? "bg-purple-600" : "border border-[#2a2a35]"
                          }`}
                        >
                          {mod.done && (
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`flex-1 text-xs ${mod.done ? "text-zinc-600 line-through" : "text-zinc-300"}`}>
                          {mod.label}
                        </span>
                        <span className="text-[10px] text-zinc-600">{mod.cost}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 rounded-xl border border-[#1e1e22] divide-x divide-[#1e1e22] overflow-hidden">
                    {[
                      { val: "$3,050", label: "Spent" },
                      { val: "$830", label: "Planned" },
                      { val: "12", label: "Mods" },
                    ].map((s) => (
                      <div key={s.label} className="px-3 py-3 text-center bg-[#111115]">
                        <p className="text-sm font-semibold text-white">{s.val}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#121212] to-transparent pointer-events-none" />
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="py-28 lg:py-36 px-6">
        <div className="max-w-7xl mx-auto">
          <AnimateIn>
            <SectionHeader
              eyebrow="Why builders use Modvora"
              title="Everything your build needs, nothing it doesn't"
              subtitle="Track what you've done, plan what's next, and share your story — without spreadsheets or scattered notes."
            />
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyCards.map((card, i) => (
              <AnimateIn key={card.title} delay={staggerDelays[i]}>
                <Card className="h-full">
                  <div className="w-11 h-11 rounded-xl bg-[#A020F0]/10 border border-[#A020F0]/20 flex items-center justify-center text-purple-400 mb-5">
                    {card.icon}
                  </div>
                  <h3 className="text-white font-semibold text-base mb-2.5">{card.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{card.text}</p>
                </Card>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="py-28 lg:py-36 px-6 bg-[#161618]">
        <div className="max-w-5xl mx-auto">
          <AnimateIn>
            <p className="text-zinc-600 text-xs font-semibold tracking-[0.2em] uppercase text-center mb-3">
              From the community
            </p>
            <p className="text-white font-display text-3xl md:text-4xl font-bold text-center mb-14 leading-tight">
              Real builders, real results.
            </p>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <AnimateIn key={t.name} delay={staggerDelays[i]}>
                <div className="rounded-2xl border border-[#2c2c32] bg-[#1a1a1e] p-7 flex flex-col group hover:border-[#A020F0]/25 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-5">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="h-3.5 w-3.5 text-[#A020F0]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-zinc-300 text-sm leading-[1.75] mb-6 flex-1">{t.quote}</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-[#2a2a30]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#A020F0] to-purple-800 text-xs font-bold text-white">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{t.build}</p>
                    </div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="py-28 lg:py-36 px-6">
        <div className="max-w-7xl mx-auto">
          <AnimateIn>
            <SectionHeader
              eyebrow="How it works"
              title="Up and running in under two minutes."
              subtitle="Add your car, log your first mod, and you're off. No onboarding wizard, no forced upgrade prompt."
            />
          </AnimateIn>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Connecting line — desktop only */}
            <div className="absolute top-10 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-[#A020F0]/20 to-transparent hidden lg:block pointer-events-none" />
            {processSteps.map((step, i) => (
              <AnimateIn key={step.step} delay={staggerDelays[i]}>
                <Card className="h-full relative z-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#A020F0]/10 border border-[#A020F0]/20 text-[#A020F0] text-xs font-bold shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="h-px flex-1 bg-[#2a2a32]" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{step.text}</p>
                </Card>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section className="py-28 lg:py-36 px-6 bg-[#161618]">
        <div className="max-w-7xl mx-auto">
          <AnimateIn>
            <SectionHeader
              eyebrow="Plans & pricing"
              title="Free to start. Upgrade when you want more."
              subtitle="The core build journal is free — no expiry, no feature gates on the basics. Premium unlocks deeper tools for builders who want to go further."
            />
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {previewServices.map((svc, i) => {
              const isPopular = svc.title === "Premium";
              return (
                <AnimateIn key={svc.title} variant="zoom" delay={staggerDelays[i]}>
                  <div
                    className={`rounded-2xl p-6 flex flex-col h-full transition-all duration-200 hover:-translate-y-1.5 ${
                      isPopular
                        ? "border border-[#A020F0]/45 bg-gradient-to-b from-[#A020F0]/10 to-[#1a1a1e] shadow-[0_0_40px_rgba(160,32,240,0.12),0_0_0_1px_rgba(160,32,240,0.08)] hover:shadow-[0_16px_50px_rgba(160,32,240,0.2)]"
                        : "border border-[#2c2c32] bg-[#1a1a1e] hover:border-[#A020F0]/25 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3 gap-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{svc.title}</h3>
                        {isPopular && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#A020F0] text-white px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-semibold whitespace-nowrap ${isPopular ? "text-[#A020F0]" : "text-purple-400"}`}>
                        {svc.price}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-5 flex-1">{svc.desc}</p>
                    <Button href="/intake" variant={isPopular ? "primary" : "outline"} size="sm">
                      Get started
                    </Button>
                  </div>
                </AnimateIn>
              );
            })}
          </div>
          <AnimateIn>
            <div className="text-center">
              <Button href="/services" variant="outline" size="lg">
                Compare all plans →
              </Button>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="py-28 lg:py-36 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimateIn variant="zoom">
            <div className="relative rounded-3xl border border-[#A020F0]/25 bg-gradient-to-br from-[#A020F0]/10 via-[#1a1a1e] to-[#161618] p-10 md:p-20 text-center overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#A020F0]/15 rounded-full blur-[90px] pointer-events-none orb-float" />
              <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-purple-800/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="relative">
                <p className="text-zinc-600 text-xs font-semibold tracking-[0.2em] uppercase mb-5">
                  Start building smarter
                </p>
                <h2 className="font-display text-3xl md:text-5xl lg:text-[3.25rem] font-bold text-white mb-5 leading-[1.08]">
                  Your build deserves a better home than a Notes app.
                </h2>
                <p className="text-zinc-400 mb-10 max-w-xl mx-auto leading-relaxed text-lg">
                  Join 2,400+ builders who track every mod, plan every stage, and never lose the thread of their project.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-5">
                  <Button href="/intake" size="lg" className="btn-pulse">
                    Start My Build — It's Free
                  </Button>
                  <Button href="/community" variant="outline" size="lg">
                    Browse Builds
                  </Button>
                </div>
                <p className="text-xs text-zinc-600">No credit card required. Cancel Premium anytime.</p>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>
    </>
  );
}
