import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const services = [
  {
    title: "Starter Plan",
    price: "$49",
    badge: "Most Popular",
    description:
      "Perfect for drivers who are just getting started with modifications or need a clear direction before committing to upgrades.",
    includes: [
      "Top 5–8 recommended modifications for your car",
      "Budget breakdown by priority tier",
      "Goals-based filtering (performance vs. style)",
      "General parts category guidance",
      "Delivered within 3 business days",
    ],
    cta: "Get Starter Plan",
  },
  {
    title: "Full Build Plan",
    price: "$149",
    badge: "Best Value",
    description:
      "A complete, staged upgrade roadmap built around your vehicle, your goals, and your timeline.",
    includes: [
      "Full staged modification roadmap",
      "Priority order for upgrades",
      "Performance and style recommendations",
      "Budget allocation across all stages",
      "Notes on compatibility and install difficulty",
      "Delivered within 5 business days",
    ],
    cta: "Get Full Build Plan",
  },
  {
    title: "Budget Build Strategy",
    price: "$59",
    badge: null,
    description:
      "For builders who want the most impact for the least spend. We find where every dollar does the most work.",
    includes: [
      "Highest-value mods per dollar spent",
      "DIY-friendly options highlighted",
      "Budget tier breakdown",
      "No-filler recommendations only",
      "Delivered within 3 business days",
    ],
    cta: "Get Budget Strategy",
  },
  {
    title: "Performance Path",
    price: "$99",
    badge: null,
    description:
      "Focused entirely on driving dynamics — speed, throttle response, handling, exhaust tone, and feel.",
    includes: [
      "Engine and intake recommendations",
      "Exhaust and sound options",
      "Suspension and handling upgrades",
      "Brake and safety mods",
      "Tuning and ECU notes",
      "Delivered within 4 business days",
    ],
    cta: "Get Performance Path",
  },
  {
    title: "Style Upgrade Plan",
    price: "$79",
    badge: null,
    description:
      "Transform how your car looks inside and out. Visual mods, aero, interior upgrades, and more.",
    includes: [
      "Exterior visual modification guide",
      "Wheel and stance recommendations",
      "Interior upgrade options",
      "Lighting and aero notes",
      "Color and wrap direction tips",
      "Delivered within 3 business days",
    ],
    cta: "Get Style Plan",
  },
  {
    title: "Consultation",
    price: "$39",
    badge: null,
    description:
      "Got specific questions? Book a focused consultation and get direct, personalized answers for your exact situation.",
    includes: [
      "One focused topic or question area",
      "Written response with details",
      "Tailored to your car and context",
      "Follow-up question included",
      "Delivered within 2 business days",
    ],
    cta: "Book Consultation",
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-3">Services</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5">
            Plans for every build
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Every plan is custom, digital, and built around your car. No generic lists. No parts sales.
            Just clear, expert guidance.
          </p>
        </div>
      </section>

      {/* Service Cards */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc) => (
              <div
                key={svc.title}
                className={`bg-[#16161a] border rounded-xl p-7 flex flex-col card-hover ${
                  svc.badge === "Best Value"
                    ? "border-purple-600/40 purple-glow"
                    : "border-[#2a2a30]"
                }`}
              >
                {/* Top */}
                <div className="flex items-start justify-between mb-4">
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
                    <p className="text-zinc-600 text-xs">one-time</p>
                  </div>
                </div>

                <p className="text-zinc-500 text-sm leading-relaxed mb-6">{svc.description}</p>

                {/* Includes */}
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

                <Button href="/intake" variant={svc.badge === "Best Value" ? "primary" : "outline"}>
                  {svc.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ note */}
      <section className="py-16 px-6 text-center">
        <p className="text-zinc-500 text-sm mb-4">
          Have questions before purchasing?
        </p>
        <div className="flex gap-4 justify-center">
          <Button href="/faq" variant="outline">View FAQ</Button>
          <Button href="/contact" variant="ghost">Contact Us</Button>
        </div>
      </section>
    </>
  );
}
