"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Connect to backend
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  const inputClass =
    "w-full bg-[#111113] border border-[#2c2c32] rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-[#A020F0]/60 focus:ring-1 focus:ring-[#A020F0]/20 transition-colors";

  if (submitted) {
    return (
      <div className="bg-[#1a1a1e] border border-[#2c2c32] rounded-2xl p-10 text-center h-full flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-14 h-14 rounded-full bg-[#A020F0]/10 border border-[#A020F0]/25 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-white font-bold text-2xl mb-2">Message sent</h3>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Thanks {form.name}. We&apos;ll reply to <span className="text-[#A020F0]">{form.email}</span> within 1–2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a1e] border border-[#2c2c32] rounded-2xl p-8 space-y-6">
      <div>
        <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-[0.12em] mb-1.5">Your Name *</label>
        <input
          name="name" required value={form.name} onChange={handleChange}
          className={inputClass} placeholder="John Doe"
        />
      </div>
      <div>
        <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-[0.12em] mb-1.5">Email Address *</label>
        <input
          name="email" type="email" required value={form.email} onChange={handleChange}
          className={inputClass} placeholder="you@email.com"
        />
      </div>
      <div>
        <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-[0.12em] mb-1.5">Message *</label>
        <textarea
          name="message" required value={form.message} onChange={handleChange}
          rows={6} className={inputClass}
          placeholder="What would you like to know? Ask about services, your specific car, timeline, or anything else."
        />
      </div>
      <Button type="submit" size="md" disabled={loading} className="w-full justify-center">
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending...
          </span>
        ) : (
          "Send Message"
        )}
      </Button>
    </form>
  );
}
