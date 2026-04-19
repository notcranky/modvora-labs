import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#A020F0]/6 rounded-full blur-[140px] pointer-events-none" />
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "32px 32px" }}
      />

      <div className="relative text-center max-w-lg mx-auto fade-in">
        {/* Big 404 */}
        <p className="font-display text-[9rem] md:text-[12rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-zinc-800 to-zinc-900 select-none">
          404
        </p>

        <div className="-mt-6 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#A020F0]/25 bg-[#A020F0]/8 px-4 py-1.5 mb-5">
            <div className="h-1.5 w-1.5 rounded-full bg-[#A020F0]" />
            <span className="text-xs font-semibold text-[#A020F0] tracking-wide">Page not found</span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            This page took a wrong turn.
          </h1>
          <p className="text-zinc-500 text-base leading-relaxed max-w-sm mx-auto">
            The page you're looking for doesn't exist, was moved, or you followed a bad link.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Button href="/" size="lg">Back to Home</Button>
          <Button href="/community" variant="outline" size="lg">Browse Builds</Button>
        </div>

        {/* Quick links */}
        <div className="border-t border-[#2c2c32] pt-8">
          <p className="text-zinc-600 text-xs uppercase tracking-[0.15em] mb-4">Or try one of these</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { href: "/intake", label: "Start My Build" },
              { href: "/services", label: "Pricing" },
              { href: "/how-it-works", label: "How It Works" },
              { href: "/faq", label: "FAQ" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl border border-[#2c2c32] bg-[#1a1a1e] px-4 py-2 text-sm text-zinc-400 hover:text-white hover:border-[#A020F0]/30 transition-all duration-150"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
