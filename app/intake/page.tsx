import IntakeForm from "@/components/IntakeForm";

export const metadata = {
  title: "Build Setup — Modvora",
  description: "Enter your vehicle details, goals, and budget to unlock your personalized automotive mod planner.",
};

export default function IntakePage() {
  return (
    <>
      <section className="pt-32 pb-12 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-3">Build Setup</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Set up your build planner</h1>
          <p className="text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            This works like a build configurator, not a consulting intake. Enter your exact vehicle,
            goals, and budget so Modvora can tailor recommendations, build phases, and part suggestions to your platform.
          </p>
        </div>
      </section>

      <section className="pb-8 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Vehicle-aware", text: "Use year, trim, engine, drivetrain, and existing mods to shape smarter recommendations." },
              { title: "Useful first", text: "Unlock a dashboard with ranked parts, planning phases, and tracking before you worry about upgrading." },
              { title: "Garage ready", text: "You can now save multiple vehicles locally, switch builds later, and keep adding more cars without losing your current setup." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-[#2a2a30] bg-[#111113] p-5">
                <h2 className="text-white font-semibold mb-2">{item.title}</h2>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24 px-6">
        <IntakeForm />
      </section>
    </>
  );
}
