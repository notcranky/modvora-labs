'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { IntakeData } from '@/lib/types'

const modCategories = [
  { id: 'lowered', label: 'Lowered', icon: '📉', description: 'Coilovers / Springs' },
  { id: 'wheels', label: 'Wheels', icon: '🛞', description: 'Aftermarket Wheels' },
  { id: 'tint', label: 'Tint', icon: '🕶️', description: 'Window Tint' },
  { id: 'lip', label: 'Aero', icon: '🏎️', description: 'Lip / Splitter' },
  { id: 'exhaust', label: 'Exhaust', icon: '🔊', description: 'Cat-Back' },
  { id: 'spoiler', label: 'Spoiler', icon: '🏁', description: 'Rear Wing' },
]

const photoCache = new Map<string, string[]>()

function StatusDot({ tone }: { tone: 'loading' | 'good' | 'warn' }) {
  const className = tone === 'loading'
    ? 'bg-purple-500 animate-pulse'
    : tone === 'warn'
    ? 'bg-amber-400'
    : 'bg-emerald-400'

  return <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
}

function PhotoShowcase({
  photos,
  loading,
  label,
  carLabel,
}: {
  photos: string[]
  loading: boolean
  label: string
  carLabel: string
}) {
  const [errored, setErrored] = useState<Set<number>>(new Set())
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    setErrored(new Set())
    setSelectedIndex(0)
  }, [photos])

  const validPhotos = photos
    .map((url, i) => ({ url, index: i }))
    .filter((photo) => !errored.has(photo.index))

  const boundedIndex = Math.min(selectedIndex, Math.max(validPhotos.length - 1, 0))
  const heroPhoto = validPhotos[boundedIndex] ?? validPhotos[0] ?? null
  const heroOrdinal = heroPhoto ? validPhotos.findIndex((photo) => photo.index === heroPhoto.index) + 1 : 0

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_320px]">
        <div className="space-y-3">
          <div className="aspect-[16/10] rounded-[28px] border border-[#2a2a30] bg-gradient-to-br from-[#141419] via-[#101015] to-[#0d0d11] animate-pulse" />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/3] rounded-2xl border border-[#222228] bg-[#111116] animate-pulse" />
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border border-[#23232a] bg-[#101014] p-5 animate-pulse min-h-[240px]" />
      </div>
    )
  }

  if (!validPhotos.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-[#2a2a30] bg-gradient-to-br from-[#121217] to-[#0d0d11] px-6 py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2a2a30] bg-[#16161a] text-2xl">
          📸
        </div>
        <p className="mb-1 font-semibold text-white">No inspiration photos found yet</p>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-zinc-500">
          Try another mod combination or switch back to the stock view for a cleaner baseline shot.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_320px]">
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-[30px] border border-[#2a2a30] bg-[#0f0f12] shadow-[0_30px_100px_rgba(0,0,0,0.38)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_45%)]" />
          <div className="aspect-[16/10] overflow-hidden bg-[#111116] sm:aspect-[16/9]">
            {heroPhoto && (
              <img
                src={heroPhoto.url}
                alt={`${label} inspiration photo ${heroPhoto.index + 1}`}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                loading="lazy"
                onError={() => setErrored((prev) => new Set(Array.from(prev).concat(heroPhoto.index)))}
              />
            )}
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/18 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-[0.24em] text-zinc-300/85">Best match from the set</p>
                <h4 className="text-base font-semibold text-white sm:text-lg">{label}</h4>
                <p className="mt-1 text-xs text-zinc-300/80 sm:text-sm">Curated to favor cleaner, larger, more relevant exterior shots.</p>
              </div>
              <div className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs font-medium text-zinc-200 backdrop-blur-sm">
                Hero #{heroOrdinal} of {validPhotos.length}
              </div>
            </div>
          </div>
        </div>

        {validPhotos.length > 1 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {validPhotos.slice(0, 8).map((photo, idx) => {
              const active = photo.index === heroPhoto?.index
              return (
                <button
                  key={photo.index}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`group relative overflow-hidden rounded-2xl border bg-[#111116] text-left transition-all duration-200 ${
                    active
                      ? 'border-purple-400/70 ring-1 ring-purple-500/40 shadow-[0_10px_30px_rgba(168,85,247,0.16)]'
                      : 'border-[#2a2a30] hover:-translate-y-0.5 hover:border-purple-500/35'
                  }`}
                  aria-label={`Show inspiration photo ${photo.index + 1}`}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={photo.url}
                      alt={`${label} thumbnail ${photo.index + 1}`}
                      className={`h-full w-full object-cover transition-transform duration-300 ${active ? 'scale-[1.03]' : 'group-hover:scale-105'}`}
                      loading="lazy"
                      onError={() => setErrored((prev) => new Set(Array.from(prev).concat(photo.index)))}
                    />
                  </div>
                  <div className={`absolute inset-0 transition-colors ${active ? 'bg-purple-500/10' : 'bg-black/0 group-hover:bg-black/8'}`} />
                  <div className="absolute left-2 top-2 rounded-full border border-white/10 bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-zinc-100 backdrop-blur-sm">
                    {active ? 'Selected' : `Shot ${idx + 1}`}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-[30px] border border-[#23232a] bg-[linear-gradient(180deg,#121218_0%,#0d0d11_100%)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-purple-300/80">Gallery notes</p>
            <h4 className="mt-1 text-lg font-semibold text-white">What to look for</h4>
          </div>
          <div className="rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-200">
            {validPhotos.length} curated picks
          </div>
        </div>

        <div className="space-y-3 text-sm text-zinc-300">
          {[
            { title: 'Best hero first', body: 'The lead image is the strongest overall match from the search set, not just the first result.' },
            { title: 'Cleaner exterior bias', body: 'Tiny, junky, interior-heavy, wallpaper-like, and duplicate results get pushed down or filtered out.' },
            { title: 'Use thumbnails to compare', body: 'Flip through the gallery and watch for wheel fitment, ride height, aero balance, and overall stance.' },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
              <p className="font-semibold text-white">{item.title}</p>
              <p className="mt-1 leading-relaxed text-zinc-400">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-[#23232a] bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Current target</p>
          <p className="mt-2 text-base font-semibold text-white">{carLabel}</p>
          <p className="mt-1 text-sm text-zinc-400">{label}</p>
        </div>
      </div>
    </div>
  )
}

interface CarVisualizerProps {
  intake: IntakeData
}

export default function CarVisualizer({ intake }: CarVisualizerProps) {
  const [activeMods, setActiveMods] = useState<Set<string>>(new Set())
  const [view, setView] = useState<'stock' | 'modified'>('stock')

  const [stockLoading, setStockLoading] = useState(true)
  const [stockError, setStockError] = useState(false)

  const [modPhotos, setModPhotos] = useState<string[]>([])
  const [modPhotosLoading, setModPhotosLoading] = useState(false)
  const [modPhotosError, setModPhotosError] = useState<string | null>(null)

  const requestIdRef = useRef(0)

  const carImageSrc = `/api/car-image?year=${intake.year}&make=${encodeURIComponent(intake.make)}&model=${encodeURIComponent(intake.model)}&trim=${encodeURIComponent(intake.trim || '')}`

  const sortedActiveMods = useMemo(() => Array.from(activeMods).sort(), [activeMods])
  const modsParam = sortedActiveMods.join(',')
  const cacheKey = `${intake.year}-${intake.make}-${intake.model}-${intake.trim || ''}-${modsParam}`

  const fetchModPhotos = useCallback(async (mods: string[], signal?: AbortSignal) => {
    if (!mods.length) {
      setModPhotos([])
      setModPhotosError(null)
      setModPhotosLoading(false)
      return
    }

    const key = `${intake.year}-${intake.make}-${intake.model}-${intake.trim || ''}-${mods.join(',')}`

    if (photoCache.has(key)) {
      setModPhotos(photoCache.get(key) ?? [])
      setModPhotosError(null)
      setModPhotosLoading(false)
      return
    }

    const requestId = ++requestIdRef.current
    setModPhotosLoading(true)
    setModPhotosError(null)

    try {
      const res = await fetch(
        `/api/car-photos?year=${intake.year}&make=${encodeURIComponent(intake.make)}&model=${encodeURIComponent(intake.model)}&trim=${encodeURIComponent(intake.trim || '')}&mods=${mods.join(',')}`,
        { signal, cache: 'force-cache' }
      )

      if (!res.ok) throw new Error('Failed to load inspiration photos')

      const data = await res.json()
      const photos = Array.isArray(data.photos) ? data.photos : []
      photoCache.set(key, photos)

      if (requestId === requestIdRef.current) {
        setModPhotos(photos)
        setModPhotosError(photos.length ? null : 'No inspiration photos found for this combination yet.')
      }
    } catch {
      if (signal?.aborted) return
      if (requestId === requestIdRef.current) {
        setModPhotos([])
        setModPhotosError('Could not load inspiration photos right now. Try another mod combination.')
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setModPhotosLoading(false)
      }
    }
  }, [intake.year, intake.make, intake.model, intake.trim])

  const toggleMod = (id: string) => {
    setActiveMods((prev) => {
      const next = new Set(Array.from(prev))
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setView('modified')
  }

  useEffect(() => {
    const img = new Image()
    img.src = carImageSrc
  }, [carImageSrc])

  useEffect(() => {
    setStockLoading(true)
    setStockError(false)
    setModPhotos([])
    setModPhotosError(null)
    setModPhotosLoading(false)
    setActiveMods(new Set())
    setView('stock')
  }, [intake.year, intake.make, intake.model, intake.trim])

  useEffect(() => {
    if (view !== 'modified') return

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      fetchModPhotos(sortedActiveMods, controller.signal)
    }, 150)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [view, cacheKey, sortedActiveMods, fetchModPhotos])

  const activeModObjects = sortedActiveMods
    .map((id) => modCategories.find((mod) => mod.id === id))
    .filter((mod): mod is typeof modCategories[number] => Boolean(mod))

  const activeModLabel = activeModObjects.map((mod) => mod.label).join(', ')
  const carLabel = `${intake.year} ${intake.make} ${intake.model}`

  const previewPoints = view === 'stock'
    ? [
        'Factory-style exterior reference shot',
        'Useful baseline before choosing mods',
        'Best for comparing wheel gap and body lines',
      ]
    : [
        activeModObjects.length ? `${activeModObjects.length} selected visual mods` : 'No mods selected yet',
        'Real-owner inspiration instead of mockups',
        'Prioritizes cleaner, larger exterior images',
      ]

  const youtubeLinks = [
    { label: 'Stance & exterior build', query: `${intake.year} ${intake.make} ${intake.model} modified stance build` },
    { label: 'Performance build tour', query: `${intake.year} ${intake.make} ${intake.model} performance build walk around` },
    { label: 'Before & after', query: `${intake.year} ${intake.make} ${intake.model} before after modification` },
    { label: 'Exterior mods installed', query: `${intake.year} ${intake.make} ${intake.model} exterior mods installed` },
  ]

  return (
    <div className="overflow-hidden rounded-[32px] border border-[#2a2a30] bg-[linear-gradient(180deg,#16161a_0%,#101014_100%)] shadow-[0_24px_90px_rgba(0,0,0,0.32)]">
      <div className="border-b border-[#24242a] bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.14),transparent_38%)] px-6 pb-5 pt-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.22em] text-purple-300">Visual planning</p>
            <h3 className="text-2xl font-semibold text-white">{carLabel}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
              {view === 'stock'
                ? 'Start from a clean baseline, then switch to modified builds when you want to compare the overall look before buying parts.'
                : activeModLabel
                ? `Browsing real builds that best match ${activeModLabel.toLowerCase()}.`
                : 'Select a mod below to explore real owner builds and compare the overall vibe.'}
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-2xl border border-[#2a2a30] bg-[#0f0f12] p-1.5">
            <button
              onClick={() => setView('stock')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${view === 'stock' ? 'bg-purple-600 text-white shadow-[0_10px_30px_rgba(168,85,247,0.25)]' : 'text-zinc-400 hover:text-white'}`}
            >
              Stock reference
            </button>
            <button
              onClick={() => setView('modified')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${view === 'modified' ? 'bg-purple-600 text-white shadow-[0_10px_30px_rgba(168,85,247,0.25)]' : 'text-zinc-400 hover:text-white'}`}
            >
              Modified gallery
              {activeMods.size > 0 && <span className="ml-1.5 rounded-full bg-purple-500/40 px-1.5 py-0.5">{activeMods.size}</span>}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {previewPoints.map((point) => (
            <div key={point} className="rounded-full border border-[#2a2a30] bg-black/20 px-3 py-1.5 text-xs text-zinc-300">
              {point}
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex flex-wrap items-center gap-2">
            <StatusDot tone={view === 'modified' ? (modPhotosLoading ? 'loading' : modPhotosError ? 'warn' : 'good') : stockLoading ? 'loading' : stockError ? 'warn' : 'good'} />
            <p className="text-sm text-zinc-300">
              {view === 'stock'
                ? stockLoading
                  ? 'Loading best stock reference photo…'
                  : stockError
                  ? 'Stock photo unavailable for this exact car'
                  : 'Stock baseline ready'
                : modPhotosLoading
                ? `Curating the best inspiration photos for ${carLabel}…`
                : modPhotosError
                ? 'Inspiration gallery hit a snag'
                : 'Modified gallery ready'}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 lg:justify-end">
            {activeModObjects.length > 0 ? activeModObjects.map((mod) => (
              <span key={mod.id} className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1 text-xs text-purple-100">
                <span>{mod.icon}</span>
                <span>{mod.label}</span>
              </span>
            )) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a30] bg-[#0f0f12] px-3 py-1 text-xs text-zinc-400">
                Pick one or more mods to build a gallery
              </span>
            )}
          </div>
        </div>

        {view === 'stock' ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_320px]">
            <div className="relative overflow-hidden rounded-[30px] border border-[#2a2a30] bg-[#0f0f12] shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_40%)]" />
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#101014] via-[#0e0e12] to-[#121219] sm:aspect-[16/9]">
                {stockLoading && !stockError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0f0f12]">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                    <p className="text-sm text-zinc-500">Loading reference photo...</p>
                  </div>
                )}

                {!stockError && (
                  <img
                    src={carImageSrc}
                    alt={carLabel}
                    className="h-full w-full object-cover"
                    style={{ display: stockLoading ? 'none' : 'block' }}
                    onLoad={() => setStockLoading(false)}
                    onError={() => {
                      setStockError(true)
                      setStockLoading(false)
                    }}
                  />
                )}

                {!stockLoading && !stockError && (
                  <>
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 py-4 sm:px-5">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-zinc-300/80">Stock Reference</p>
                          <p className="text-sm font-semibold text-white sm:text-base">Use this as your baseline before committing to mods</p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs font-medium text-zinc-200 backdrop-blur-sm">
                          {carLabel}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {stockError && (
                <div className="flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#121217] to-[#0d0d11] px-6 py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2a2a30] bg-[#16161a] text-3xl">🚘</div>
                  <p className="font-bold text-white">{carLabel}</p>
                  <p className="max-w-sm text-sm text-zinc-500">
                    We couldn&apos;t find a clean stock photo for this exact setup yet. You can still browse modified inspiration below.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[30px] border border-[#23232a] bg-[linear-gradient(180deg,#121218_0%,#0d0d11_100%)] p-5">
              <p className="text-[11px] uppercase tracking-[0.22em] text-purple-300/80">Reference tips</p>
              <h4 className="mt-1 text-lg font-semibold text-white">How to use the stock shot</h4>
              <div className="mt-4 space-y-3 text-sm text-zinc-400">
                <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                  Compare wheel gap, fender height, and body line proportions before you go lower.
                </div>
                <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                  Jump to the modified gallery when you want owner-built examples instead of a clean factory look.
                </div>
                <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                  Mix multiple toggles below to hunt for the closest visual match to the build you have in mind.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {activeMods.size === 0 ? (
              <div className="rounded-[28px] border border-dashed border-[#2a2a30] bg-gradient-to-br from-[#121217] to-[#0d0d11] px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2a2a30] bg-[#16161a] text-2xl">✨</div>
                <p className="font-semibold text-white">Choose a mod to explore real builds</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
                  We&apos;ll pull in real photos of {intake.make} {intake.model} builds so you can compare stance, wheel fitment, and general style before you buy parts.
                </p>
              </div>
            ) : (
              <>
                {modPhotosError && !modPhotosLoading && (
                  <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    {modPhotosError}
                  </div>
                )}
                <PhotoShowcase
                  photos={modPhotos}
                  loading={modPhotosLoading}
                  label={`${intake.make} ${intake.model} · ${activeModLabel}`}
                  carLabel={carLabel}
                />
              </>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[#24242a] bg-[#0c0c10] px-6 py-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Toggle mods to compare the vibe</p>
            <h4 className="mt-1 text-lg font-semibold text-white">Build your look</h4>
          </div>
          <p className="max-w-xl text-sm text-zinc-500">Combine multiple toggles to bias the search toward builds that feel closer to your target setup.</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {modCategories.map((mod) => {
            const active = activeMods.has(mod.id)
            return (
              <button
                key={mod.id}
                onClick={() => toggleMod(mod.id)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3.5 transition-all duration-200 ${
                  active
                    ? 'border-purple-500/60 bg-purple-600/18 text-white shadow-[0_0_0_1px_rgba(168,85,247,0.12)]'
                    : 'border-[#2a2a30] bg-[#0f0f12] text-zinc-400 hover:-translate-y-0.5 hover:border-purple-500/30 hover:text-zinc-200'
                }`}
              >
                <span className="text-xl">{mod.icon}</span>
                <span className="text-xs font-semibold">{mod.label}</span>
                <span className={`text-[10px] ${active ? 'text-purple-100/75' : 'text-zinc-600'}`}>{mod.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="border-t border-[#2a2a30] px-6 py-5">
        <details className="group rounded-2xl border border-[#23232a] bg-black/15 p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Extra research</p>
              <p className="mt-1 text-sm font-semibold text-white">Watch examples on YouTube</p>
            </div>
            <span className="rounded-full border border-[#2a2a30] bg-[#0f0f12] px-3 py-1 text-xs text-zinc-400 transition-colors group-open:text-zinc-200">Optional</span>
          </summary>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {youtubeLinks.map((item, i) => (
              <a
                key={i}
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.query)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-[#2a2a30] bg-[#0f0f12] px-3 py-2.5 text-xs text-zinc-300 transition-all hover:border-red-500/30 hover:bg-red-600/10 hover:text-white"
              >
                <svg className="h-3.5 w-3.5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span className="truncate">{item.label}</span>
              </a>
            ))}
          </div>
        </details>
      </div>
    </div>
  )
}
