import Link from "next/link";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";

const whyCards = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: "Custom Build Plans",
    text: "Every plan is built around your specific vehicle, goals, and budget — not a generic checklist.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Budget-Based Recommendations",
    text: "Tell us what you have to spend and we'll map the best upgrade path within your range.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Style & Performance Guidance",
    text: "Whether you're chasing speed, sound, handling, or looks — we guide every direction of your build.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
    title: "Designed for Your Exact Vehicle",
    text: "Plans account for your year, make, model, engine, drivetrain, and existing modifications.",
  },
];

const previewServices = [
  { title: "Starter Plan", price: "From $49", desc: "Basic mod recommendations and upgrade direction." },
  { title: "Full Build Plan", price: "From $149", desc: "Complete upgrade roadmap based on your car and goals." },
  { title: "Performance Path", price: "From $99", desc: "Focus on speed, response, handling, and sound." },
  { title: "Style Upgrade Plan", price: "From $79", desc: "Exterior, interior, and visual transformation ideas." },
  { title: "Budget Build Strategy", price: "From $59", desc: "Best mods for the lowest cost." },
  { title: "Consultation", price: "From $39", desc: "Direct advice for your specific questions." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-600/20 rounded-full px-4 py-1.5 text-purple-400 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
            Custom Automotive Build Planning
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            <span className="text-white">Smarter Mod Plans</span>
            <br />
            <span className="text-gradient">for Real Builds</span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Custom car upgrade plans, performance guidance, and build strategy for your vehicle,
            your budget, and your goals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/intake" size="lg">
              Get Started
            </Button>
            <Button href="/services" variant="outline" size="lg">
              View Services
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { val: "500+", label: "Build Plans" },
              { val: "All Makes", label: "& Models" },
              { val: "100%", label: "Custom" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-purple-400">{s.val}</p>
                <p className="text-zinc-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0b] to-transparent pointer-events-none" />
      </section>

      {/* Why Modvora Labs */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="Why Modvora Labs"
            title="Build smarter. Spend better."
            subtitle="We remove the guesswork from car modification so you can build with confidence and purpose."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyCards.map((card) => (
              <Card key={card.title}>
                <div className="w-10 h-10 rounded-lg bg-purple-600/15 border border-purple-600/20 flex items-center justify-center text-purple-400 mb-4">
                  {card.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{card.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{card.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-24 px-6 bg-[#0d0d0f]">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="Services"
            title="Plans for every build goal"
            subtitle="Choose the service that matches your direction. All plans are delivered digitally within your selected timeframe."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {previewServices.map((svc) => (
              <Card key={svc.title}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-semibold">{svc.title}</h3>
                  <span className="text-purple-400 text-sm font-medium whitespace-nowrap ml-3">{svc.price}</span>
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed mb-5">{svc.desc}</p>
                <Button href="/intake" variant="outline" size="sm">
                  Get This Plan
                </Button>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button href="/services" variant="outline" size="lg">
              See Full Service Details
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl border border-purple-600/20 bg-gradient-to-br from-purple-600/10 to-transparent p-10 md:p-16 text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-purple-600/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to plan your build?
              </h2>
              <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
                Submit your vehicle details and goals. We&apos;ll send back a custom modification plan built around your exact car and budget.
              </p>
              <Button href="/intake" size="lg">
                Submit Your Vehicle
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
