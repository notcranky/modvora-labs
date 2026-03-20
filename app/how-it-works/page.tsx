import SectionHeader from "@/components/ui/SectionHeader";
import Button from "@/components/ui/Button";

const steps = [
  {
    number: "01",
    title: "Choose a Service",
    description:
      "Browse our service packages and select the plan that fits your build goals — performance, style, budget, or a full roadmap.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Enter Your Vehicle Details",
    description:
      "Fill out our intake form with your car's year, make, model, trim, engine, drivetrain, mileage, and any mods you already have.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Submit Your Goals & Budget",
    description:
      "Tell us what you want to achieve — more power, better handling, head-turning looks, or all of it. Set your budget range so we build within your limits.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Receive Your Custom Build Plan",
    description:
      "We review your submission and send back a full, custom plan tailored specifically to your vehicle. No templates. No filler. Just actionable guidance.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const faqs = [
  { q: "How long does it take to receive my plan?", a: "Delivery ranges from 2–5 business days depending on the service selected." },
  { q: "What format is the plan delivered in?", a: "Plans are delivered as a detailed PDF document sent to your email." },
  { q: "Can I ask questions after receiving my plan?", a: "Yes. Each plan includes a follow-up window for clarification questions." },
];

export default function HowItWorksPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-3">Process</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5">
            How It Works
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Four simple steps between you and a custom build plan. No phone calls. No guesswork.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Vertical line on desktop */}
            <div className="absolute left-[28px] top-8 bottom-8 w-px bg-gradient-to-b from-purple-600/40 via-purple-600/20 to-transparent hidden md:block" />

            <div className="space-y-8">
              {steps.map((step, i) => (
                <div
                  key={step.number}
                  className="relative flex gap-6 md:gap-8 bg-[#16161a] border border-[#2a2a30] rounded-xl p-7 card-hover"
                >
                  {/* Number badge */}
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-purple-600/15 border border-purple-600/25 flex items-center justify-center text-purple-400">
                      {step.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-purple-600/60 text-xs font-mono font-bold">{step.number}</span>
                      <h3 className="text-white font-bold text-lg">{step.title}</h3>
                    </div>
                    <p className="text-zinc-500 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick FAQs */}
      <section className="py-16 px-6 bg-[#0d0d0f]">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            eyebrow="Quick Answers"
            title="A few common questions"
            subtitle=""
          />
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="bg-[#16161a] border border-[#2a2a30] rounded-xl p-6">
                <p className="text-white font-medium mb-2">{f.q}</p>
                <p className="text-zinc-500 text-sm">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-zinc-400 mb-8">Submit your vehicle and goals — we&apos;ll handle the rest.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button href="/intake" size="lg">Submit Your Vehicle</Button>
            <Button href="/services" variant="outline" size="lg">View Services</Button>
          </div>
        </div>
      </section>
    </>
  );
}
