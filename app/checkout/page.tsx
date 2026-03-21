'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IntakeData } from '@/lib/types'
import { useAuth } from '@/hooks/useAuth'

const plans = [
  { id: 'free', name: 'Free Build Snapshot', price: 0, description: 'Unlock the planner, recommendations, and dashboard for your vehicle.' },
  { id: 'starter', name: 'Starter Plan', price: 49, description: 'A more curated first-stage roadmap for your build.' },
  { id: 'full-build', name: 'Full Build Plan', price: 149, description: 'A complete premium roadmap for the full project.' },
  { id: 'budget', name: 'Budget Build Strategy', price: 59, description: 'High-value upgrades prioritized for your budget.' },
  { id: 'performance', name: 'Performance Path', price: 99, description: 'Focused on speed, response, handling, braking, and sound.' },
  { id: 'style', name: 'Style Upgrade Plan', price: 79, description: 'Focused on stance, wheels, lighting, aero, and overall look.' },
  { id: 'consultation', name: 'Expert Consultation', price: 39, description: 'Optional direct advice for edge cases and tough decisions.' },
]

function getSelectedPlan(service?: string) {
  const normalized = service?.toLowerCase() ?? ''

  if (normalized.includes('free')) return plans.find((p) => p.id === 'free')!
  if (normalized.includes('starter')) return plans.find((p) => p.id === 'starter')!
  if (normalized.includes('full')) return plans.find((p) => p.id === 'full-build')!
  if (normalized.includes('budget')) return plans.find((p) => p.id === 'budget')!
  if (normalized.includes('performance')) return plans.find((p) => p.id === 'performance')!
  if (normalized.includes('style')) return plans.find((p) => p.id === 'style')!
  if (normalized.includes('consult')) return plans.find((p) => p.id === 'consultation')!

  return plans[0]
}

