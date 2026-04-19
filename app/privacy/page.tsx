import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Modvora Labs",
  description: "How Modvora Labs collects, uses, and protects your personal data.",
};

const sections = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    content: [
      {
        subtitle: "Account Information",
        text: "When you create an account, we collect your email address and a hashed version of your password. We never store passwords in plain text.",
      },
      {
        subtitle: "Build & Garage Data",
        text: "All vehicle information, mod logs, journal entries, photos, milestones, and tracker data you enter is stored in our database associated with your account. This data is yours.",
      },
      {
        subtitle: "Usage Data",
        text: "We may collect anonymised information about how you use the platform — such as which features are used most — to improve the product. This data cannot identify you individually.",
      },
      {
        subtitle: "Cookies",
        text: "We use a single session cookie to keep you logged in. We do not use advertising or tracking cookies. You can clear cookies at any time via your browser settings.",
      },
    ],
  },
  {
    id: "how-we-use-it",
    title: "How We Use Your Information",
    content: [
      {
        subtitle: "To Provide the Service",
        text: "Your data is used to power your garage, build journal, milestones, and dashboard. We need it to make the product work.",
      },
      {
        subtitle: "To Communicate With You",
        text: "We may send you transactional emails (e.g. password resets, account notices). If you opt in, we may send product updates or build tips. You can unsubscribe from non-essential emails at any time.",
      },
      {
        subtitle: "To Improve the Product",
        text: "Aggregated, anonymised usage data helps us understand which features are valuable and where the product needs work. We never sell this data.",
      },
    ],
  },
  {
    id: "data-sharing",
    title: "Data Sharing & Third Parties",
    content: [
      {
        subtitle: "We Do Not Sell Your Data",
        text: "We will never sell, rent, or trade your personal information to third parties for marketing purposes. Full stop.",
      },
      {
        subtitle: "Service Providers",
        text: "We use a small number of trusted third-party services to operate the platform — including database hosting and email delivery. These providers only access data necessary to perform their specific function and are contractually bound to protect it.",
      },
      {
        subtitle: "Public Build Posts",
        text: "If you choose to publish a build to the community, the information you include in that post (vehicle details, mod list, photos) becomes publicly visible. You control what is included and can unpublish at any time.",
      },
      {
        subtitle: "Legal Requirements",
        text: "We may disclose information if required to do so by law or in response to a valid legal request (e.g. a court order or subpoena).",
      },
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights & Data Control",
    content: [
      {
        subtitle: "Access & Export",
        text: "You can view all data associated with your account at any time through the dashboard. Premium users can export their full build data.",
      },
      {
        subtitle: "Deletion",
        text: "You can delete your account and all associated data at any time by contacting us at contact@modvoralabs.com. We will process deletion requests within 30 days.",
      },
      {
        subtitle: "Correction",
        text: "If any personal information we hold is incorrect, you can update it directly in your account settings or contact us to correct it.",
      },
    ],
  },
  {
    id: "data-security",
    title: "Data Security",
    content: [
      {
        subtitle: "How We Protect Your Data",
        text: "All data is transmitted over HTTPS. Passwords are hashed using industry-standard algorithms. We regularly review our security practices and infrastructure.",
      },
      {
        subtitle: "No Guarantee",
        text: "While we take security seriously, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but will notify you promptly if a breach affecting your data occurs.",
      },
    ],
  },
  {
    id: "data-retention",
    title: "Data Retention",
    content: [
      {
        subtitle: "Active Accounts",
        text: "We retain your data for as long as your account is active. If you have not logged in for 24 months, we may notify you before archiving or deleting inactive account data.",
      },
      {
        subtitle: "Deleted Accounts",
        text: "When an account is deleted, we remove all personal data within 30 days. Some anonymised, aggregated data (e.g. total users) may be retained indefinitely.",
      },
    ],
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    content: [
      {
        subtitle: "Updates",
        text: "We may update this Privacy Policy from time to time. When we do, we will update the 'Last updated' date at the top of this page. For significant changes, we will notify you by email or via a notice in the app.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact Us",
    content: [
      {
        subtitle: "Questions or Concerns",
        text: "If you have any questions about this Privacy Policy or how we handle your data, please contact us at contact@modvoralabs.com or visit our Contact page.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#A020F0]/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4">Legal</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-4">
            Your data belongs to you. Here's exactly what we collect, why we collect it, and what we do with it — in plain English, not legalese.
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
          <div className="space-y-14">
            {sections.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="font-display text-xl font-bold text-white mb-6 pb-3 border-b border-[#2c2c32]">
                  {section.title}
                </h2>
                <div className="space-y-6">
                  {section.content.map((item) => (
                    <div key={item.subtitle}>
                      <p className="text-sm font-semibold text-zinc-300 mb-1.5">{item.subtitle}</p>
                      <p className="text-zinc-500 text-sm leading-[1.75]">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-16 pt-8 border-t border-[#2c2c32] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-zinc-600 text-sm">
              Have a question? <Link href="/contact" className="text-[#A020F0] hover:underline">Contact us</Link>.
            </p>
            <Link href="/terms" className="text-sm text-zinc-500 hover:text-white transition-colors">
              Terms of Service →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
