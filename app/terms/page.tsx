import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Modvora Labs",
  description: "The terms and conditions governing use of Modvora Labs.",
};

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    content: `By creating an account or using any part of the Modvora Labs platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. We may update these terms from time to time — continued use after changes are posted constitutes acceptance of the updated terms.`,
  },
  {
    id: "description",
    title: "Description of Service",
    content: `Modvora Labs is a car modification planning and tracking platform. It allows users to log vehicle information, track modifications, set build milestones, maintain a build journal, and share builds with a community. The Service is provided on a freemium basis — core features are available for free, with optional paid tiers that unlock additional functionality.`,
  },
  {
    id: "accounts",
    title: "User Accounts",
    content: `You must provide a valid email address to create an account. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. You must be at least 13 years old to use the Service. If we discover an account belongs to someone under 13, it will be terminated immediately. Notify us immediately at contact@modvoralabs.com if you suspect unauthorised access to your account.`,
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    content: `You agree not to: (a) use the Service for any illegal purpose or in violation of any laws; (b) post content that is defamatory, harassing, abusive, or hateful; (c) impersonate another person or entity; (d) attempt to gain unauthorised access to any part of the Service or its infrastructure; (e) scrape, crawl, or extract data from the Service using automated means; (f) upload malicious code, viruses, or any software designed to disrupt or damage the Service; (g) use the Service to spam other users or distribute unsolicited commercial messages.`,
  },
  {
    id: "user-content",
    title: "Your Content",
    content: `You retain ownership of all content you create within the Service — including vehicle data, journal entries, photos, and build information. By using the Service, you grant Modvora Labs a limited, non-exclusive licence to store, display, and transmit your content solely as necessary to operate and provide the Service. If you publish a build to the public community, that content becomes visible to other users. You can unpublish it at any time. You are solely responsible for the content you post and represent that you have the rights to share it.`,
  },
  {
    id: "premium",
    title: "Premium Subscriptions",
    content: `Premium and Ultra plans are billed monthly on a recurring basis. You may cancel your subscription at any time through your account settings; your access continues until the end of the current billing period. We do not offer refunds for partial months. We reserve the right to change pricing with at least 30 days' notice. Free-tier features will always remain free as described at the time you signed up, though we reserve the right to adjust what's included in any paid tier.`,
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    content: `All aspects of the Modvora Labs platform — including the name, logo, design, codebase, features, and written content — are the intellectual property of Modvora Labs and are protected by applicable copyright and trademark law. You may not copy, reproduce, distribute, or create derivative works of the platform without our express written permission. The content you create remains yours; see "Your Content" above.`,
  },
  {
    id: "termination",
    title: "Termination",
    content: `You may close your account at any time by contacting us. We reserve the right to suspend or terminate your account at our discretion if you violate these Terms, engage in abuse of the platform or other users, or act in a way that we reasonably believe is harmful to the Service or community. Upon termination, your access to the Service will cease. We will delete your personal data in accordance with our Privacy Policy.`,
  },
  {
    id: "disclaimers",
    title: "Disclaimers & Limitation of Liability",
    content: `The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. Modvora Labs does not warrant that the Service will be error-free, uninterrupted, or free from security vulnerabilities. Any modification recommendations or part suggestions provided by the Service are for informational purposes only — we are not responsible for any damage to your vehicle or costs incurred as a result of following such information. To the maximum extent permitted by law, Modvora Labs' total liability to you for any claim arising from use of the Service shall not exceed the amount you paid us in the 12 months prior to the claim.`,
  },
  {
    id: "governing-law",
    title: "Governing Law",
    content: `These Terms are governed by and construed in accordance with applicable law. Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration, except where prohibited by law. You waive any right to participate in a class action lawsuit against Modvora Labs.`,
  },
  {
    id: "changes",
    title: "Changes to These Terms",
    content: `We may update these Terms at any time. When we do, we will update the "Last updated" date below. For significant changes, we will notify you by email or via an in-app notice. Your continued use of the Service after changes take effect constitutes your acceptance of the revised Terms.`,
  },
  {
    id: "contact",
    title: "Contact",
    content: `Questions about these Terms? Reach us at contact@modvoralabs.com or visit the Contact page. We aim to respond within 2 business days.`,
  },
];

export default function TermsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#A020F0]/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4">Legal</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Terms of Service
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-4">
            The rules for using Modvora Labs. We've written this to be readable — please take a few minutes to go through it.
          </p>
          <p className="text-zinc-600 text-sm">Last updated: March 2026</p>
        </div>
      </section>

      {/* Table of contents + content */}
      <section className="pb-32 px-6">
        <div className="max-w-3xl mx-auto">

          {/* TOC */}
          <div className="rounded-2xl border border-[#2c2c32] bg-[#1a1a1e] p-6 mb-12">
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-4">Contents</p>
            <ul className="space-y-2">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-sm text-zinc-400 hover:text-[#A020F0] transition-colors flex items-center gap-2"
                  >
                    <span className="text-zinc-700 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-white mb-4 pb-3 border-b border-[#2c2c32]">
                  {section.title}
                </h2>
                <p className="text-zinc-500 text-sm leading-[1.8]">{section.content}</p>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-16 pt-8 border-t border-[#2c2c32] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-zinc-600 text-sm">
              Have a question? <Link href="/contact" className="text-[#A020F0] hover:underline">Contact us</Link>.
            </p>
            <Link href="/privacy" className="text-sm text-zinc-500 hover:text-white transition-colors">
              ← Privacy Policy
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
