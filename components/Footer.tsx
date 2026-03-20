import Link from "next/link";

const footerLinks = [
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/intake", label: "Get Started" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[#2a2a30] bg-[#0a0a0b] mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="font-semibold text-white text-lg tracking-tight">
                Modvora <span className="text-purple-400">Labs</span>
              </span>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
              Custom car modification planning for real builds. Smarter upgrades, less guesswork.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-white font-medium text-sm mb-4">Navigation</p>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-zinc-500 hover:text-purple-400 text-sm transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-medium text-sm mb-4">Contact</p>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li>
                <Link href="/contact" className="hover:text-purple-400 transition-colors duration-150">
                  Send a message
                </Link>
              </li>
              <li>
                <Link href="/intake" className="hover:text-purple-400 transition-colors duration-150">
                  Submit your vehicle
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[#2a2a30] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-sm">
            &copy; {new Date().getFullYear()} Modvora Labs. All rights reserved.
          </p>
          <p className="text-zinc-700 text-xs">
            Built for serious builders.
          </p>
        </div>
      </div>
    </footer>
  );
}
