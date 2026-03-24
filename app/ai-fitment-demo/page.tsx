'use client'

import { FormEvent, useState } from 'react'
import Button from '@/components/ui/Button'

type ApiResponse = {
  vehicle: {
    year: number
    make: string
    model: string
    trim?: string
    engine?: string
    drivetrain?: string
  } | null
  intent: {
    categories: string[]
    primaryCategory?: string
    subtype?: string
    intentTypes: string[]
    primaryIntentType: string
    preferredResultTypes: string[]
    suppressedResultTypes: string[]
    desiredTraits: string[]
    preferredStyleTraits: string[]
    requestedKeywords: string[]
    requestedSubtypes: string[]
    requestedPhrases: string[]
    exclusions: string[]
    maxBudget?: number
    needsQuiet: boolean
    wantsAggressiveSound: boolean
    requiresExactProductBias: boolean
  }
  results: Array<{
    score: number
    explanation: string[]
    fitmentNotes: string[]
    source: {
      url?: string
      label: string
      exactness: 'exact-product' | 'vehicle-page' | 'brand-page' | 'lookup'
    }
    part: {
      id: string
      name: string
      brand: string
      category: string
      sku: string
      summary: string
      priceRange: { min: number; max: number }
      sourceUrl?: string
    }
  }>
  warnings: string[]
  constraints: string[]
  vehicleNotes: string[]
}

const presets = [
  {
    label: '2018 Honda Civic Si / intake + sound',
    vehicle: { year: 2018, make: 'Honda', model: 'Civic Si', trim: 'Sedan' },
    query: 'I want a better intake sound under $500 for my daily',
  },
  {
    label: '2014 Durango / interior LEDs',
    vehicle: { year: 2014, make: 'Dodge', model: 'Durango', trim: 'Limited' },
    query: 'Show me interior LED lights for my Durango',
  },
  {
    label: '2014 Durango / CarPlay upgrade',
    vehicle: { year: 2014, make: 'Dodge', model: 'Durango', trim: 'Limited' },
    query: 'I want CarPlay for road trips in my Durango',
  },
  {
    label: '2014 Durango / floor mats',
    vehicle: { year: 2014, make: 'Dodge', model: 'Durango', trim: 'Limited' },
    query: 'Best floor mats for kids and winter mess',
  },
  {
    label: '2014 Durango / hitch + towing',
    vehicle: { year: 2014, make: 'Dodge', model: 'Durango', trim: 'Limited' },
    query: 'Need a hitch and towing parts for my Durango',
  },
  {
    label: '2014 Durango / steering wheel replacement',
    vehicle: { year: 2014, make: 'Dodge', model: 'Durango', trim: 'Limited' },
    query: 'I need a replacement steering wheel for my Durango, not a cover',
  },
  {
    label: '2014 Durango / interior trim styling',
    vehicle: { year: 2014, make: 'Dodge', model: 'Durango', trim: 'Limited' },
    query: 'What interior trim kit or steering wheel trim would make the inside look nicer without turning it into a utility build?',
  },
]

