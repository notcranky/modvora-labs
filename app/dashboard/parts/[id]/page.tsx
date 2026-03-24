'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { partDetails, PartDetail, SpecificProduct } from '@/lib/specific-parts'
import { IntakeData } from '@/lib/types'
import { BuildItemStatus, getActiveVehicle, loadBuildTracker, loadProductSelections, saveBuildTrackerItem, saveProductSelection, SavedVehicle } from '@/lib/garage'

const difficultyConfig: Record<string, { label: string; color: string; bg: string; border: string; bars: number; desc: string }> = {
  'bolt-on':    { label: 'Bolt-On DIY',  color: 'text-green-400',  bg: 'bg-green-500',  border: 'border-green-500/30',  bars: 1, desc: 'Anyone can do this with basic hand tools' },
  moderate:     { label: 'Moderate',     color: 'text-yellow-400', bg: 'bg-yellow-500', border: 'border-yellow-500/30', bars: 2, desc: 'Some mechanical experience recommended' },
  advanced:     { label: 'Advanced',     color: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-500/30', bars: 3, desc: 'Experienced DIYer or home garage setup needed' },
  professional: { label: 'Professional', color: 'text-red-400',    bg: 'bg-red-500',    border: 'border-red-500/30',    bars: 4, desc: 'Recommend a professional shop install' },
}

const tagColors = [
  'bg-purple-500/15 text-purple-300 border-purple-500/25',
  'bg-blue-500/15 text-blue-300 border-blue-500/25',
  'bg-green-500/15 text-green-300 border-green-500/25',
  'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
  'bg-orange-500/15 text-orange-300 border-orange-500/25',
]

function ProductCard({
  product, rank, selectedId, onToggle, tracker, onSaveTracker,
}: {
  product: SpecificProduct
  rank: number
  selectedId: string | null
  onToggle: (id: string) => void
  tracker?: { status: BuildItemStatus; cost?: number; vendor?: string; notes?: string }
  onSaveTracker: (productId: string, next: { status?: BuildItemStatus; cost?: number; vendor?: string; notes?: string }) => void
}) {
  const diff        = difficultyConfig[product.difficulty] ?? difficultyConfig['bolt-on']
  const isTop       = rank === 1
  const isPurchased = selectedId === product.id
  const status = tracker?.status ?? (isPurchased ? 'purchased' : 'planned')

  return (
    <div className={`bg-[#16161a] border rounded-2xl overflow-hidden transition-all duration-300 ${
      isPurchased
        ? 'border-green-500/40 ring-1 ring-green-500/20'
        : isTop
        ? 'border-purple-500/40 ring-1 ring-purple-500/20 hover:border-purple-500/60'
        : 'border-[#2a2a30] hover:border-purple-500/40'
    }`}>

      {/* Banner */}
      {isPurchased ? (
        <div className="bg-gradient-to-r from-green-600/25 to-green-800/15 border-b border-green-500/25 px-5 py-2 flex items-center gap-2">
          <span className="text-green-400 text-sm">✓</span>
          <span className="text-green-200 text-xs font-bold uppercase tracking-widest">Purchased — not installed yet</span>
        </div>
      ) : isTop ? (
        <div className="bg-gradient-to-r from-purple-600/30 to-purple-800/20 border-b border-purple-500/30 px-5 py-2 flex items-center gap-2">
          <span className="text-yellow-400 text-sm">⭐</span>
          <span className="text-purple-200 text-xs font-bold uppercase tracking-widest">Top Pick</span>
        </div>
      ) : null}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-purple-400">{product.brand}</span>
              <span className="text-zinc-600 text-xs">#{rank}</span>
            </div>
            <h3 className={`font-bold text-lg leading-tight ${isPurchased ? 'text-zinc-400' : 'text-white'}`}>
              {product.name}
            </h3>
          </div>
          <div className="flex items-start gap-3 shrink-0">
            <div className="text-right">
              <p className={`font-bold text-lg ${isPurchased ? 'text-zinc-500' : 'text-purple-400'}`}>
                ${product.priceRange.min.toLocaleString()}–${product.priceRange.max.toLocaleString()}
              </p>
            </div>
            {/* Purchased toggle */}
            <button
              onClick={() => onToggle(product.id)}
              aria-label={isPurchased ? 'Unmark as purchased' : 'Mark as purchased'}
              title={isPurchased ? 'Tap to unmark' : 'Tap when you buy this part'}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 ${
                isPurchased
                  ? 'bg-green-500 border-green-500'
                  : 'border-zinc-600 hover:border-green-500 hover:bg-green-500/10'
              }`}
            >
              {isPurchased
                ? <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                : <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              }
            </button>
          </div>
        </div>

        {isPurchased && (
          <div className="mb-3 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
            <span className="text-green-400 text-xs">🛒</span>
            <p className="text-green-300/80 text-xs font-medium">Marked as purchased — tap ✓ again to undo</p>
          </div>
        )}

        {/* Description */}
        <p className={`text-sm leading-relaxed mb-3 ${isPurchased ? 'text-zinc-600' : 'text-zinc-400'}`}>{product.description}</p>

        {/* Compatibility note */}
        <div className="flex items-start gap-2 mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <span className="text-blue-400 text-sm shrink-0">🔧</span>
          <p className="text-blue-200/80 text-xs leading-relaxed">{product.compatibility}</p>
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {product.tags.map((tag, i) => (
              <span key={i} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${tagColors[i % tagColors.length]}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Install difficulty block */}
        <div className={`rounded-xl border p-3 mb-4 ${diff.border} bg-[#0f0f12]`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${isPurchased ? 'text-zinc-600' : diff.color}`}>{diff.label}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className={`w-4 h-2 rounded-sm ${n <= diff.bars ? (isPurchased ? 'bg-zinc-600' : diff.bg) : 'bg-[#2a2a30]'}`} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300">
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold">{product.timeToInstall}</span>
            </div>
          </div>
          <p className="text-zinc-500 text-xs">{diff.desc}</p>
        </div>

        {/* Gain estimate */}
        {product.gainEstimate && (
          <div className="flex items-center gap-2 mb-4 text-xs">
            <span className="text-zinc-500">Est. gain:</span>
            <span className={`font-semibold ${isPurchased ? 'text-zinc-600' : 'text-green-400'}`}>{product.gainEstimate}</span>
          </div>
        )}

        <div className="rounded-xl border border-[#2a2a30] bg-[#0f0f12] p-3 space-y-2">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Build tracker</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={status}
              onChange={(e) => onSaveTracker(product.id, { status: e.target.value as BuildItemStatus })}
              className="rounded-lg border border-[#2a2a30] bg-[#111116] px-2.5 py-2 text-xs text-zinc-200"
            >
              <option value="planned">Planned</option>
              <option value="purchased">Purchased</option>
              <option value="installed">Installed</option>
            </select>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Cost paid (USD)"
              defaultValue={tracker?.cost ?? ''}
              onBlur={(e) => onSaveTracker(product.id, { cost: e.target.value ? Number(e.target.value) : undefined })}
              className="rounded-lg border border-[#2a2a30] bg-[#111116] px-2.5 py-2 text-xs text-zinc-200"
            />
            <input
              type="text"
              placeholder="Vendor (optional)"
              defaultValue={tracker?.vendor ?? ''}
              onBlur={(e) => onSaveTracker(product.id, { vendor: e.target.value || undefined })}
              className="rounded-lg border border-[#2a2a30] bg-[#111116] px-2.5 py-2 text-xs text-zinc-200"
            />
            <input
              type="text"
              placeholder="Quick notes"
              defaultValue={tracker?.notes ?? ''}
              onBlur={(e) => onSaveTracker(product.id, { notes: e.target.value || undefined })}
              className="rounded-lg border border-[#2a2a30] bg-[#111116] px-2.5 py-2 text-xs text-zinc-200"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PartDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const [intake,     setIntake]     = useState<SavedVehicle | null>(null)
  const [detail,     setDetail]     = useState<PartDetail | null>(null)
  const [notFound,   setNotFound]   = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [trackerByProduct, setTrackerByProduct] = useState<Record<string, { status: BuildItemStatus; cost?: number; vendor?: string; notes?: string }>>({})

  useEffect(() => {
    const activeVehicle = getActiveVehicle()
    if (activeVehicle) {
      setIntake(activeVehicle)
      setSelectedId(loadProductSelections(activeVehicle.id)[id] ?? null)
      setTrackerByProduct(loadBuildTracker(activeVehicle.id))
    }

    const found = partDetails.find(p => p.partId === id)
    if (found) setDetail(found)
    else setNotFound(true)
  }, [id])

  function handleToggle(productId: string) {
    if (!intake) return

    const next = selectedId === productId ? null : productId
    setSelectedId(next)
    saveProductSelection(intake.id, id, next)
  }

  function handleSaveTracker(productId: string, next: { status?: BuildItemStatus; cost?: number; vendor?: string; notes?: string }) {
    if (!intake) return
    const current = trackerByProduct[productId]
    const merged = {
      status: next.status ?? current?.status ?? 'planned',
      cost: next.cost !== undefined ? next.cost : current?.cost,
      vendor: next.vendor !== undefined ? next.vendor : current?.vendor,
      notes: next.notes !== undefined ? next.notes : current?.notes,
    }

    setTrackerByProduct((prev) => ({ ...prev, [productId]: merged }))
    saveBuildTrackerItem(intake.id, {
      partId: productId,
      productId,
      status: merged.status,
      cost: merged.cost,
      vendor: merged.vendor,
      notes: merged.notes,
      updatedAt: new Date().toISOString(),
    })
  }

  if (!detail && !notFound) {
    return (
      <div className="min-h-screen bg-[#0a0a0d] flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading...</div>
      </div>
    )
  }

  if (notFound || !detail) {
    return (
      <div className="min-h-screen bg-[#0a0a0d] flex flex-col items-center justify-center gap-4">
        <p className="text-white font-bold text-xl">Part not found</p>
        <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
          ← Back to Build Plan
        </Link>
      </div>
    )
  }

  const safeIntake: IntakeData = intake ?? {
    name: '', email: '', service: '', year: '', make: '', model: '', trim: '',
    engine: '', drivetrain: '', mileage: '', budget: '', goals: '', focus: 'Both',
    currentMods: '', notes: '',
  }

  const carLabel = [safeIntake.year, safeIntake.make, safeIntake.model, safeIntake.trim].filter(Boolean).join(' ')

  // When one product is purchased, show it first; hide others unless unselected
  const displayedProducts = selectedId
    ? detail.products.filter(p => p.id === selectedId)
    : detail.products

  return (
    <div className="min-h-screen bg-[#0a0a0d]">
      {/* Nav bar */}
      <div className="border-b border-[#1a1a20] bg-[#0f0f12]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Build Plan
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-400 text-sm">{detail.title}</span>
          {carLabel && (
            <>
              <span className="text-zinc-700 hidden sm:block">/</span>
              <span className="text-zinc-500 text-xs hidden sm:block">{carLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{detail.icon}</span>
            <h1 className="text-white font-black text-3xl">{detail.title}</h1>
          </div>
          <p className="text-zinc-400 text-base leading-relaxed max-w-2xl">{detail.intro}</p>
          {carLabel && (
            <div className="mt-3 inline-flex items-center gap-2 bg-purple-600/15 border border-purple-500/25 text-purple-300 text-sm font-medium px-4 py-1.5 rounded-full">
              <span>🚗</span>
              <span>{carLabel}</span>
            </div>
          )}
        </div>

        {/* Count / purchased badge */}
        <div className="flex items-center gap-2 mb-6">
          {selectedId ? (
            <>
              <span className="text-green-400 text-sm font-semibold">✓ Purchased</span>
              <span className="text-zinc-700">·</span>
              <button
                onClick={() => handleToggle(selectedId)}
                className="text-xs text-zinc-500 hover:text-white transition-colors underline underline-offset-2"
              >
                Show all {detail.products.length} options again
              </button>
            </>
          ) : (
            <>
              <span className="text-zinc-500 text-sm">{detail.products.length} options available</span>
              <span className="text-zinc-700">·</span>
              <span className="text-zinc-500 text-sm">Tap ✓ on a card when you buy it</span>
            </>
          )}
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayedProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              rank={detail.products.indexOf(product) + 1}
              selectedId={selectedId}
              onToggle={handleToggle}
              tracker={trackerByProduct[product.id]}
              onSaveTracker={handleSaveTracker}
            />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-10 p-4 bg-[#16161a] border border-[#2a2a30] rounded-xl">
          <p className="text-zinc-500 text-xs leading-relaxed">
            <span className="text-zinc-300 font-semibold">Note:</span> Use this page to track status, spend, and notes per part.
            You can still research retailers manually, but this build view is now focused on project progress.
          </p>
        </div>
      </div>
    </div>
  )
}