export default function CheckoutPage() {
  const { user } = useAuth()
  const [intake, setIntake] = useState<IntakeData | null>(null)
  const [processing, setProcessing] = useState(false)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('modvora_intake')
    if (stored) {
      try {
        setIntake(JSON.parse(stored))
      } catch {}
    }
  }, [])

  const selectedPlan = getSelectedPlan(intake?.service)
  const isOwner = user?.role === 'owner'
  const isFreePlan = selectedPlan.price === 0 || isOwner

  const handleContinue = async () => {
    if (!agreed) return
    setProcessing(true)

    await new Promise((r) => setTimeout(r, isFreePlan ? 1000 : 1800))
    setProcessing(false)
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">
            {isOwner ? 'Owner Access' : isFreePlan ? 'Unlock Planner' : 'Upgrade Checkout'}
          </p>
          <h1 className="text-white text-4xl font-black mb-3">
            {isOwner ? 'Owner bypass enabled' : isFreePlan ? 'Review Your Build Setup' : 'Complete Your Upgrade'}
          </h1>
          <p className="text-zinc-400">
            {isOwner
              ? 'You are signed in as the owner, so premium checkout is bypassed for this account.'
              : isFreePlan
              ? 'You are about to unlock your personalized build dashboard.'
              : 'One-time payment for a deeper planning layer on top of your build dashboard.'}
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="bg-[#16161a] border border-[#2a2a30] rounded-2xl p-6 sticky top-6">
              <h2 className="text-white font-bold text-lg mb-4">Summary</h2>

              {intake && (
                <div className="mb-4 p-3 bg-[#0f0f12] rounded-xl">
                  <p className="text-zinc-500 text-xs mb-1">Your Vehicle</p>
                  <p className="text-white font-medium">{intake.year} {intake.make} {intake.model}</p>
                  {intake.trim && <p className="text-zinc-400 text-sm">{intake.trim}</p>}
                  <p className="text-purple-400 text-sm mt-1">{intake.focus} focused build</p>
                </div>
              )}

              <div className="border-t border-[#2a2a30] pt-4 mb-4">
                <div className="flex justify-between items-start mb-2 gap-3">
                  <div>
                    <p className="text-white font-semibold">{selectedPlan.name}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{selectedPlan.description}</p>
                  </div>
                  <p className="text-purple-400 font-bold text-lg">
                    {isFreePlan ? 'Free' : `$${selectedPlan.price}`}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {[
                  'Vehicle-based recommendations',
                  'Top ranked parts for your build direction',
                  'Build phases and budget-aware planning',
                  'Visualizer and parts tracking dashboard',
                  isFreePlan ? 'Optional premium upgrades later' : 'Additional premium planning depth',
                  'Affiliate-friendly path to parts research and buying',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-purple-600/30 flex items-center justify-center shrink-0">
                      <svg className="w-2.5 h-2.5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <p className="text-zinc-400 text-sm">{item}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#2a2a30] pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-white font-bold">Total</p>
                  <p className="text-white font-black text-2xl">{isFreePlan ? '$0' : `$${selectedPlan.price}`}</p>
                </div>
                <p className="text-zinc-600 text-xs mt-1">
                  {isFreePlan ? 'No payment required to unlock the dashboard' : 'One-time payment · no subscription'}
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="bg-[#16161a] border border-[#2a2a30] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <h2 className="text-white font-bold text-lg">
                  {isFreePlan ? 'Confirm & Continue' : 'Payment Details'}
                </h2>
                <span className="ml-auto text-xs text-zinc-500 flex items-center gap-1">
                  <span>🔒</span> SSL Secured
                </span>
              </div>

              {isFreePlan ? (
                <div className="space-y-5 mb-6">
                  <div className="rounded-xl border border-purple-500/20 bg-purple-600/5 p-4">
                    <h3 className="text-white font-semibold mb-2">You&apos;re starting with the core product</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      After this step, you&apos;ll land in your build dashboard with recommendations, phased planning,
                      parts tracking, and a visualizer for your current setup.
                    </p>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      defaultValue={intake?.email || ''}
                      placeholder="your@email.com"
                      className="w-full bg-[#0f0f12] border border-[#2a2a30] focus:border-purple-500 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  <div className="rounded-xl border border-purple-500/20 bg-purple-600/5 p-4">
                    <h3 className="text-white font-semibold mb-2">This is an optional premium layer</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      The dashboard experience remains product-led. This upgrade adds more curated planning depth for your build.
                    </p>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      defaultValue={intake?.email || ''}
                      placeholder="your@email.com"
                      className="w-full bg-[#0f0f12] border border-[#2a2a30] focus:border-purple-500 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Card Details</label>
                    <div className="bg-[#0f0f12] border border-[#2a2a30] rounded-xl px-4 py-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="flex-1 bg-transparent text-white placeholder-zinc-600 text-sm outline-none"
                        />
                        <div className="flex items-center gap-1 text-zinc-600 text-xs">
                          <span>💳</span>
                          <span>VISA</span>
                          <span>MC</span>
                          <span>AMEX</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM / YY"
                        maxLength={7}
                        className="w-full bg-[#0f0f12] border border-[#2a2a30] focus:border-purple-500 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">CVC</label>
                      <input
                        type="text"
                        placeholder="123"
                        maxLength={4}
                        className="w-full bg-[#0f0f12] border border-[#2a2a30] focus:border-purple-500 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Name on Card</label>
                    <input
                      type="text"
                      defaultValue={intake?.name || ''}
                      placeholder="Full name"
                      className="w-full bg-[#0f0f12] border border-[#2a2a30] focus:border-purple-500 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <div
                  onClick={() => setAgreed(!agreed)}
                  className={`w-5 h-5 rounded border shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                    agreed ? 'bg-purple-600 border-purple-600' : 'border-[#2a2a30]'
                  }`}
                >
                  {agreed && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {isOwner
                    ? 'I understand this owner account bypass is for internal testing and site management. I agree to the '
                    : isFreePlan
                    ? 'I understand Modvora is a digital planning tool and that optional premium upgrades may be offered later. I agree to the '
                    : 'I understand this is a digital product upgrade and that Modvora does not sell physical parts directly. I agree to the '}
                  <span className="text-purple-400 hover:text-purple-300 cursor-pointer">Terms of Service</span> and{' '}
                  <span className="text-purple-400 hover:text-purple-300 cursor-pointer">Refund Policy</span>.
                </p>
              </label>

              <button
                onClick={handleContinue}
                disabled={!agreed || processing}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                  agreed && !processing
                    ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    {isFreePlan ? 'Opening Dashboard...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <span>🔒</span>
                    {isOwner ? 'Owner Bypass → Open Dashboard' : isFreePlan ? 'Open My Build Dashboard' : `Pay $${selectedPlan.price} · Unlock Premium Planning`}
                  </>
                )}
              </button>

              <p className="text-center text-zinc-600 text-xs mt-4">
                {isOwner
                  ? 'Owner account detected. Payment is skipped for this account.'
                  : isFreePlan
                  ? 'No subscription. No credit card required for the free planner entry point.'
                  : 'One-time payment. No subscription. You keep access to your build dashboard.'}
              </p>

              {!isFreePlan && (
                <div className="flex items-center justify-center gap-2 mt-4 text-zinc-600 text-xs">
                  <span>Powered by</span>
                  <span className="font-bold text-zinc-400">Stripe</span>
                  <span>·</span>
                  <span>256-bit SSL</span>
                  <span>·</span>
                  <span>PCI Compliant</span>
                </div>
              )}
            </div>

            <p className="text-center text-zinc-600 text-xs mt-4">
              Questions?{' '}
              <Link href="/contact" className="text-purple-400 hover:text-purple-300">
                Contact us
              </Link>
              {' '}before continuing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
