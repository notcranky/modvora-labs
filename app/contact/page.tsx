import ContactForm from "@/components/ContactForm";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Contact — Modvora Labs",
  description: "Get in touch with Modvora Labs. We're happy to answer questions before you commit.",
};

export default function ContactPage() {
  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-16 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-3">Contact</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-5">Get in Touch</h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Have a question before purchasing? Want to know if we can help with your build? Send us a message.
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Info column */}
          <div className="space-y-6">
            <div className="bg-[#16161a] border border-[#2a2a30] rounded-xl p-6">
              <div className="w-9 h-9 rounded-lg bg-purple-600/15 border border-purple-600/20 flex items-center justify-center text-purple-400 mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm mb-1">Email</p>
              <p className="text-zinc-500 text-sm">contact@modvoralabs.com</p>
            </div>

            <div className="bg-[#16161a] border border-[#2a2a30] rounded-xl p-6">
              <div className="w-9 h-9 rounded-lg bg-purple-600/15 border border-purple-600/20 flex items-center justify-center text-purple-400 mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-white font-medium text-sm mb-1">Response Time</p>
              <p className="text-zinc-500 text-sm">Within 1–2 business days</p>
            </div>

            <div className="bg-[#16161a] border border-[#2a2a30] rounded-xl p-6">
              <p className="text-white font-medium text-sm mb-2">Ready to order?</p>
              <p className="text-zinc-500 text-sm mb-4">Skip the questions and go straight to submitting your vehicle.</p>
              <Button href="/intake" size="sm">Get Started</Button>
            </div>
          </div>

          {/* Form column */}
          <div className="md:col-span-2">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
