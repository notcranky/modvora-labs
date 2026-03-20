import IntakeForm from "@/components/IntakeForm";

export const metadata = {
  title: "Submit Your Vehicle — Modvora Labs",
  description: "Enter your vehicle details, goals, and budget to receive a custom modification plan.",
};

export default function IntakePage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-12 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-3">Get Started</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Submit Your Vehicle</h1>
          <p className="text-zinc-400 leading-relaxed">
            Fill out the form below with your vehicle info, goals, and budget. We&apos;ll send back a custom
            build plan tailored to your exact car.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <IntakeForm />
      </section>
    </>
  );
}
