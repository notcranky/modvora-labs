import SectionHeader from "@/components/ui/SectionHeader";
import Button from "@/components/ui/Button";

const steps = [
  {
    number: "01",
    title: "Add your car to the garage",
    description:
      "Start free by entering your vehicle details. It takes two minutes and immediately unlocks your personal build dashboard with journal, tracker, and milestones.",
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
    description:
      "Record every modification you've made or plan to make — with cost, status, notes, and photos. Mark things as planned, purchased, or installed as your build moves forward.",
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
    description:
      "Create custom milestones for your build roadmap and check them off as you go. Add your own steps like an engine swap, a wrap, or anything else that fits your vision.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Share your build with the community",
    description:
      "When you're ready, publish your build to the community gallery. Other builders can discover your car, see your mods, and get inspired — and you can browse theirs.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const faqs = [
  { q: "Do I need Premium to use Modvora?", a: "No. The full garage, build journal, milestone tracker, and community are all free. Premium adds extra tools and car slots for builders who want more." },
  { q: "What do I get after adding my car?", a: "You immediately get a personal build dashboard where you can log mods, track costs, set milestones, add photos, and plan your next steps." },
  { q: "Can I track multiple cars?", a: "Yes. You can manage multiple vehicles in your garage, each with its own build journal, tracker, and history. Extra car slots are available for Premium members." },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="pt-32 pb-16 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-3">Process</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5">
            How Modvora works
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Add your car, start logging your build, and share it when you're ready. The idea is to make the product useful from day one — a real home for your project, not a one-time tool.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute left-[28px] top-8 bottom-8 w-px bg-gradient-to-b from-purple-600/40 via-purple-600/20 to-transparent hidden md:block" />

            <div className="space-y-8">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="relative flex gap-6 md:gap-8 bg-[#16161a] border border-[#2a2a30] rounded-xl p-7 card-hover"
                >
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-purple-600/15 border border-purple-600/25 flex items-center justify-center text-purple-400">
                      {step.icon}
                    </div>
                  </div>

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

      <section className="py-24 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to set up your build?</h2>
          <p className="text-zinc-400 mb-8">Enter your vehicle and let the planner start doing useful work.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button href="/intake" size="lg">Start My Build</Button>
            <Button href="/services" variant="outline" size="lg">Compare plans</Button>
          </div>
        </div>
      </section>
    </>
  );
}
