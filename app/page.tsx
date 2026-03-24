import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";

const whyCards = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: "Your build journal",
    text: "Log every mod, note the cost, capture photos, and write down what you learned — all tied to your car so the history never gets lost.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 7h18M8 7V5a4 4 0 118 0v2m-9 4h10m-11 4h12m-13 4h14" />
      </svg>
    ),
    title: "Garage for all your cars",
    text: "Keep every vehicle in one place with its own tracker, milestones, photos, and spend history. Switch between builds without losing any context.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Community & inspiration",
    text: "Browse real builds from other car people, see what they did to the same platform, and share your own story when you're ready.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: "Milestone tracking",
    text: "Plan what's next, mark things done as you go, and watch your build progress over time instead of keeping it all in your head.",
  },
];

const previewServices = [
  { title: "Free Tier", price: "$0", desc: "Enter your car and unlock a personalized planner with one vehicle slot, recommended parts, build stages, and progress tracking." },
  { title: "Premium Membership", price: "$9/mo", desc: "A monthly upgrade for deeper planner features, saved builds, richer recommendations, and premium tools." },
  { title: "Extra Car Slot", price: "$2/mo", desc: "Add another vehicle to Premium when you want to manage a second project, daily, or comparison build." },
  { title: "Expert Consultation", price: "Optional", desc: "Hands-on help is available when you want a human opinion, but it is not the main product anymore." },
];

const deliverables = [
  "A build journal to log every mod, cost, and photo",
  "Garage support for multiple cars in one place",
  "Milestone checklist to track what's done and what's next",
  "Community gallery to share your build and browse others",
  "Budget tracker so you always know what you've spent",
  "Premium membership if you want deeper tools later",
];

const processSteps = [
  {
    step: "01",
    title: "Add your car",
    text: "Enter your year, make, model, trim, engine, and current mods to set up your garage in under two minutes.",
  },
  {
    step: "02",
    title: "Log your mods as you go",
    text: "Track what you've done, what you paid, and what's still planned. Add notes, photos, and milestones to build a real record of your project.",
  },
  {
    step: "03",
    title: "Plan what's next",
    text: "Add custom steps, set goals, and mark milestones done as your build evolves. Everything stays organized in your dashboard.",
  },
  {
    step: "04",
    title: "Share it with the community",
    text: "Publish your build to the community gallery when you're ready. Let others see your car, your story, and what you've built.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-32">
          <div className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-600/20 rounded-full px-4 py-1.5 text-purple-400 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
            Build journal & garage for car people
          </div>

          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.02] mb-6">
                <span className="text-white">Plan the right mods.</span>
                <br />
                <span className="text-gradient">Track the build as it evolves.</span>
              </h1>

              <p className="text-zinc-400 text-lg md:text-xl max-w-3xl mb-8 leading-relaxed mx-auto lg:mx-0">
                Modvora is the build journal and garage for car people who want to track every mod,
                log their spend, plan what's next, and share their story — all in one place.
              </p>

              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-10 text-sm text-zinc-300">
                {[
                  "Free to start",
                  "Build journal & milestone tracker",
                  "Community gallery",
                  "Multiple cars supported",
                ].map((item) => (
                  <div
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-[#2a2a30] bg-[#111113] px-3.5 py-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button href="/intake" size="lg">
                  Start My Build
                </Button>
                <Button href="/community" variant="outline" size="lg">
                  Browse Builds
                </Button>
                <Button href="/how-it-works" variant="ghost" size="lg">
                  See How It Works
                </Button>
              </div>

              <div className="mt-8 text-sm text-zinc-500 text-center lg:text-left">
                Free to start. Add your car and begin logging in minutes.
              </div>
            </div>

            <Card className="relative border-purple-600/20 bg-[#121216] p-7 md:p-8" hover={false}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none" />
              <div className="relative">
                <p className="text-purple-400 text-xs font-medium tracking-widest uppercase mb-3">
                  What you unlock
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  A real home for your build — not a search engine you forget about.
                </h2>
                <p className="text-zinc-400 leading-relaxed mb-6">
                  Keep your whole build in one place — what you've done, what you spent, what's next, and how far you've come.
                </p>

                <div className="space-y-3 mb-8">
                  {deliverables.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                      <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-[#2a2a30] pt-6">
                  {[
                    { val: "Free", label: "Planner Entry" },
                    { val: "$9/mo", label: "Premium" },
                    { val: "$2/mo", label: "Extra Car" },
                  ].map((s) => (
                    <div key={s.label} className="text-center lg:text-left">
                      <p className="text-lg font-bold text-purple-400">{s.val}</p>
                      <p className="text-zinc-500 text-xs mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0b] to-transparent pointer-events-none" />
      </section>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="Why drivers use Modvora"
            title="Useful before it asks for more"
            subtitle="The product should earn attention first: understand the car, surface relevant ideas, and help map the build before pushing someone toward Premium or expert help."
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

      <section className="py-24 px-6 bg-[#0d0d0f]">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="How it works"
            title="Tell us the platform. Set the goal. Start planning."
            subtitle="The current product flow is self-serve: enter the car, unlock the build dashboard, then decide whether you want to stay free or move into Premium for more depth."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {processSteps.map((step) => (
              <Card key={step.step} className="h-full">
                <p className="text-purple-400 text-xs font-mono font-bold mb-3">{step.step}</p>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            eyebrow="Plans & upgrades"
            title="Simple pricing for real projects"
            subtitle="The core planner stands on its own. Premium adds more structure, saved progress, and richer recommendations without forcing everyone into expensive one-time services."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {previewServices.map((svc) => (
              <Card key={svc.title}>
                <div className="flex items-start justify-between mb-3 gap-3">
                  <h3 className="text-white font-semibold">{svc.title}</h3>
                  <span className="text-purple-400 text-sm font-medium whitespace-nowrap">{svc.price}</span>
                </div>
                <p className="text-zinc-500 text-sm leading-relaxed mb-5">{svc.desc}</p>
                <Button href="/intake" variant="outline" size="sm">
                  Explore This Option
                </Button>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button href="/services" variant="outline" size="lg">
              Compare All Plans
            </Button>
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl border border-purple-600/20 bg-gradient-to-br from-purple-600/10 to-transparent p-10 md:p-16 text-center overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-purple-600/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative">
              <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-3">
                Ready when you are
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Build smarter before you spend badly.
              </h2>
              <p className="text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                Enter your vehicle, see what fits your direction, track the parts that make sense,
                and upgrade only when you want a more guided build path.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button href="/intake" size="lg">
                  Start My Build
                </Button>
                <Button href="/services" variant="outline" size="lg">
                  View Plans & Pricing
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
