import Button from "@/components/ui/Button";

const services = [
  {
    title: "Free",
    price: "$0",
    cadence: "always free",
    badge: "Start here",
    description:
      "Add one car, log your mods, set milestones, and track your build progress — no credit card needed.",
    includes: [
      "1 vehicle in your garage",
      "Basic build log (mod name + status)",
      "Up to 3 milestones",
      "Browse the community gallery",
      "Spend tracker",
    ],
    cta: "Start Free",
    href: "/intake",
  },
  {
    title: "Premium",
    price: "$5",
    cadence: "/month",
    badge: "Most Popular",
    description:
      "Unlock the full build journal with photos, notes, cost tracking, and the ability to publish your build to the community.",
    includes: [
      "Everything in Free",
      "Full build log — cost, vendor, notes, photos",
      "Unlimited milestones",
      "Publish your build to the community",
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
    description:
      "Everything in Premium plus the Mod Law Map — an interactive guide showing what's legal to modify in every US state.",
    includes: [
      "Everything in Premium",
      "Mod Law Map — all 50 states",
      "Window tint, exhaust, emissions, underglow laws",
      "Straight pipe & colored headlight rules by state",
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
    description:
      "Add another vehicle to your garage for a one-time $2 fee. No recurring charge — it's yours forever.",
    includes: [
      "Adds 1 more vehicle to your garage",
      "Own build journal and tracker",
      "Great for project cars, dailies, or a second build",
      "Stackable — add as many as you want",
    ],
    cta: "Add a Car",
    href: "/intake",
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="pt-32 pb-16 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-3">Plans & Pricing</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5">
            Start free. Upgrade when your build gets serious.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Modvora is a build journal and garage for car people. The free tier is genuinely useful on its own,
            Premium adds more depth for serious projects, and extra car slots keep multi-car builds organized.
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {services.map((svc) => (
              <div
                key={svc.title}
                className={`bg-[#16161a] border rounded-xl p-7 flex flex-col card-hover ${
                  svc.title === "Premium Membership"
                    ? "border-purple-600/40 purple-glow"
                    : "border-[#2a2a30]"
                }`}
              >
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div>
                    {svc.badge && (
                      <span className="inline-block bg-purple-600/15 text-purple-400 text-xs font-medium px-2.5 py-1 rounded-full mb-2 border border-purple-600/20">
                        {svc.badge}
                      </span>
                    )}
                    <h3 className="text-white font-bold text-xl">{svc.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-purple-400">{svc.price}</span>
                    <p className="text-zinc-500 text-xs">{svc.cadence}</p>
                  </div>
                </div>

                <p className="text-zinc-400 text-sm leading-relaxed mb-6">{svc.description}</p>

                <div className="flex-1 mb-7">
                  <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">
                    What&apos;s included
                  </p>
                  <ul className="space-y-2.5">
                    {svc.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-400">
                        <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button href={svc.href} variant={svc.title === "Premium Membership" || svc.price === "$0" ? "primary" : "outline"}>
                  {svc.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 text-center">
        <p className="text-zinc-500 text-sm mb-4">
          Want to see the planner before deciding whether Premium is worth it?
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button href="/intake">Start Your Build</Button>
          <Button href="/how-it-works" variant="outline">See the product flow</Button>
        </div>
      </section>
    </>
  );
}