export default function AiFitmentDemoPage() {
  const [vehicle, setVehicle] = useState({ year: '2018', make: 'Honda', model: 'Civic Si', trim: 'Sedan' })
  const [query, setQuery] = useState('I want a better intake sound under $500 for my daily')
  const [result, setResult] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/search-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle: {
            year: Number(vehicle.year),
            make: vehicle.make,
            model: vehicle.model,
            trim: vehicle.trim,
          },
          query,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="text-purple-400 text-sm font-medium tracking-widest uppercase mb-3">Grounded AI demo</p>
          <h1 className="text-4xl font-bold text-white mb-4">Database-only fitment search helper</h1>
          <p className="text-zinc-400 max-w-3xl leading-relaxed">
            This MVP treats natural language as an input convenience only. It converts the request into structured intent,
            then returns only parts from the local demo database that have explicit fitment rows for the selected vehicle.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-[#2a2a30] bg-[#111113] p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm text-zinc-300">
                <span className="block mb-2">Year</span>
                <input className="w-full rounded-lg border border-[#2a2a30] bg-[#0d0d0f] px-3 py-2 text-white" value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="block mb-2">Make</span>
                <input className="w-full rounded-lg border border-[#2a2a30] bg-[#0d0d0f] px-3 py-2 text-white" value={vehicle.make} onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })} />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="block mb-2">Model</span>
                <input className="w-full rounded-lg border border-[#2a2a30] bg-[#0d0d0f] px-3 py-2 text-white" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} />
              </label>
              <label className="text-sm text-zinc-300">
                <span className="block mb-2">Trim</span>
                <input className="w-full rounded-lg border border-[#2a2a30] bg-[#0d0d0f] px-3 py-2 text-white" value={vehicle.trim} onChange={(e) => setVehicle({ ...vehicle, trim: e.target.value })} />
              </label>
            </div>

            <label className="block text-sm text-zinc-300">
              <span className="block mb-2">Natural-language request</span>
              <textarea
                className="min-h-[120px] w-full rounded-lg border border-[#2a2a30] bg-[#0d0d0f] px-3 py-2 text-white"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" size="md" disabled={loading}>{loading ? 'Searching…' : 'Run grounded search'}</Button>
            </div>

            <div className="pt-2">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Quick presets</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="rounded-full border border-[#2a2a30] px-3 py-1.5 text-xs text-zinc-300 hover:border-purple-500 hover:text-white"
                    onClick={() => {
                      setVehicle({
                        year: String(preset.vehicle.year),
                        make: preset.vehicle.make,
                        model: preset.vehicle.model,
                        trim: preset.vehicle.trim,
                      })
                      setQuery(preset.query)
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </form>

          <div className="rounded-2xl border border-[#2a2a30] bg-[#111113] p-6">
            {!result && !error && (
              <div className="text-zinc-400 text-sm leading-relaxed">
                Submit a request to see the derived intent, guardrails, and fitment-safe results.
              </div>
            )}

            {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

            {result && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-white font-semibold mb-2">Structured interpretation</h2>
                  <div className="text-sm text-zinc-300 space-y-1">
                    <div>Vehicle match: {result.vehicle ? `${result.vehicle.year} ${result.vehicle.make} ${result.vehicle.model}` : 'No match'}</div>
                    <div>Categories: {result.intent.categories.length ? result.intent.categories.join(', ') : 'none detected'}</div>
                    <div>Primary lane: {result.intent.primaryIntentType}{result.intent.primaryCategory ? ` · ${result.intent.primaryCategory}` : ''}{result.intent.subtype ? ` · ${result.intent.subtype}` : ''}</div>
                    <div>Intent types: {result.intent.intentTypes.length ? result.intent.intentTypes.join(', ') : 'none detected'}</div>
                    <div>Traits: {result.intent.desiredTraits.length ? result.intent.desiredTraits.join(', ') : 'none detected'}</div>
                    <div>Style traits: {result.intent.preferredStyleTraits.length ? result.intent.preferredStyleTraits.join(', ') : 'none detected'}</div>
                    <div>Direct subtypes: {result.intent.requestedSubtypes.length ? result.intent.requestedSubtypes.join(', ') : 'none detected'}</div>
                    <div>Preferred result types: {result.intent.preferredResultTypes.length ? result.intent.preferredResultTypes.join(', ') : 'none'}</div>
                    <div>Suppressed result types: {result.intent.suppressedResultTypes.length ? result.intent.suppressedResultTypes.join(', ') : 'none'}</div>
                    <div>Matched phrases: {result.intent.requestedPhrases.length ? result.intent.requestedPhrases.join(', ') : 'none detected'}</div>
                    <div>Exclusions: {result.intent.exclusions.length ? result.intent.exclusions.join(', ') : 'none detected'}</div>
                    <div>Budget cap: {result.intent.maxBudget ? `$${result.intent.maxBudget}` : 'not specified'}</div>
                  </div>
                </div>

                {result.vehicleNotes.length > 0 && (
                  <div>
                    <h2 className="text-white font-semibold mb-2">Vehicle notes</h2>
                    <ul className="space-y-2 text-sm text-zinc-300 list-disc pl-5">
                      {result.vehicleNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h2 className="text-white font-semibold mb-2">Guardrails</h2>
                  <ul className="space-y-2 text-sm text-zinc-300 list-disc pl-5">
                    {result.constraints.map((constraint) => (
                      <li key={constraint}>{constraint}</li>
                    ))}
                  </ul>
                </div>

                {result.warnings.length > 0 && (
                  <div>
                    <h2 className="text-white font-semibold mb-2">Warnings</h2>
                    <ul className="space-y-2 text-sm text-amber-200 list-disc pl-5">
                      {result.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h2 className="text-white font-semibold mb-3">Fitment-safe results</h2>
                  <div className="space-y-3">
                    {result.results.map((item) => (
                      <div key={item.part.id} className="rounded-xl border border-[#2a2a30] bg-[#0d0d0f] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="text-white font-medium">{item.part.brand} {item.part.name}</div>
                            <div className="text-xs text-zinc-500 uppercase tracking-widest">{item.part.category} · {item.part.sku}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-purple-300">${item.part.priceRange.min}–${item.part.priceRange.max}</div>
                            <div className="text-xs text-zinc-500">Score {item.score}</div>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-400 mb-3">{item.part.summary}</p>
                        <ul className="list-disc pl-5 text-sm text-zinc-300 space-y-1 mb-3">
                          {item.explanation.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                          {item.fitmentNotes.map((line) => (
                            <li key={line}>Fitment note: {line}</li>
                          ))}
                        </ul>
                        <div className="rounded-lg border border-[#2a2a30] bg-[#111113] px-3 py-2 text-xs text-zinc-300">
                          <div className="font-medium text-zinc-200 mb-1">Source</div>
                          <div className="mb-1 text-zinc-500">Link exactness: {item.source.exactness}</div>
                          {item.source.url ? (
                            <a href={item.source.url} target="_blank" rel="noreferrer" className="text-purple-300 hover:text-purple-200 underline underline-offset-2">
                              {item.source.label}: {item.source.url}
                            </a>
                          ) : (
                            <span>{item.source.label}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {result.results.length === 0 && <p className="text-sm text-zinc-400">No matching fitment-safe parts found.</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
