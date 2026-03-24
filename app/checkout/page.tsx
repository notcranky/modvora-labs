'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { IntakeData } from '@/lib/types'
import { useAuth } from '@/hooks/useAuth'
import { getActiveVehicle, loadVehicles } from '@/lib/garage'

type Plan = {
  id: string
  name: string
  price: number
  cadence: string
  description: string
  extraCarEligible?: boolean
}

const plans: Plan[] = [
  { id: 'free', name: 'Free Tier', price: 0, cadence: 'free', description: 'Start with 1 vehicle, core recommendations, phased planning, and the build dashboard.' },
  { id: 'premium', name: 'Premium Membership', price: 9, cadence: 'month', description: 'Deeper planning, saved builds, richer recommendations, and premium tools for ongoing projects.', extraCarEligible: true },
  { id: 'consultation', name: 'Expert Consultation', price: 39, cadence: 'optional add-on', description: 'One focused human review for edge cases, tie-breakers, or tricky decisions.' },
]

function getSelectedPlan(service?: string) {
  const normalized = service?.toLowerCase() ?? ''

  if (normalized.includes('consult')) return plans.find((p) => p.id === 'consultation')!
  if (normalized.includes('premium') || normalized.includes('extra car')) return plans.find((p) => p.id === 'premium')!
  if (normalized.includes('free')) return plans.find((p) => p.id === 'free')!

  return plans[0]
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth()
  const [intake, setIntake] = useState<IntakeData | null>(null)
  const [vehicleCount, setVehicleCount] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [extraCars, setExtraCars] = useState(0)
  const [contactEmail, setContactEmail] = useState('')

  useEffect(() => {
    const activeVehicle = getActiveVehicle()
    if (activeVehicle) {
      setIntake(activeVehicle)
      setContactEmail(activeVehicle.email || '')
    }
    setVehicleCount(loadVehicles().length)
  }, [])

  const selectedPlan = useMemo(() => getSelectedPlan(intake?.service), [intake?.service])
  const isOwner = user?.role === 'owner'
  const isFreePlan = selectedPlan.price === 0 || isOwner
  const canContinue = isOwner || (agreed && contactEmail.trim().length > 0)
  const monthlyTotal = isFreePlan ? 0 : selectedPlan.price + (selectedPlan.extraCarEligible ? extraCars * 2 : 0)

  useEffect(() => {
    if (authLoading || !isOwner) return

    const timer = window.setTimeout(() => {
      window.location.href = '/dashboard'
    }, 250)

    return () => window.clearTimeout(timer)
  }, [authLoading, isOwner])

  const handleContinue = async () => {
    if (!canContinue) return
    setProcessing(true)

    await new Promise((r) => setTimeout(r, isOwner ? 200 : isFreePlan ? 450 : 900))
    setProcessing(false)
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] px-4 py-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-[#212129] bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.14),transparent_36%),linear-gradient(180deg,#141419_0%,#0e0e12_100%)] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-3">
                {isOwner ? 'Owner Access' : isFreePlan ? 'Almost There' : 'Premium Setup'}
              </p>
              <h1 className="text-white text-4xl font-black mb-3">
                {isOwner ? 'Owner bypass enabled' : isFreePlan ? 'Review your build and open the dashboard' : 'Confirm your Premium plan'}
              </h1>
              <p className="text-zinc-400 leading-relaxed max-w-2xl">
                {isOwner
                  ? 'You are signed in as the owner, so checkout is skipped for this account.'
                  : isFreePlan
                  ? 'This is just a final review step before you land in your personalized build workspace.'
                  : 'Keep the upgrade flow simple: confirm the plan, choose any extra garage slots, and continue into your workspace.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm w-full max-w-xl">
              {[
                { step: '1', label: 'Car details', done: true },
                { step: '2', label: 'Plan review', done: true },
                { step: '3', label: 'Dashboard', done: false },
              ].map((item, index) => (
                <div key={item.label} className={`rounded-2xl border p-4 ${index < 2 ? 'border-purple-500/20 bg-purple-500/10' : 'border-[#2a2a30] bg-black/20'}`}>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Step {item.step}</p>
                  <p className={`mt-2 font-semibold ${item.done ? 'text-white' : 'text-zinc-400'}`}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="sticky top-24 rounded-[28px] border border-[#23232a] bg-[linear-gradient(180deg,#141419_0%,#0f0f13_100%)] p-6">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-white font-bold text-lg">Summary</h2>
                  <p className="text-zinc-500 text-sm mt-1">What you&apos;re opening right now.</p>
                </div>
                <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs text-purple-200">
                  {isFreePlan ? 'No payment step' : 'Plan review'}
                </span>
              </div>

              {intake && (
                <div className="mb-5 rounded-2xl border border-[#2a2a30] bg-black/20 p-4">
                  <p className="text-zinc-500 text-xs mb-1">Your vehicle</p>
                  <p className="text-white font-medium">{intake.year} {intake.make} {intake.model}</p>
                  {(intake.trim || intake.engine) && (
                    <p className="text-zinc-400 text-sm mt-1">{[intake.trim, intake.engine].filter(Boolean).join(' · ')}</p>
                  )}
                  <p className="text-purple-400 text-sm mt-2">{intake.focus} focused build</p>
                </div>
              )}

              <div className="border-t border-[#2a2a30] pt-4 mb-5">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-white font-semibold">{selectedPlan.name}</p>
                    <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{selectedPlan.description}</p>
                  </div>
                  <p className="text-purple-400 font-bold text-lg whitespace-nowrap">
                    {isFreePlan ? '$0' : `$${selectedPlan.price}/${selectedPlan.cadence}`}
                  </p>
                </div>
              </div>

              {selectedPlan.extraCarEligible && !isOwner && (
                <div className="mb-5 rounded-2xl border border-[#2a2a30] bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                      <p className="text-white font-medium">Extra car slots</p>
                      <p className="text-zinc-500 text-xs">Premium includes 1 car. Add more only if you actively manage them.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setExtraCars((value) => Math.max(0, value - 1))} className="w-8 h-8 rounded-lg border border-[#2a2a30] text-zinc-300 hover:text-white">−</button>
                      <span className="w-8 text-center text-white font-semibold">{extraCars}</span>
                      <button type="button" onClick={() => setExtraCars((value) => value + 1)} className="w-8 h-8 rounded-lg border border-[#2a2a30] text-zinc-300 hover:text-white">+</button>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-xs">Added total: ${extraCars * 2}/month</p>
                </div>
              )}

              <div className="space-y-2.5 mb-5">
                {[
                  'Vehicle-based recommendations and ranked parts',
                  'A cleaner dashboard with build stages and progress tracking',
                  'Visualizer and community publishing tools',
                  isFreePlan ? 'Upgrade later only if you actually want more depth' : 'Richer planning tools for ongoing projects',
                  isOwner ? `Owner garage access unlocked · ${vehicleCount || 1} saved vehicle${(vehicleCount || 1) === 1 ? '' : 's'}` : 'Keep managing your garage from one place',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600/20 text-purple-300">✓</div>
                    <p className="text-zinc-400 text-sm">{item}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#2a2a30] pt-4 space-y-2">
                {!isFreePlan && (
                  <>
                    <div className="flex justify-between items-center text-sm text-zinc-400">
                      <p>Base plan</p>
                      <p>${selectedPlan.price}/month</p>
                    </div>
                    {selectedPlan.extraCarEligible && extraCars > 0 && (
                      <div className="flex justify-between items-center text-sm text-zinc-400">
                        <p>Extra car slots</p>
                        <p>${extraCars * 2}/month</p>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between items-center">
                  <p className="text-white font-bold">Total</p>
                  <p className="text-white font-black text-2xl">{isFreePlan ? '$0' : `$${monthlyTotal}/mo`}</p>
                </div>
                <p className="text-zinc-600 text-xs">
                  {isFreePlan ? 'No credit card required for the free entry path.' : 'Premium pricing preview for this MVP flow.'}
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="rounded-[28px] border border-[#23232a] bg-[linear-gradient(180deg,#141419_0%,#101015_100%)] p-6 sm:p-7">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <h2 className="text-white font-bold text-lg">{isFreePlan ? 'Confirm & continue' : 'Final plan check'}</h2>
                <span className="ml-auto text-xs text-zinc-500 flex items-center gap-1"><span>🔒</span> Fast path</span>
              </div>

              <div className="space-y-5 mb-6">
                <div className="rounded-2xl border border-purple-500/20 bg-purple-600/5 p-4">
                  <h3 className="text-white font-semibold mb-2">
                    {isFreePlan ? 'You’re opening the core product' : 'Keep Premium simple'}
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {isFreePlan
                      ? 'After this step, you’ll land in your build dashboard with planning, recommendations, tracking, and visual inspiration for your current car.'
                      : 'This MVP flow avoids a fake payment form. You’re confirming the plan and moving into the workspace experience instead of typing throwaway card details.'}
                  </p>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">Contact email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-[#0f0f12] border border-[#2a2a30] focus:border-purple-500 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  />
                  <p className="text-zinc-500 text-xs mt-2">
                    We use this as the contact point for your build access. {isFreePlan ? 'No billing info needed.' : 'Real billing can be wired in later without changing the rest of the product flow.'}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                    <p className="text-white font-medium">What happens next</p>
                    <p className="text-zinc-400 text-sm mt-2 leading-relaxed">You go straight into your dashboard so the planner feels immediate, not blocked by busywork.</p>
                  </div>
                  <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                    <p className="text-white font-medium">Need to change something?</p>
                    <p className="text-zinc-400 text-sm mt-2 leading-relaxed">You can still edit your car, goals, or chosen path before continuing.</p>
                  </div>
                </div>
              </div>

              {!isOwner && (
                <label className="flex items-start gap-3 mb-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-[#2a2a30] bg-[#0f0f12] text-purple-600 focus:ring-2 focus:ring-purple-500/40 focus:ring-offset-0"
                  />
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {isFreePlan
                      ? 'I understand Modvora is a digital planning tool and that Premium membership and extra car slots are optional upgrades.'
                      : 'I understand this MVP step confirms a digital planning product, and physical parts are not sold directly through this flow.'}{' '}
                    I agree to the <span className="text-purple-400">Terms of Service</span> and <span className="text-purple-400">Refund Policy</span>.
                  </p>
                </label>
              )}

              {isOwner && (
                <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                  <p className="text-white font-semibold mb-1">Owner fast lane enabled</p>
                  <p className="text-zinc-400 text-sm">Checkout confirmation is skipped for the owner account. Sending you straight to the dashboard.</p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Link href="/intake" className="sm:flex-1 rounded-xl border border-[#2a2a30] px-5 py-4 text-center font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">
                  Edit build details
                </Link>
                <button
                  onClick={handleContinue}
                  disabled={!canContinue || processing}
                  className={`sm:flex-[1.2] py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                    canContinue && !processing
                      ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {processing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                      {isFreePlan ? 'Opening Dashboard...' : 'Opening Premium Workspace...'}
                    </>
                  ) : (
                    <>
                      <span>→</span>
                      {isOwner ? 'Owner Bypass · Open Dashboard' : isFreePlan ? 'Open My Build Dashboard' : `Continue with Premium · $${monthlyTotal}/mo`}
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-zinc-600 text-xs mt-4">
                {isOwner
                  ? 'Owner account detected. Payment is skipped for this account.'
                  : isFreePlan
                  ? 'This path is intentionally lightweight so customers get to value faster.'
                  : 'Premium confirmation stays lightweight here so the product experience can be tested end-to-end.'}
              </p>
            </div>

            <p className="text-center text-zinc-600 text-xs mt-4">
              Questions? <Link href="/contact" className="text-purple-400 hover:text-purple-300">Contact us</Link> before continuing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
