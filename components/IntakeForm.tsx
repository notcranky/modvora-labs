"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

const services = [
  "Starter Plan",
  "Full Build Plan",
  "Budget Build Strategy",
  "Performance Path",
  "Style Upgrade Plan",
  "Consultation",
  "Not sure yet",
];

const drivetrains = ["FWD", "RWD", "AWD", "4WD", "Unknown"];
const budgetRanges = [
  "Under $500",
  "$500 – $1,000",
  "$1,000 – $2,500",
  "$2,500 – $5,000",
  "$5,000 – $10,000",
  "$10,000+",
];
const focusOptions = ["Performance", "Style", "Both", "Not sure yet"];

interface FormData {
  name: string;
  email: string;
  service: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  engine: string;
  drivetrain: string;
  mileage: string;
  budget: string;
  goals: string;
  focus: string;
  currentMods: string;
  notes: string;
}

const initialForm: FormData = {
  name: "",
  email: "",
  service: "",
  year: "",
  make: "",
  model: "",
  trim: "",
  engine: "",
  drivetrain: "",
  mileage: "",
  budget: "",
  goals: "",
  focus: "",
  currentMods: "",
  notes: "",
};

export default function IntakeForm() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Connect to backend / database
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  const inputClass =
    "w-full bg-[#111113] border border-[#2a2a30] rounded-lg px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-colors";

  const labelClass = "block text-zinc-400 text-sm font-medium mb-1.5";

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-purple-600/15 border border-purple-600/25 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Submission received</h2>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          Thanks {form.name}. We&apos;ve received your vehicle details and will send your custom
          build plan to <span className="text-purple-400">{form.email}</span> within the
          timeframe for your selected service.
        </p>
        <Button href="/" variant="outline">Back to Home</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
      <div className="bg-[#16161a] border border-[#2a2a30] rounded-2xl p-8 md:p-10 space-y-8">

        {/* Contact Info */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-600/20 text-purple-400 text-xs flex items-center justify-center font-bold">1</span>
            Your Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input name="name" required value={form.name} onChange={handleChange}
                className={inputClass} placeholder="John Doe" />
            </div>
            <div>
              <label className={labelClass}>Email Address *</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange}
                className={inputClass} placeholder="you@email.com" />
            </div>
          </div>
        </div>

        {/* Service Selection */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-600/20 text-purple-400 text-xs flex items-center justify-center font-bold">2</span>
            Service Selection
          </h2>
          <div>
            <label className={labelClass}>Which service are you interested in? *</label>
            <select name="service" required value={form.service} onChange={handleChange} className={inputClass}>
              <option value="">Select a service...</option>
              {services.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Vehicle Details */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-600/20 text-purple-400 text-xs flex items-center justify-center font-bold">3</span>
            Vehicle Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Year *</label>
              <input name="year" required value={form.year} onChange={handleChange}
                className={inputClass} placeholder="e.g. 2019" maxLength={4} />
            </div>
            <div>
              <label className={labelClass}>Make *</label>
              <input name="make" required value={form.make} onChange={handleChange}
                className={inputClass} placeholder="e.g. Toyota" />
            </div>
            <div>
              <label className={labelClass}>Model *</label>
              <input name="model" required value={form.model} onChange={handleChange}
                className={inputClass} placeholder="e.g. Supra" />
            </div>
            <div>
              <label className={labelClass}>Trim</label>
              <input name="trim" value={form.trim} onChange={handleChange}
                className={inputClass} placeholder="e.g. GR, Sport, Base" />
            </div>
            <div>
              <label className={labelClass}>Engine</label>
              <input name="engine" value={form.engine} onChange={handleChange}
                className={inputClass} placeholder="e.g. 2.0T, 3.0L I6, V8" />
            </div>
            <div>
              <label className={labelClass}>Drivetrain</label>
              <select name="drivetrain" value={form.drivetrain} onChange={handleChange} className={inputClass}>
                <option value="">Select...</option>
                {drivetrains.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Mileage</label>
              <input name="mileage" value={form.mileage} onChange={handleChange}
                className={inputClass} placeholder="e.g. 45,000 miles" />
            </div>
          </div>
        </div>

        {/* Goals & Budget */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-600/20 text-purple-400 text-xs flex items-center justify-center font-bold">4</span>
            Goals & Budget
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Total Modification Budget *</label>
              <select name="budget" required value={form.budget} onChange={handleChange} className={inputClass}>
                <option value="">Select budget range...</option>
                {budgetRanges.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Primary Focus *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {focusOptions.map((opt) => (
                  <label
                    key={opt}
                    className={`flex items-center justify-center gap-2 border rounded-lg px-4 py-3 text-sm cursor-pointer transition-all ${
                      form.focus === opt
                        ? "border-purple-500 bg-purple-600/10 text-purple-400"
                        : "border-[#2a2a30] text-zinc-500 hover:border-zinc-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="focus"
                      value={opt}
                      checked={form.focus === opt}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Your Goals *</label>
              <textarea
                name="goals"
                required
                value={form.goals}
                onChange={handleChange}
                rows={4}
                className={inputClass}
                placeholder="Describe what you want to achieve. More power? Better handling? Turning heads? Racing? Daily drivability? Be as specific as you want."
              />
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div>
          <h2 className="text-white font-semibold text-lg mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-purple-600/20 text-purple-400 text-xs flex items-center justify-center font-bold">5</span>
            Additional Info
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>Current Modifications</label>
              <textarea
                name="currentMods"
                value={form.currentMods}
                onChange={handleChange}
                rows={3}
                className={inputClass}
                placeholder="List any mods you've already done — intake, exhaust, suspension, wheels, tune, etc."
              />
            </div>
            <div>
              <label className={labelClass}>Additional Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                className={inputClass}
                placeholder="Anything else we should know? Track use? Daily driver? Specific concerns or limitations?"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button type="submit" size="lg" disabled={loading} className="w-full justify-center">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit My Vehicle"
            )}
          </Button>
          <p className="text-center text-zinc-600 text-xs mt-4">
            Your information is kept private and never sold to third parties.
          </p>
        </div>
      </div>
    </form>
  );
}
