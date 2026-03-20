import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: "Budget Matters",
    text: "We respect your budget as a hard constraint, not a suggestion. Every plan is scoped to work within what you actually have to spend.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "For Serious Builders",
    text: "Whether you're building a track car, a clean street build, or a budget sleeper — we take your build as seriously as you do.",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-3">About</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            We help drivers build<br className="hidden md:block" /> smarter.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
            Modvora Labs was built around one idea: most people waste money on modifications because
            they don&apos;t have a plan. We fix that.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-6 bg-[#0d0d0f]">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#16161a] border border-purple-600/20 rounded-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/8 rounded-full blur-[60px] pointer-events-none" />
            <div className="relative">
              <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-4">Our Mission</p>
              <p className="text-white text-xl md:text-2xl font-medium leading-relaxed mb-6">
                &ldquo;Modvora Labs helps drivers plan smarter modifications for their vehicles. Instead of guessing
                what parts to buy, customers receive custom build strategies designed around their car, budget, and goals.&rdquo;
              </p>
              <p className="text-zinc-500 leading-relaxed">
                Our mission is to help people avoid wasting money and build their cars with confidence.
                Whether you&apos;re building a weekend track car, a clean daily driver, or a full-send project —
                you deserve a plan that actually makes sense for your specific situation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-xl mb-12">
            <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-3">What We Stand For</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">Principles behind every plan</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {values.map((v) => (
              <Card key={v.title}>
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-lg bg-purple-600/15 border border-purple-600/20 flex items-center justify-center text-purple-400 flex-shrink-0">
                    {v.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">{v.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{v.text}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What we're not */}
      <section className="py-16 px-6 bg-[#0d0d0f]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">What Modvora Labs is not</h2>
          <div className="space-y-4">
            {[
              "We are not a parts retailer. We do not sell physical products.",
              "We are not a generic mod list generator. Every plan is custom.",
              "We are not affiliated with any manufacturer or parts brand.",
              "We are not a mechanic service. We do not perform installations.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <svg className="w-5 h-5 text-zinc-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-zinc-400 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Start your build the right way</h2>
          <p className="text-zinc-400 mb-8">Submit your vehicle and let us build a plan that actually makes sense for your car.</p>
          <Button href="/intake" size="lg">Get Started</Button>
        </div>
      </section>
    </>
  );
}
