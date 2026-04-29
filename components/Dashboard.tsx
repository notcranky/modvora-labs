'use client'

import { ReactNode, memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Part } from '@/lib/types'
import { getRecommendedParts, getTopRatedParts, estimateTotalCost } from '@/lib/parts-matcher'
import CarVisualizer from './CarVisualizer'
import ShareBuildModal from './ShareBuildModal'
import BuildDnaCard from './BuildDnaCard'
import HpEstimator from './HpEstimator'
import {
  addBuildPhoto,
  BuildMilestone,
  BuildTrackerItem,
  deleteVehicle,
  getBuildTrackerSummary,
  getVehicleLabel,
  loadBuildTracker,
  loadBuildMilestones,
  loadBuildPhotos,
  loadCheckedParts,
  loadPartPhotos,
  loadJournal,
  loadVehicles,
  saveCheckedParts,
  saveBuildMilestones,
  saveVehicles,
  savePartPhoto,
  saveJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  deletePartPhoto,
  setActiveVehicleId,
  SavedVehicle,
  PartPhoto,
  PartPhotoTag,
  JournalEntry,
} from '@/lib/garage'

const FLIP_ATTR = 'data-flip-id'
const CONFETTI_COLORS = ['#a855f7', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316']

function parseBudgetMax(budget: string): number | null {
  const map: Record<string, number> = {
    'Under $500': 500, '$500\u20131,000': 1000, '$1,000\u20132,500': 2500,
    '$2,500\u20135,000': 5000, '$5,000\u201310,000': 10000, '$10,000+': 15000,
  }
  return map[budget] ?? null
}

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const maxW = 800, maxH = 600
        let w = img.width, h = img.height
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
        if (h > maxH) { w = Math.round(w * maxH / h); h = maxH }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.onerror = reject
      img.src = e.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const tagConfig: Record<PartPhotoTag, { label: string; border: string; bg: string; text: string; dot: string; pill: string }> = {
  unboxing:     { label: 'Unboxing',     border: 'border-blue-500/30',   bg: 'bg-blue-500/10',   text: 'text-blue-300',   dot: 'bg-blue-400',   pill: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
  installation: { label: 'Installation', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-300', dot: 'bg-yellow-400', pill: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300' },
  finished:     { label: 'Finished',     border: 'border-green-500/30',  bg: 'bg-green-500/10',  text: 'text-green-300',  dot: 'bg-green-400',  pill: 'border-green-500/30 bg-green-500/10 text-green-300' },
}

function ConfettiBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const canvasEl = canvas
    const ctx = context

    canvasEl.width = window.innerWidth
    canvasEl.height = window.innerHeight

    const particles = Array.from({ length: 36 }, (_, i) => ({
      x,
      y,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -14 - 2,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: Math.random() * 7 + 4,
      gravity: 0.45,
      alpha: 1,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 12,
    }))

    let frame: number
    let tick = 0

    function draw() {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
      tick++

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += p.gravity
        p.vx *= 0.98
        p.rot += p.rotV
        p.alpha = Math.max(0, 1 - tick / 65)

        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }

      if (tick < 70) frame = requestAnimationFrame(draw)
      else onDone()
    }

    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [x, y, onDone])

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999 }} />
}

const categoryMeta: Record<string, { label: string; icon: string }> = {
  intake: { label: 'Intake', icon: '🌬️' },
  exhaust: { label: 'Exhaust', icon: '🔊' },
  suspension: { label: 'Suspension', icon: '📉' },
  brakes: { label: 'Brakes', icon: '🛑' },
  'wheels-tires': { label: 'Wheels & Tires', icon: '🛞' },
  exterior: { label: 'Exterior', icon: '🏎️' },
  interior: { label: 'Interior', icon: '🪑' },
  lighting: { label: 'Lighting', icon: '💡' },
  tune: { label: 'Tune / ECU', icon: '🧠' },
  'forced-induction': { label: 'Forced Induction', icon: '🐌' },
}

const difficultyLabel: Record<string, string> = {
  'bolt-on': 'Bolt-On DIY',
  moderate: 'Moderate',
  advanced: 'Advanced',
  professional: 'Professional',
}

const difficultyColor: Record<string, string> = {
  'bolt-on': 'text-green-400',
  moderate: 'text-yellow-400',
  advanced: 'text-orange-400',
  professional: 'text-red-400',
}

function SectionShell({ title, eyebrow, description, children }: { title: string; eyebrow?: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-[#23232a] bg-[linear-gradient(180deg,#141419_0%,#0f0f13_100%)] p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow && <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{eyebrow}</p>}
          <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{title}</h2>
          {description && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function BuildSummary({
  parts,
  checkedCount,
  trackedSpend,
  installedCount,
  milestonesDone,
  milestonesTotal,
}: {
  parts: Part[]
  checkedCount: number
  trackedSpend: number
  installedCount: number
  milestonesDone: number
  milestonesTotal: number
}) {
  const cost = estimateTotalCost(parts)
  const boltOnCount = parts.filter((p) => p.difficulty === 'bolt-on').length
  const completion = parts.length ? Math.round((checkedCount / parts.length) * 100) : 0
  const milestonePct = milestonesTotal ? Math.round((milestonesDone / milestonesTotal) * 100) : 0

  const stats = [
    {
      label: 'Build progress',
      value: `${completion}%`,
      sub: `${checkedCount} of ${parts.length} parts done`,
      bar: completion,
      barColor: 'from-[#A020F0] to-purple-400',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Next milestone',
      value: milestonesTotal ? `${milestonesDone}/${milestonesTotal}` : '—',
      sub: milestonesTotal ? `${milestonePct}% milestones done` : 'No milestones added yet',
      bar: milestonePct,
      barColor: 'from-amber-500 to-amber-400',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
        </svg>
      ),
    },
    {
      label: 'Total spend logged',
      value: `$${trackedSpend.toLocaleString()}`,
      sub: `est. $${cost.min.toLocaleString()}–$${cost.max.toLocaleString()} range`,
      bar: null,
      barColor: '',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Parts installed',
      value: String(installedCount),
      sub: `${boltOnCount} DIY-friendly options`,
      bar: parts.length ? Math.round((installedCount / parts.length) * 100) : 0,
      barColor: 'from-green-500 to-emerald-400',
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 fade-in">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-[#232328] bg-[#171719] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{s.label}</p>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#A020F0]/12 text-purple-400">
              {s.icon}
            </span>
          </div>
          <p className="text-2xl font-bold text-white leading-none">{s.value}</p>
          {s.bar !== null && (
            <div className="h-1.5 w-full rounded-full bg-[#232328] overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${s.barColor} transition-all duration-700`}
                style={{ width: `${s.bar}%` }}
              />
            </div>
          )}
          <p className="text-xs text-zinc-500 leading-snug">{s.sub}</p>
        </div>
      ))}
    </div>
  )
}

function BuildSnapshot({ parts, checked, trackerItems, hiddenParts }: {
  parts: Part[]
  checked: Set<string>
  trackerItems: Record<string, import('@/lib/garage').BuildTrackerItem>
  hiddenParts: Set<string>
}) {
  // Parts the user has committed to (planned/purchased) but not yet installed
  const committedIds = new Set(
    Object.entries(trackerItems)
      .filter(([, item]) => item.status === 'planned' || item.status === 'purchased')
      .map(([id]) => id)
  )

  // Filter out anything already checked/installed or hidden by user
  const available = parts.filter((p) => !checked.has(p.id) && !hiddenParts.has(p.id))

  // Next best moves: show committed tracker items first, then remaining recommendations
  const committed = available.filter((p) => committedIds.has(p.id))
  const remaining = available.filter((p) => !committedIds.has(p.id))
  const nextParts = [...committed, ...remaining].slice(0, 3)

  const acquired = parts.filter((part) => checked.has(part.id)).slice(0, 3)
  const categories = Array.from(new Set(parts.map((part) => part.category))).slice(0, 4)

  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-2xl border border-[#23232a] bg-black/20 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-zinc-300">Next best moves</p>
            <p className="mt-1 text-sm text-zinc-500">The first few items to focus on without digging through the full list.</p>
          </div>
          <span className="rounded-full border border-purple-500/25 bg-purple-500/10 px-3 py-1 text-xs text-purple-200">Top priority</span>
        </div>
        <div className="mt-4 space-y-3">
          {nextParts.length > 0 ? nextParts.map((part, index) => {
            const meta = categoryMeta[part.category] ?? { icon: '🛠️', label: part.category }
            return (
              <a key={part.id} href={`/dashboard/parts/${part.id}`} className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors hover:border-purple-500/30 hover:bg-[#15151b] ${committedIds.has(part.id) ? 'border-purple-500/25 bg-purple-500/5' : 'border-[#23232a] bg-[#111116]'}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#2a2a30] bg-[#0c0c10] text-sm text-zinc-300">#{index + 1}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">{part.name}</p>
                      {committedIds.has(part.id) && (
                        <span className="shrink-0 rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300">In your plan</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">{meta.icon} {meta.label} · {part.brand}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-purple-300">${part.priceRange.min.toLocaleString()}</p>
                  <p className="text-[11px] text-zinc-600">{difficultyLabel[part.difficulty] ?? part.difficulty}</p>
                </div>
              </a>
            )
          }) : (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-5 text-sm text-green-200">Everything in this plan is checked off. Nice.</div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-[#23232a] bg-black/20 p-5">
          <p className="text-sm font-medium text-zinc-300">Build mix</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => {
              const meta = categoryMeta[category] ?? { icon: '🛠️', label: category }
              return (
                <span key={category} className="inline-flex items-center gap-2 rounded-full border border-[#2a2a30] bg-[#111116] px-3 py-2 text-xs text-zinc-300">
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </span>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[#23232a] bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-zinc-300">Already acquired</p>
            <span className="text-xs text-zinc-500">{checked.size} total</span>
          </div>
          <div className="mt-4 space-y-2">
            {acquired.length > 0 ? acquired.map((part) => (
              <div key={part.id} className="flex items-center gap-3 rounded-2xl border border-green-500/15 bg-green-500/5 px-4 py-3 text-sm text-zinc-300">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">✓</span>
                <span className="truncate">{part.name}</span>
              </div>
            )) : (
              <p className="rounded-2xl border border-[#23232a] bg-[#111116] px-4 py-4 text-sm text-zinc-500">Nothing checked off yet — start with the first priority item.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const PhaseTimeline = memo(function PhaseTimeline({ parts, checked, trackerItems }: { parts: Part[]; checked: Set<string>; trackerItems: Record<string, BuildTrackerItem> }) {
  const phaseLabels = ['Start Here', 'Next Up', 'Final Stage']
  const phaseColors = ['border-green-500/25 bg-green-500/5', 'border-yellow-500/25 bg-yellow-500/5', 'border-orange-500/25 bg-orange-500/5']
  const phaseBadge = ['bg-green-500/15 text-green-300', 'bg-yellow-500/15 text-yellow-300', 'bg-orange-500/15 text-orange-300']

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {[1, 2, 3].map((phase) => {
        const pp = parts.filter((p) => p.phase === phase)
        if (!pp.length) return null

        const doneCount = pp.filter((p) => checked.has(p.id)).length
        const isComplete = doneCount === pp.length

        return (
          <div key={phase} className={`rounded-2xl border p-4 transition-colors duration-300 ${isComplete ? 'border-green-500/50 bg-green-500/10' : phaseColors[phase - 1]}`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${isComplete ? 'bg-green-500/25 text-green-300' : phaseBadge[phase - 1]}`}>Phase {phase}</span>
                <span className={`text-sm ${isComplete ? 'text-green-400' : 'text-zinc-400'}`}>
                  {isComplete ? 'Complete' : phaseLabels[phase - 1]}
                </span>
              </div>
              {isComplete ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">✓</span>
              ) : pp.length > 0 ? (
                <span className="text-xs text-zinc-600">{doneCount}/{pp.length}</span>
              ) : null}
            </div>
            <ul className="space-y-2">
              {pp.map((p) => {
                const done = checked.has(p.id)
                return (
                  <li key={p.id} className="flex flex-col gap-0.5 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0">{done ? '✓' : (categoryMeta[p.category]?.icon ?? '🛠️')}</span>
                      <span className={done ? 'text-zinc-500 line-through' : 'text-zinc-300'}>{p.name}</span>
                    </div>
                    {trackerItems[p.id]?.notes && (
                      <p className="ml-6 text-[11px] text-zinc-500 italic">{trackerItems[p.id].notes}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
})

function Top10({
  topRated, checked, onToggle, hiddenParts, customMods, partsOrder, onHide, onUnhide, onAddMod, onRemoveMod, onReorder, onOpenPartPhotos,
}: {
  topRated: { part: Part; score: number; stars: number }[]
  checked: Set<string>
  onToggle: (id: string) => void
  hiddenParts: Set<string>
  customMods: Array<{ id: string; name: string }>
  partsOrder: string[]
  onHide: (id: string) => void
  onUnhide: (id: string) => void
  onAddMod: (name: string) => void
  onRemoveMod: (id: string) => void
  onReorder: (newOrder: string[]) => void
  onOpenPartPhotos: (partId: string, partName: string) => void
}) {
  const rankColors = ['text-yellow-400', 'text-zinc-300', 'text-orange-400']
  const rankBg = ['bg-yellow-500/10 border-yellow-500/30', 'bg-zinc-500/10 border-zinc-500/30', 'bg-orange-500/10 border-orange-500/30']
  const listRef = useRef<HTMLDivElement>(null)
  const snapRef = useRef<Map<string, number>>(new Map())
  const needsFlip = useRef(false)
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number } | null>(null)
  const confettiId = useRef(0)
  const [editMode, setEditMode] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [newModName, setNewModName] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  useLayoutEffect(() => {
    if (!needsFlip.current || !listRef.current) return
    needsFlip.current = false

    listRef.current.querySelectorAll<HTMLElement>(`[${FLIP_ATTR}]`).forEach((el) => {
      const id = el.getAttribute(FLIP_ATTR)!
      const oldTop = snapRef.current.get(id)
      if (oldTop === undefined) return
      const newTop = el.getBoundingClientRect().top
      const delta = oldTop - newTop
      if (Math.abs(delta) < 2) return

      el.style.transition = 'none'
      el.style.transform = `translateY(${delta}px)`

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          el.style.transform = 'translateY(0)'
        })
      })
    })

    snapRef.current.clear()
  })

  function handleToggle(id: string, e: React.MouseEvent) {
    if (listRef.current) {
      listRef.current.querySelectorAll<HTMLElement>(`[${FLIP_ATTR}]`).forEach((el) => {
        snapRef.current.set(el.getAttribute(FLIP_ATTR)!, el.getBoundingClientRect().top)
      })
    }

    needsFlip.current = true

    if (!checked.has(id)) {
      const btn = e.currentTarget as HTMLElement
      const r = btn.getBoundingClientRect()
      setConfetti({ id: ++confettiId.current, x: r.left + r.width / 2, y: r.top + r.height / 2 })
    }

    onToggle(id)
  }

  // Build a single unified ordered list from saved partsOrder + any new IDs not yet tracked
  const allIds = [...topRated.map((x) => x.part.id), ...customMods.map((m) => m.id)]
  const effectiveOrder = [
    ...partsOrder.filter((id) => allIds.includes(id)),
    ...allIds.filter((id) => !partsOrder.includes(id)),
  ]

  const partMap = new Map(topRated.map((x) => [x.part.id, x]))
  const customMap = new Map(customMods.map((m) => [m.id, m]))

  // Assign rank numbers to non-hidden, non-checked items (in effectiveOrder sequence)
  const rankMap: Record<string, number> = {}
  let rankCounter = 0
  effectiveOrder.forEach((id) => {
    if (!hiddenParts.has(id) && !checked.has(id)) {
      rankCounter++
      rankMap[id] = rankCounter
    }
  })

  const totalVisible = effectiveOrder.filter((id) => !hiddenParts.has(id)).length
  const doneCount = effectiveOrder.filter((id) => !hiddenParts.has(id) && checked.has(id)).length

  // Normal mode: non-hidden, non-checked first (in order), then non-hidden checked at bottom
  const normalDisplayIds = [
    ...effectiveOrder.filter((id) => !hiddenParts.has(id) && !checked.has(id)),
    ...effectiveOrder.filter((id) => !hiddenParts.has(id) && checked.has(id)),
  ]
  // Edit mode: only non-hidden items in the drag list; hidden items shown separately below
  const editDisplayIds = effectiveOrder.filter((id) => !hiddenParts.has(id))
  const hiddenIds = effectiveOrder.filter((id) => hiddenParts.has(id))
  const availableCategories = Array.from(new Set(topRated.map(x => x.part.category)))
  const displayIds = (editMode ? editDisplayIds : normalDisplayIds)
    .filter(id => {
      if (!filterCategory) return true
      const entry = partMap.get(id)
      if (!entry) return true // always show custom mods
      return entry.part.category === filterCategory
    })

  function handleDragStart(id: string, e: React.DragEvent) {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(targetId: string, e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (targetId !== dragId) setDragOverId(targetId)
  }

  function handleDrop(targetId: string, e: React.DragEvent) {
    e.preventDefault()
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return }
    const newOrder = [...effectiveOrder]
    const fromIdx = newOrder.indexOf(dragId)
    const toIdx = newOrder.indexOf(targetId)
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, dragId)
    onReorder(newOrder)
    setDragId(null)
    setDragOverId(null)
  }

  function handleDragEnd() {
    setDragId(null)
    setDragOverId(null)
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Recommended parts</h3>
          <p className="mt-1 text-sm text-zinc-500">
            {editMode ? 'Drag rows to reorder, × to hide, or add your own below.' : 'The full ranked list stays here, while the overview above keeps the page calmer.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs text-purple-200">{doneCount} acquired</span>
          <button
            onClick={() => setEditMode((prev) => !prev)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${editMode ? 'border-purple-500/40 bg-purple-500/15 text-purple-300' : 'border-[#2a2a30] text-zinc-400 hover:border-zinc-500 hover:text-white'}`}
          >
            {editMode ? 'Done' : 'Edit list'}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilterCategory(null)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filterCategory === null ? 'border-purple-500/40 bg-purple-500/15 text-purple-300' : 'border-[#2a2a30] text-zinc-500 hover:text-white'}`}
        >
          All
        </button>
        {availableCategories.map(cat => {
          const meta = categoryMeta[cat as keyof typeof categoryMeta]
          return (
            <button key={cat}
              onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${filterCategory === cat ? 'border-purple-500/40 bg-purple-500/15 text-purple-300' : 'border-[#2a2a30] text-zinc-500 hover:text-white'}`}
            >
              {meta?.icon} {meta?.label ?? cat}
            </button>
          )
        })}
      </div>

      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-zinc-500">Progress through ranked picks</span>
          <span className="text-xs font-semibold text-green-400">{Math.round((doneCount / (totalVisible || 1)) * 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#1e1e24]">
          <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500" style={{ width: `${(doneCount / (totalVisible || 1)) * 100}%` }} />
        </div>
      </div>

      <div ref={listRef} className="space-y-2">
        {displayIds.map((id) => {
          const partEntry = partMap.get(id)
          const customEntry = customMap.get(id)
          if (!partEntry && !customEntry) return null

          const isCustom = !partEntry
          const isHidden = hiddenParts.has(id)
          const isDone = checked.has(id)
          const rank = rankMap[id] ?? null
          const isTop3 = rank !== null && rank <= 3

          return (
            <div
              key={id}
              {...(!editMode ? { [FLIP_ATTR]: id } : {})}
              draggable={editMode}
              onDragStart={editMode ? (e) => handleDragStart(id, e) : undefined}
              onDragOver={editMode ? (e) => handleDragOver(id, e) : undefined}
              onDrop={editMode ? (e) => handleDrop(id, e) : undefined}
              onDragEnd={editMode ? handleDragEnd : undefined}
              className={`flex items-center gap-3 rounded-2xl border transition-all duration-150 ${
                editMode && dragOverId === id
                  ? 'border-purple-500/60 bg-purple-500/8 scale-[1.01]'
                  : editMode && dragId === id
                  ? 'opacity-30'
                  : isDone
                  ? 'border-green-500/20 bg-green-500/5'
                  : isCustom
                  ? 'border-dashed border-[#2a2a30] bg-[#0f0f12]'
                  : 'border-[#2a2a30] bg-[#131318]'
              }`}
            >
              {/* Left: drag handle (edit mode) or checkbox (normal mode) */}
              {editMode ? (
                <div className="ml-3 flex shrink-0 cursor-grab items-center justify-center active:cursor-grabbing">
                  <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" className="text-zinc-500">
                    <circle cx="4" cy="3" r="1.5"/><circle cx="8" cy="3" r="1.5"/>
                    <circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/>
                    <circle cx="4" cy="13" r="1.5"/><circle cx="8" cy="13" r="1.5"/>
                  </svg>
                </div>
              ) : (
                <button
                  onClick={(e) => handleToggle(id, e)}
                  aria-label={isDone ? 'Uncheck' : 'Mark as acquired'}
                  className={`ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${isDone ? 'border-green-500 bg-green-500' : 'border-zinc-600 hover:border-green-500'}`}
                >
                  {isDone && <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </button>
              )}

              {/* Content */}
              {partEntry ? (
                <a href={`/dashboard/parts/${id}`} className="group flex min-w-0 flex-1 items-center gap-3 py-3">
                  {/* Rank badge */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black ${isDone ? 'border-green-500/20 bg-green-500/10' : isTop3 ? rankBg[rank! - 1] : 'border-[#2a2a30] bg-[#0f0f12]'}`}>
                    {isDone ? <span className="text-green-400">✓</span> : isHidden ? <span className="text-zinc-700">—</span> : <span className={isTop3 ? rankColors[rank! - 1] : 'text-zinc-500'}>#{rank}</span>}
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span className="shrink-0 text-lg">{(categoryMeta[partEntry.part.category] ?? { icon: '🛠️' }).icon}</span>
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold transition-colors ${isDone ? 'text-zinc-500 line-through' : isHidden ? 'text-zinc-600' : 'text-white group-hover:text-purple-300'}`}>{partEntry.part.name}</p>
                      <p className="truncate text-xs text-zinc-600">{partEntry.part.brand} · {(categoryMeta[partEntry.part.category] ?? { label: partEntry.part.category }).label}</p>
                    </div>
                  </div>
                  {!isHidden && (
                    <>
                      <div className="hidden min-w-[90px] shrink-0 flex-col items-end gap-0.5 sm:flex">
                        <span className={`text-xs font-semibold ${isDone ? 'text-zinc-600' : difficultyColor[partEntry.part.difficulty]}`}>{difficultyLabel[partEntry.part.difficulty] ?? partEntry.part.difficulty}</span>
                        <span className="text-xs text-zinc-600">{partEntry.part.timeToInstall}</span>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-sm font-bold ${isDone ? 'text-zinc-600' : 'text-purple-400'}`}>${partEntry.part.priceRange.min.toLocaleString()}</p>
                        <p className="text-xs text-zinc-700">–${partEntry.part.priceRange.max.toLocaleString()}</p>
                      </div>
                      <div className="hidden shrink-0 items-center gap-0.5 md:flex">
                        {[1,2,3,4,5].map((s) => (
                          <svg key={s} className={`h-3 w-3 ${s <= partEntry.stars ? (isDone ? 'text-zinc-600' : 'text-yellow-400') : 'text-zinc-700'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        ))}
                      </div>
                    </>
                  )}
                  {isHidden && <span className="ml-auto shrink-0 rounded-full border border-[#2a2a30] px-2 py-0.5 text-[10px] text-zinc-700">Hidden</span>}
                </a>
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-3 py-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black ${isDone ? 'border-green-500/20 bg-green-500/10' : 'border-dashed border-[#2a2a30] bg-[#0a0a0e]'}`}>
                    {isDone ? <span className="text-green-400">✓</span> : <span className="text-zinc-500">#{rank ?? '—'}</span>}
                  </div>
                  <p className={`min-w-0 flex-1 truncate text-sm font-semibold ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{customEntry!.name}</p>
                  <span className="shrink-0 rounded-full border border-[#2a2a30] px-2 py-0.5 text-[10px] text-zinc-600">Custom</span>
                </div>
              )}

              {/* Camera button — non-edit mode */}
              {!editMode && (
                <button
                  onClick={() => {
                    const name = partEntry?.part.name ?? customEntry?.name ?? id
                    onOpenPartPhotos(id, name)
                  }}
                  title="Progress photos"
                  className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2a2a30] bg-[#111116] text-zinc-600 transition-colors hover:border-purple-500/40 hover:text-purple-400"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                </button>
              )}

              {/* Right: hide (recommended) or remove (custom) — edit mode only */}
              {editMode && (
                <button
                  onClick={() => isCustom ? onRemoveMod(id) : onHide(id)}
                  title={isCustom ? 'Remove' : 'Hide'}
                  className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-500/50 bg-red-500/10 text-xs font-bold text-red-400 transition-all duration-200 hover:bg-red-500/20"
                >×</button>
              )}
            </div>
          )
        })}

        {/* Hidden parts section — edit mode only, separate from drag zone */}
        {editMode && hiddenIds.length > 0 && (
          <div className="mt-3 rounded-2xl border border-[#1e1e24] bg-[#0a0a0d] p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">{hiddenIds.length} hidden — tap + to restore</p>
            <div className="space-y-1.5">
              {hiddenIds.map((id) => {
                const partEntry = partMap.get(id)
                const customEntry = customMap.get(id)
                const name = partEntry?.part.name ?? customEntry?.name ?? id
                return (
                  <div key={id} className="flex items-center gap-2">
                    <button
                      onClick={() => onUnhide(id)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-600 text-[10px] font-bold text-zinc-400 transition-colors hover:border-green-500 hover:text-green-400"
                    >+</button>
                    <span className="truncate text-xs text-zinc-600">{name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Add custom mod input — edit mode */}
        {editMode && (
          <div className="flex gap-2 pt-1">
            <input
              value={newModName}
              onChange={(e) => setNewModName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newModName.trim()) {
                  onAddMod(newModName.trim())
                  setNewModName('')
                }
              }}
              placeholder="Add a custom mod (e.g. Wrapped roof, tinted tail lights…)"
              className="flex-1 rounded-xl border border-dashed border-purple-500/30 bg-[#0d0d12] px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-purple-500/50"
            />
            <button
              onClick={() => {
                if (newModName.trim()) {
                  onAddMod(newModName.trim())
                  setNewModName('')
                }
              }}
              className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {confetti && <ConfettiBurst key={confetti.id} x={confetti.x} y={confetti.y} onDone={() => setConfetti(null)} />}
    </div>
  )
}

function PartPhotoModal({
  partId,
  partName,
  vehiclePhotos,
  onSave,
  onDelete,
  onClose,
}: {
  partId: string
  partName: string
  vehiclePhotos: PartPhoto[]
  onSave: (data: Omit<PartPhoto, 'id' | 'createdAt'>) => void
  onDelete: (photoId: string) => void
  onClose: () => void
}) {
  const partPhotos = vehiclePhotos.filter((p) => p.partId === partId)
  const [tag, setTag] = useState<PartPhotoTag>('unboxing')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const imageData = await compressImageFile(file)
      onSave({ partId, partName, tag, imageData, caption: caption.trim() })
      setCaption('')
      if (fileRef.current) fileRef.current.value = ''
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {lightboxSrc && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/92" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="" className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl" />
          <button onClick={() => setLightboxSrc(null)} className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white hover:bg-black/80 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl border border-[#2a2a30] bg-[#111116] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#111116] px-5 pt-5 pb-4 border-b border-[#1e1e24]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Progress Photos</p>
            <h3 className="text-base font-semibold text-white truncate max-w-[280px]">{partName}</h3>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2a2a30] text-zinc-500 hover:text-white transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Upload section */}
        <div className="p-5 space-y-3">
          {/* Tag selector */}
          <div className="flex gap-2">
            {(Object.keys(tagConfig) as PartPhotoTag[]).map((t) => (
              <button
                key={t}
                onClick={() => setTag(t)}
                className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-colors ${tag === t ? tagConfig[t].pill : 'border-[#2a2a30] text-zinc-500 hover:text-zinc-300'}`}
              >
                {tagConfig[t].label}
              </button>
            ))}
          </div>

          {/* Caption */}
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="w-full rounded-xl border border-[#2a2a30] bg-[#0d0d12] px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-purple-500/50"
          />

          {/* File upload */}
          <label className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed py-4 text-sm transition-colors ${uploading ? 'border-purple-500/50 bg-purple-500/5 text-purple-300' : 'border-[#2a2a30] text-zinc-400 hover:border-purple-500/30 hover:text-white'}`}>
            {uploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                <span>Compressing…</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                <span>Upload photo</span>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={uploading} />
          </label>
        </div>

        {/* Existing photos */}
        {partPhotos.length > 0 ? (
          <div className="px-5 pb-6 space-y-3">
            <p className="text-xs text-zinc-500">{partPhotos.length} photo{partPhotos.length !== 1 ? 's' : ''} saved</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {partPhotos.map((photo) => (
                <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-[#2a2a30] bg-[#0d0d12]">
                  <img
                    src={photo.imageData}
                    alt={photo.caption || tagConfig[photo.tag].label}
                    className="aspect-square w-full cursor-zoom-in object-cover"
                    onClick={() => setLightboxSrc(photo.imageData)}
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pb-2 pt-8">
                    <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${tagConfig[photo.tag].pill}`}>
                      {tagConfig[photo.tag].label}
                    </span>
                    {photo.caption && <p className="mt-0.5 truncate text-[10px] text-zinc-300">{photo.caption}</p>}
                  </div>
                  <button
                    onClick={() => onDelete(photo.id)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-red-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500/20"
                  >×</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 pb-6 text-center">
            <p className="text-sm text-zinc-600">No photos yet — upload the first one above.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const MILESTONE_PRESETS = ['First Start', 'Engine Out', 'Paint Day', 'Track Day', 'First Drive', 'Dyno Pull', 'Final Assembly', 'Road Trip']

const JOURNAL_PROMPTS = [
  'What did you install or work on today?',
  'What surprised you — good or bad?',
  'What took longer than expected, and why?',
  'How does the car feel different now?',
  'What did you learn that you didn\'t know before?',
  'What\'s the next thing on your list?',
]

const MOOD_OPTIONS: { value: NonNullable<import('@/lib/garage').JournalEntry['mood']>; label: string; color: string }[] = [
  { value: 'hyped',         label: '🔥 Hyped',       color: 'border-orange-500/40 bg-orange-500/10 text-orange-300' },
  { value: 'grinding',      label: '⚙️ Grinding',    color: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-300' },
  { value: 'satisfied',     label: '✅ Satisfied',   color: 'border-green-500/40 bg-green-500/10 text-green-300' },
  { value: 'problem_solved',label: '💡 Solved it',   color: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },
  { value: 'frustrated',    label: '😤 Frustrated',  color: 'border-red-500/40 bg-red-500/10 text-red-300' },
]

function JournalEntryModal({
  entry,
  availableParts,
  onSave,
  onClose,
}: {
  entry?: JournalEntry | null
  availableParts: Array<{ id: string; name: string }>
  onSave: (data: Omit<JournalEntry, 'id' | 'createdAt'>) => void
  onClose: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(entry?.date ?? today)
  const [mileage, setMileage] = useState(entry?.mileage?.toString() ?? '')
  const [timeSpent, setTimeSpent] = useState(entry?.timeSpent?.toString() ?? '')
  const [narrative, setNarrative] = useState(entry?.narrative ?? '')
  const [mood, setMood] = useState<JournalEntry['mood']>(entry?.mood ?? undefined)
  const [isMilestone, setIsMilestone] = useState(entry?.isMilestone ?? false)
  const [milestoneLabel, setMilestoneLabel] = useState(entry?.milestoneLabel ?? '')
  const [partId, setPartId] = useState(entry?.partId ?? '')
  const [photos, setPhotos] = useState<string[]>(entry?.photos ?? [])
  const [uploading, setUploading] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const selectedPart = availableParts.find((p) => p.id === partId)
  const charCount = narrative.length

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      const compressed = await Promise.all(files.map(compressImageFile))
      setPhotos((prev) => [...prev, ...compressed])
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleSave() {
    if (!date || !narrative.trim()) return
    onSave({
      date,
      mileage: mileage ? parseInt(mileage, 10) : undefined,
      timeSpent: timeSpent ? parseFloat(timeSpent) : undefined,
      narrative: narrative.trim(),
      photos,
      isMilestone,
      milestoneLabel: isMilestone ? milestoneLabel.trim() || undefined : undefined,
      partId: partId || undefined,
      partName: selectedPart?.name,
      mood,
    })
  }

  function applyPrompt(prompt: string) {
    setNarrative((prev) => prev ? `${prev}\n\n${prompt} ` : `${prompt} `)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {lightboxSrc && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/92" onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="" className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl" />
          <button onClick={() => setLightboxSrc(null)} className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white hover:bg-black/80 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#2a2a30] bg-[#111116] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#111116] px-6 pt-6 pb-4 border-b border-[#1e1e24]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Build Journal</p>
            <h3 className="text-base font-semibold text-white">{entry ? 'Edit Entry' : 'New Journal Entry'}</h3>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2a2a30] text-zinc-500 hover:text-white transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Date + Mileage + Time spent */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">Date</label>
              <input
                type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[#2a2a30] bg-[#0d0d12] px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">Odometer <span className="normal-case text-zinc-600">mi</span></label>
              <input
                type="number" value={mileage} onChange={(e) => setMileage(e.target.value)}
                placeholder="15230"
                className="w-full rounded-xl border border-[#2a2a30] bg-[#0d0d12] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">Time <span className="normal-case text-zinc-600">hrs</span></label>
              <input
                type="number" step="0.5" min="0" value={timeSpent} onChange={(e) => setTimeSpent(e.target.value)}
                placeholder="2.5"
                className="w-full rounded-xl border border-[#2a2a30] bg-[#0d0d12] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-purple-500/50"
              />
            </div>
          </div>

          {/* Mood picker */}
          <div>
            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">How did it go?</label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMood(mood === opt.value ? undefined : opt.value)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 ${
                    mood === opt.value ? opt.color : 'border-[#2a2a30] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Narrative */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Narrative</label>
              <span className={`text-[10px] ${charCount > 800 ? 'text-purple-400' : 'text-zinc-600'}`}>{charCount} chars</span>
            </div>
            {/* Writing prompts */}
            <div className="mb-2 flex flex-wrap gap-1.5">
              {JOURNAL_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => applyPrompt(p)}
                  className="rounded-full border border-[#2a2a30] bg-[#0d0d12] px-2.5 py-1 text-[10px] text-zinc-500 hover:border-purple-500/40 hover:text-purple-300 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Write what happened today in the garage…"
              rows={5}
              className="w-full resize-none rounded-xl border border-[#2a2a30] bg-[#0d0d12] px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-purple-500/50 leading-relaxed"
            />
          </div>

          {/* Milestone toggle */}
          <div className="rounded-xl border border-[#2a2a30] bg-[#0d0d12] p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <div
                onClick={() => setIsMilestone(!isMilestone)}
                className={`flex h-5 w-9 items-center rounded-full border transition-colors ${isMilestone ? 'border-amber-500/50 bg-amber-500/20' : 'border-[#2a2a30] bg-[#1a1a20]'}`}
              >
                <div className={`h-4 w-4 rounded-full border transition-all duration-200 ${isMilestone ? 'translate-x-4 border-amber-400 bg-amber-400' : 'translate-x-0.5 border-zinc-600 bg-zinc-600'}`} />
              </div>
              <span className="text-sm font-medium text-zinc-200">Flag as Major Milestone</span>
              <span className="ml-auto text-base">⭐</span>
            </label>
            {isMilestone && (
              <div className="mt-3 space-y-2">
                <input
                  value={milestoneLabel} onChange={(e) => setMilestoneLabel(e.target.value)}
                  placeholder="Milestone name (e.g. First Start)"
                  className="w-full rounded-xl border border-[#2a2a30] bg-[#0a0a0e] px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-amber-500/40"
                  list="milestone-presets"
                />
                <datalist id="milestone-presets">
                  {MILESTONE_PRESETS.map((p) => <option key={p} value={p} />)}
                </datalist>
                <div className="flex flex-wrap gap-1.5">
                  {MILESTONE_PRESETS.map((p) => (
                    <button key={p} type="button" onClick={() => setMilestoneLabel(p)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${milestoneLabel === p ? 'border-amber-500/40 bg-amber-500/15 text-amber-300' : 'border-[#2a2a30] text-zinc-500 hover:text-zinc-300'}`}
                    >{p}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Part link */}
          {availableParts.length > 0 && (
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">Link to a Part <span className="normal-case text-zinc-600">optional</span></label>
              <select value={partId} onChange={(e) => setPartId(e.target.value)}
                className="w-full rounded-xl border border-[#2a2a30] bg-[#0d0d12] px-4 py-2.5 text-sm text-white outline-none focus:border-purple-500/50 [color-scheme:dark]"
              >
                <option value="">— No part link —</option>
                {availableParts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {/* Photo upload */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">Photos <span className="normal-case text-zinc-600">optional</span></label>
            {photos.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((src, idx) => (
                  <div key={idx} className="group relative overflow-hidden rounded-xl border border-[#2a2a30]">
                    <img src={src} alt="" className="aspect-square w-full cursor-zoom-in object-cover" onClick={() => setLightboxSrc(src)} />
                    <button onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-red-400 opacity-0 transition-opacity group-hover:opacity-100"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            <label className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed py-3.5 text-sm transition-colors ${uploading ? 'border-purple-500/50 bg-purple-500/5 text-purple-300' : 'border-[#2a2a30] text-zinc-400 hover:border-purple-500/30 hover:text-white'}`}>
              {uploading
                ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" /><span>Compressing…</span></>
                : <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg><span>Upload photos</span></>
              }
              <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleFiles} disabled={uploading} />
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={handleSave} disabled={!date || !narrative.trim()}
              className="flex-1 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {entry ? 'Save Changes' : 'Add to Journal'}
            </button>
            <button onClick={onClose}
              className="rounded-xl border border-[#2a2a30] px-5 py-3 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
            >Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function VehicleSwitcher({ vehicles, activeVehicleId, onSelect, onDelete }: { vehicles: SavedVehicle[]; activeVehicleId: string; onSelect: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <div className="rounded-[28px] border border-[#23232a] bg-[linear-gradient(180deg,#121217_0%,#0d0d11_100%)] p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Garage</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Manage vehicles quietly in one place</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">Switch builds, edit details, or add another car without crowding the main planning view.</p>
        </div>
        <a href="/intake?new=1" className="rounded-xl bg-purple-600 px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-purple-500">+ Add Another Vehicle</a>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {vehicles.map((vehicle) => {
          const isActive = vehicle.id === activeVehicleId
          return (
            <div key={vehicle.id} className={`rounded-2xl border p-4 transition-colors ${isActive ? 'border-purple-500/35 bg-purple-600/10' : 'border-[#2a2a30] bg-black/20'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{getVehicleLabel(vehicle) || 'Untitled vehicle'}</p>
                  <p className="mt-1 text-xs text-zinc-500">{vehicle.focus} focused · {vehicle.budget || 'No budget yet'}</p>
                </div>
                {isActive && <span className="rounded-full border border-purple-500/25 bg-purple-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-purple-200">Active</span>}
              </div>

              {vehicle.goals && <p className="mt-3 line-clamp-2 text-sm text-zinc-400">{vehicle.goals}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                {!isActive && <button onClick={() => onSelect(vehicle.id)} className="rounded-lg border border-[#2a2a30] bg-[#0f0f12] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1a1a20]">Open build</button>}
                <a href={`/intake?vehicle=${vehicle.id}`} className="rounded-lg border border-[#2a2a30] bg-[#0f0f12] px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-[#1a1a20] hover:text-white">Edit</a>
                {vehicles.length > 1 && <button onClick={() => onDelete(vehicle.id)} className="rounded-lg border border-[#2a2a30] bg-[#0f0f12] px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300">Remove</button>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<SavedVehicle[]>([])
  const [activeVehicleId, setActiveVehicle] = useState<string>('')
  const [parts, setParts] = useState<Part[]>([])
  const [topRated, setTopRated] = useState<{ part: Part; score: number; stars: number }[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'overview' | 'plan' | 'progress' | 'journal' | 'garage'>('overview')
  const [trackedSpend, setTrackedSpend] = useState(0)
  const [installedCount, setInstalledCount] = useState(0)
  const [trackerItems, setTrackerItems] = useState<Record<string, BuildTrackerItem>>({})
  const [milestones, setMilestones] = useState<BuildMilestone[]>([])
  const [hiddenParts, setHiddenParts] = useState<Set<string>>(new Set())
  const [customMods, setCustomMods] = useState<Array<{ id: string; name: string }>>([])
  const [partsOrder, setPartsOrder] = useState<string[]>([])
  const [photoCaption, setPhotoCaption] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photos, setPhotos] = useState<import('@/lib/garage').BuildPhotoLog[]>([])
  const [partPhotos, setPartPhotos] = useState<PartPhoto[]>([])
  const [partModalId, setPartModalId] = useState<string | null>(null)
  const [partModalName, setPartModalName] = useState('')
  const [progressLightbox, setProgressLightbox] = useState<string | null>(null)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [journalModalOpen, setJournalModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [journalPage, setJournalPage] = useState(0) // 0 = TOC, 1+ = journal pages
  const [journalAnimPhase, setJournalAnimPhase] = useState<'idle' | 'out' | 'in'>('idle')
  const [journalAnimDir, setJournalAnimDir] = useState<'forward' | 'back'>('forward')
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [showMode, setShowMode] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [journalViewMode, setJournalViewMode] = useState<'timeline' | 'book' | 'compilation'>('timeline')
  const [journalSearch, setJournalSearch] = useState('')
  const [journalFilter, setJournalFilter] = useState<'all' | 'milestones' | 'photos'>('all')
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  const [compilationIndex, setCompilationIndex] = useState(0)
  const [compilationPlaying, setCompilationPlaying] = useState(true)

  const intake = useMemo(() => vehicles.find((vehicle) => vehicle.id === activeVehicleId) ?? null, [vehicles, activeVehicleId])

  // ── Auto-sync helpers ─────────────────────────────────────────────────────
  const SYNC_KEYS = [
    'modvora_intake', 'modvora_vehicles', 'modvora_active_vehicle_id',
    'modvora_checked_parts_by_vehicle', 'modvora_product_selections_by_vehicle',
    'modvora_build_tracker_by_vehicle', 'modvora_build_milestones_by_vehicle',
    'modvora_build_photos_by_vehicle', 'modvora_part_photos_by_vehicle',
    'modvora_build_journal_by_vehicle', 'modvora_community_posts',
  ]

  function collectLocalData(): Record<string, string> {
    const data: Record<string, string> = {}
    SYNC_KEYS.forEach((k) => { const v = localStorage.getItem(k); if (v) data[k] = v })
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!
      if (k.startsWith('modvora_hidden_parts_') || k.startsWith('modvora_custom_mods_') || k.startsWith('modvora_parts_order_'))
        data[k] = localStorage.getItem(k)!
    }
    return data
  }

  function restoreLocalData(data: Record<string, string>) {
    Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v))
  }

  const pushSync = useRef<ReturnType<typeof setTimeout> | null>(null)

  function schedulePush() {
    if (pushSync.current) clearTimeout(pushSync.current)
    pushSync.current = setTimeout(async () => {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(collectLocalData()),
        })
      } catch {}
    }, 2000) // debounce 2s after last change
  }

  useEffect(() => {
    // On mount: pull from server, restore if there's data, then load normally
    async function pullAndInit() {
      try {
        const res = await fetch('/api/sync')
        if (res.ok) {
          const serverData = await res.json() as Record<string, string>
          if (Object.keys(serverData).length > 0) {
            restoreLocalData(serverData)
          }
        }
      } catch {}

      const storedVehicles = loadVehicles()
      if (storedVehicles.length) {
        const activeId = localStorage.getItem('modvora_active_vehicle_id') ?? storedVehicles[0].id
        const safeActiveId = storedVehicles.find((vehicle) => vehicle.id === activeId)?.id ?? storedVehicles[0].id
        setVehicles(storedVehicles)
        setActiveVehicle(safeActiveId)
        setChecked(new Set(loadCheckedParts(safeActiveId)))
      }
      setLoading(false)
      if (!localStorage.getItem('modvora_welcomed')) setShowWelcome(true)
    }

    pullAndInit()

    // Push when tab becomes visible again (switching back from another app)
    const onVisible = () => {
      if (document.visibilityState === 'visible') schedulePush()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    if (!intake) {
      setParts([])
      setTopRated([])
      return
    }

    setParts(getRecommendedParts(intake))
    setTopRated(getTopRatedParts(intake))
    setChecked(new Set(loadCheckedParts(intake.id)))
    const tracker = getBuildTrackerSummary(intake.id)
    setTrackedSpend(tracker.spend)
    setInstalledCount(tracker.installed)
    setTrackerItems(loadBuildTracker(intake.id))
    setMilestones(loadBuildMilestones(intake.id))
    setPhotos(loadBuildPhotos(intake.id))
    setPartPhotos(loadPartPhotos(intake.id))
    setJournalEntries(loadJournal(intake.id))
    const hiddenRaw = localStorage.getItem(`modvora_hidden_parts_${intake.id}`)
    setHiddenParts(new Set(hiddenRaw ? JSON.parse(hiddenRaw) : []))
    const customRaw = localStorage.getItem(`modvora_custom_mods_${intake.id}`)
    setCustomMods(customRaw ? JSON.parse(customRaw) : [])
    const orderRaw = localStorage.getItem(`modvora_parts_order_${intake.id}`)
    setPartsOrder(orderRaw ? JSON.parse(orderRaw) : [])
    setActiveVehicleId(intake.id)
    localStorage.setItem('modvora_intake', JSON.stringify(intake))
  }, [intake])

  // ── Push sync whenever key data changes ──────────────────────────────────
  useEffect(() => {
    schedulePush()
  }, [vehicles, journalEntries, trackerItems, milestones, photos, partPhotos, checked])

  // ── Compilation auto-advance ─────────────────────────────────────────────
  useEffect(() => {
    if (journalViewMode !== 'compilation' || !compilationPlaying) return
    const compilationSlides = journalEntries
      .filter((e) => e.photos && e.photos.length > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .flatMap((e) => e.photos.map((src) => ({ src, entry: e })))
    if (!compilationSlides.length) return
    const timer = setTimeout(() => {
      setCompilationIndex((i) => (i + 1) % compilationSlides.length)
    }, 4500)
    return () => clearTimeout(timer)
  }, [journalViewMode, compilationPlaying, compilationIndex, journalEntries])

  useEffect(() => {
    if (journalViewMode !== 'compilation') return
    const compilationSlides = journalEntries
      .filter((e) => e.photos && e.photos.length > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
      .flatMap((e) => e.photos.map((src) => ({ src, entry: e })))
    const total = compilationSlides.length
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { setCompilationIndex((i) => (i + 1) % total); setCompilationPlaying(false) }
      if (e.key === 'ArrowLeft')  { setCompilationIndex((i) => (i - 1 + total) % total); setCompilationPlaying(false) }
      if (e.key === 'Escape')     setJournalViewMode('timeline')
      if (e.key === ' ')          { e.preventDefault(); setCompilationPlaying((p) => !p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [journalViewMode, journalEntries])

  function handleSelectVehicle(vehicleId: string) {
    setActiveVehicle(vehicleId)
    setActiveView('overview')
  }

  function handleDeleteVehicle(vehicleId: string) {
    const vehicle = vehicles.find((entry) => entry.id === vehicleId)
    if (!vehicle) return
    const confirmed = window.confirm(`Remove ${getVehicleLabel(vehicle)} from this local garage?`)
    if (!confirmed) return

    const nextVehicles = deleteVehicle(vehicleId)
    setVehicles(nextVehicles)
    setActiveVehicle(nextVehicles[0]?.id ?? '')
    setChecked(new Set(nextVehicles[0] ? loadCheckedParts(nextVehicles[0].id) : []))
  }

  // ── Export / Import all build data ──────────────────────────────────────
  const importFileRef = useRef<HTMLInputElement>(null)

  function handleExportData() {
    const KEYS = [
      'modvora_intake', 'modvora_vehicles', 'modvora_active_vehicle_id',
      'modvora_checked_parts_by_vehicle', 'modvora_product_selections_by_vehicle',
      'modvora_build_tracker_by_vehicle', 'modvora_build_milestones_by_vehicle',
      'modvora_build_photos_by_vehicle', 'modvora_part_photos_by_vehicle',
      'modvora_build_journal_by_vehicle',
    ]
    const data: Record<string, string> = {}
    KEYS.forEach((k) => { const v = localStorage.getItem(k); if (v) data[k] = v })
    // also grab per-vehicle dynamic keys
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!
      if (k.startsWith('modvora_hidden_parts_') || k.startsWith('modvora_custom_mods_') || k.startsWith('modvora_parts_order_')) {
        data[k] = localStorage.getItem(k)!
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `modvora-build-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target!.result as string) as Record<string, string>
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v))
        window.location.reload()
      } catch {
        alert('Invalid backup file.')
      }
    }
    reader.readAsText(file)
  }

  function handleToggle(id: string) {
    if (!intake) return

    setChecked((prev) => {
      const next = new Set(Array.from(prev))
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveCheckedParts(intake.id, Array.from(next))
      return next
    })
  }

  function moveActiveVehicle(direction: 'left' | 'right') {
    if (!intake || vehicles.length < 2) return
    const currentIndex = vehicles.findIndex((vehicle) => vehicle.id === intake.id)
    const delta = direction === 'left' ? -1 : 1
    const nextIndex = (currentIndex + delta + vehicles.length) % vehicles.length
    const reordered = [...vehicles]
    const [current] = reordered.splice(currentIndex, 1)
    reordered.splice(nextIndex, 0, current)
    saveVehicles(reordered)
    setVehicles(reordered)
  }

  function toggleMilestone(milestoneId: string) {
    if (!intake) return
    const next = milestones.map((m) =>
      m.id === milestoneId ? { ...m, done: !m.done, updatedAt: new Date().toISOString() } : m,
    )
    setMilestones(next)
    saveBuildMilestones(intake.id, next)
  }

  function addMilestone() {
    if (!intake) return
    const title = window.prompt('Milestone title (example: Install suspension + alignment)')
    if (!title?.trim()) return
    const next: BuildMilestone = {
      id: `ms_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      done: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const list = [...milestones, next]
    setMilestones(list)
    saveBuildMilestones(intake.id, list)
  }

  function addPhotoLog() {
    if (!intake || !photoUrl.trim()) return
    addBuildPhoto(intake.id, { caption: photoCaption, imageUrl: photoUrl })
    setPhotoCaption('')
    setPhotoUrl('')
    setPhotos(loadBuildPhotos(intake.id))
  }

  function openPartPhotoModal(partId: string, partName: string) {
    setPartModalId(partId)
    setPartModalName(partName)
  }

  function handleSavePartPhoto(data: Omit<PartPhoto, 'id' | 'createdAt'>) {
    if (!intake) return
    const photo: PartPhoto = {
      ...data,
      id: `pp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    }
    savePartPhoto(intake.id, photo)
    setPartPhotos(loadPartPhotos(intake.id))
  }

  function handleDeletePartPhoto(photoId: string) {
    if (!intake) return
    deletePartPhoto(intake.id, photoId)
    setPartPhotos(loadPartPhotos(intake.id))
  }

  function handleSaveJournalEntry(data: Omit<JournalEntry, 'id' | 'createdAt'>) {
    if (!intake) return
    if (editingEntry) {
      const updated: JournalEntry = { ...editingEntry, ...data }
      updateJournalEntry(intake.id, updated)
    } else {
      const entry: JournalEntry = {
        ...data,
        id: `je_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      }
      saveJournalEntry(intake.id, entry)
    }
    setJournalEntries(loadJournal(intake.id))
    setJournalModalOpen(false)
    setEditingEntry(null)
  }

  function handleDeleteJournalEntry(entryId: string) {
    if (!intake) return
    deleteJournalEntry(intake.id, entryId)
    setJournalEntries(loadJournal(intake.id))
  }

  function handleHidePart(partId: string) {
    if (!intake) return
    setHiddenParts((prev) => {
      const next = new Set(Array.from(prev))
      next.add(partId)
      localStorage.setItem(`modvora_hidden_parts_${intake.id}`, JSON.stringify(Array.from(next)))
      return next
    })
  }

  function handleUnhidePart(partId: string) {
    if (!intake) return
    setHiddenParts((prev) => {
      const next = new Set(Array.from(prev))
      next.delete(partId)
      localStorage.setItem(`modvora_hidden_parts_${intake.id}`, JSON.stringify(Array.from(next)))
      return next
    })
  }

  function handleAddCustomMod(name: string) {
    if (!intake) return
    const mod = { id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name }
    setCustomMods((prev) => {
      const next = [...prev, mod]
      localStorage.setItem(`modvora_custom_mods_${intake.id}`, JSON.stringify(next))
      return next
    })
    setPartsOrder((prev) => {
      const next = [...prev, mod.id]
      localStorage.setItem(`modvora_parts_order_${intake.id}`, JSON.stringify(next))
      return next
    })
  }

  function handleRemoveCustomMod(modId: string) {
    if (!intake) return
    setCustomMods((prev) => {
      const next = prev.filter((m) => m.id !== modId)
      localStorage.setItem(`modvora_custom_mods_${intake.id}`, JSON.stringify(next))
      return next
    })
    setPartsOrder((prev) => {
      const next = prev.filter((id) => id !== modId)
      localStorage.setItem(`modvora_parts_order_${intake.id}`, JSON.stringify(next))
      return next
    })
  }

  function handleReorder(newOrder: string[]) {
    if (!intake) return
    setPartsOrder(newOrder)
    localStorage.setItem(`modvora_parts_order_${intake.id}`, JSON.stringify(newOrder))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Hero card skeleton */}
          <div className="rounded-[32px] border border-[#212129] bg-[#141419] px-6 py-6 sm:px-7 space-y-4">
            <div className="flex items-center gap-3">
              <div className="skeleton h-2 w-2 rounded-full" />
              <div className="skeleton h-3 w-24 rounded-full" />
              <div className="skeleton h-5 w-28 rounded-full" />
            </div>
            <div className="skeleton h-9 w-64 rounded-xl" />
            <div className="skeleton h-4 w-80 rounded-full" />
            <div className="skeleton h-12 w-full max-w-lg rounded-2xl" />
            <div className="flex gap-2 pt-1">
              <div className="skeleton h-9 w-28 rounded-xl" />
              <div className="skeleton h-9 w-32 rounded-xl" />
              <div className="skeleton h-9 w-28 rounded-xl" />
            </div>
          </div>
          {/* Tab bar skeleton */}
          <div className="rounded-2xl border border-[#23232a] bg-[#111116]/85 p-2 flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton flex-1 h-14 rounded-xl" />
            ))}
          </div>
          {/* Stat cards skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#212129] bg-[#141419] p-5 space-y-3">
                <div className="skeleton h-8 w-8 rounded-xl" />
                <div className="skeleton h-7 w-16 rounded-lg" />
                <div className="skeleton h-3 w-20 rounded-full" />
                <div className="skeleton h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!intake) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🏎️</div>
          <h2 className="text-white text-2xl font-bold mb-3">No Build Plan Found</h2>
          <p className="text-zinc-400 mb-6">Submit your vehicle details to create your first saved build, then keep adding more from the dashboard.</p>
          <a href="/intake" className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-xl transition-colors inline-block">Start My First Build →</a>
        </div>
      </div>
    )
  }

  const completion = parts.length ? Math.round((checked.size / parts.length) * 100) : 0

  // ── Dependency & conflict warnings ──────────────────────────────────────────
  const trackedIds = new Set([
    ...Array.from(checked),
    ...Object.keys(trackerItems),
  ])
  const dependencyWarnings = parts
    .filter(p => p.requires && trackedIds.has(p.id))
    .flatMap(p => (p.requires ?? [])
      .filter(reqId => !trackedIds.has(reqId))
      .map(reqId => ({ part: p, missing: parts.find(x => x.id === reqId) ?? null, missingId: reqId }))
    )
  const conflictWarnings = parts
    .filter(p => p.conflictsWith && checked.has(p.id))
    .flatMap(p => (p.conflictsWith ?? [])
      .filter(cId => checked.has(cId))
      .map(cId => ({ partA: p, partB: parts.find(x => x.id === cId) ?? null }))
    )
    .filter((w, i, arr) => i === arr.findIndex(x =>
      (x.partA.id === w.partA.id && x.partB?.id === w.partB?.id) ||
      (x.partA.id === w.partB?.id && x.partB?.id === w.partA.id)
    ))

  // ── Budget awareness ─────────────────────────────────────────────────────────
  const budgetMax = parseBudgetMax(intake.budget)
  const plannedCostMin = parts.filter(p => trackedIds.has(p.id)).reduce((s, p) => s + p.priceRange.min, 0)
  const plannedCostMax = parts.filter(p => trackedIds.has(p.id)).reduce((s, p) => s + p.priceRange.max, 0)
  const budgetPct = budgetMax ? Math.min((plannedCostMax / budgetMax) * 100, 100) : 0
  const overBudget = budgetMax ? plannedCostMax > budgetMax : false
  const milestonesDone = milestones.filter((m) => m.done).length
  const tabs: Array<{ id: 'overview' | 'plan' | 'progress' | 'journal' | 'garage'; label: string; hint: string }> = [
    { id: 'overview',  label: 'Overview',  hint: 'Stats + Build DNA'                   },
    { id: 'plan',      label: 'Plan',      hint: 'Timeline + parts checklist'          },
    { id: 'progress',  label: 'Progress',  hint: 'Milestones & part photos'            },
    { id: 'journal',   label: 'Journal',   hint: `${journalEntries.length} entries`    },
    { id: 'garage',    label: 'Garage',    hint: 'Switch and manage vehicles'          },
  ]

  const dismissWelcome = () => {
    localStorage.setItem('modvora_welcomed', '1')
    setShowWelcome(false)
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-10 space-y-6">

        {/* ── Welcome banner (first-time users only) ──────────────────── */}
        {showWelcome && (
          <div className="relative overflow-hidden rounded-2xl border border-[#A020F0]/30 bg-gradient-to-r from-[#A020F0]/12 via-[#A020F0]/6 to-[#1a1a1e] px-6 py-5 fade-in">
            <div className="absolute top-0 right-0 w-56 h-56 bg-[#A020F0]/8 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#A020F0]" />
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#A020F0]">Welcome to your garage</p>
                </div>
                <p className="text-white font-semibold text-sm">Your build dashboard is ready.</p>
                <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                  Log mods in <strong className="text-zinc-300">Plan</strong>, track progress in <strong className="text-zinc-300">Progress</strong>, and write your story in <strong className="text-zinc-300">Journal</strong>. Everything saves automatically.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href="/how-it-works" className="rounded-xl border border-[#A020F0]/30 bg-[#A020F0]/10 px-4 py-2 text-xs font-semibold text-purple-300 transition-all hover:bg-[#A020F0]/20 hover:text-white">
                  How it works
                </a>
                <button
                  onClick={dismissWelcome}
                  className="rounded-xl border border-[#2c2c32] bg-[#1a1a1e] px-4 py-2 text-xs font-semibold text-zinc-400 transition-all hover:text-white hover:border-zinc-600"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-[32px] border border-[#212129] bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.14),transparent_38%),linear-gradient(180deg,#141419_0%,#0e0e12_100%)] px-6 py-6 sm:px-7">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <p className="text-sm font-medium text-green-400">Build plan ready</p>
            <span className="rounded-full border border-[#2a2a30] bg-[#16161a] px-3 py-1 text-xs text-zinc-400">Vehicle {vehicles.findIndex((v) => v.id === intake.id) + 1} of {vehicles.length}</span>
            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs text-green-300">{completion}% complete</span>
          </div>

          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">My Build</h1>
              <p className="mt-3 text-sm text-zinc-400 sm:text-base">{intake.year} {intake.make} {intake.model}{intake.trim ? ` ${intake.trim}` : ''} · {intake.focus} focused · {intake.budget} budget</p>
              {intake.goals && <p className="mt-4 max-w-2xl rounded-2xl border border-purple-500/15 bg-purple-500/8 px-4 py-3 text-sm leading-relaxed text-zinc-300"><span className="font-medium text-purple-300">Goal:</span> {intake.goals}</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              {vehicles.length > 1 && (
                <>
                  <button onClick={() => moveActiveVehicle('left')} className="rounded-xl border border-[#2a2a30] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Move earlier</button>
                  <button onClick={() => moveActiveVehicle('right')} className="rounded-xl border border-[#2a2a30] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Move later</button>
                </>
              )}
              <a href={`/dashboard/publish?vehicle=${intake.id}`} className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-500">Publish build</a>
              <a href="/community" className="rounded-xl border border-[#2a2a30] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">View community</a>
              <a href={`/intake?vehicle=${intake.id}`} className="rounded-xl border border-[#2a2a30] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Edit vehicle</a>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-[#23232a] bg-[#111116]/85 p-2 backdrop-blur">
          {tabs.map((tab) => {
            const active = activeView === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex min-w-[170px] flex-1 flex-col rounded-xl px-4 py-3 text-left transition-all ${active ? 'bg-purple-600 text-white shadow-[0_14px_40px_rgba(168,85,247,0.22)]' : 'text-zinc-400 hover:bg-[#18181d] hover:text-white'}`}
              >
                <span className="text-sm font-semibold">{tab.label}</span>
                <span className={`mt-1 text-xs ${active ? 'text-purple-100/80' : 'text-zinc-500'}`}>{tab.hint}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content — full-width for journal, constrained otherwise ── */}
      <div className={`mt-6 pb-10 ${activeView === 'journal' ? 'px-4 sm:px-6' : 'mx-auto max-w-6xl px-4 sm:px-6'}`}>

        {activeView === 'overview' && (
          <div className="space-y-6 tab-panel">
            <BuildSummary
              parts={parts}
              checkedCount={checked.size}
              trackedSpend={trackedSpend}
              installedCount={installedCount}
              milestonesDone={milestonesDone}
              milestonesTotal={milestones.length}
            />
            <BuildSnapshot parts={parts} checked={checked} trackerItems={trackerItems} hiddenParts={hiddenParts} />
            <div className="grid gap-6 xl:grid-cols-2">
              <HpEstimator parts={parts} checked={checked} vehicle={intake} />
              <BuildDnaCard />
            </div>
          </div>
        )}

        {activeView === 'progress' && (
          <div className="space-y-6 tab-panel">
            {/* Show Mode toggle */}
            {(photos.length > 0 || partPhotos.length > 0) && (
              <div className="flex items-center justify-between rounded-2xl border border-[#232328] bg-[#171719] px-5 py-3.5 fade-in">
                <div>
                  <p className="text-sm font-semibold text-white">Show Mode</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Cinematic view — hides costs, shows your story</p>
                </div>
                <button
                  onClick={() => setShowMode(true)}
                  className="flex items-center gap-2 rounded-xl bg-[#A020F0] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-purple-500 active:scale-[0.97]"
                  aria-label="Enter Show Mode"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Enter Show Mode
                </button>
              </div>
            )}
            {/* Journal milestones highlight strip */}
            {journalEntries.filter((e) => e.isMilestone).length > 0 && (
              <SectionShell eyebrow="Major Milestones" title="Big wins" description="Journal entries you flagged as milestones, chronologically.">
                <div className="space-y-3">
                  {[...journalEntries]
                    .filter((e) => e.isMilestone)
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((entry) => {
                      const entryDate = new Date(entry.date + 'T12:00:00')
                      return (
                        <div key={entry.id} className="flex items-start gap-4 rounded-2xl border border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.07),rgba(17,17,22,0))] bg-[#111116] p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-xl">⭐</div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-amber-200">{entry.milestoneLabel || 'Major Milestone'}</p>
                            <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{entry.narrative}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <span className="text-xs text-zinc-500">
                                {entryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </span>
                              {entry.mileage != null && (
                                <span className="text-xs text-zinc-600">{entry.mileage.toLocaleString()} mi</span>
                              )}
                              {entry.partName && (
                                <span className="rounded-full border border-purple-500/20 bg-purple-500/8 px-2 py-0.5 text-[10px] text-purple-300">{entry.partName}</span>
                              )}
                            </div>
                          </div>
                          {entry.photos.length > 0 && (
                            <img
                              src={entry.photos[0]}
                              alt=""
                              className="h-16 w-16 shrink-0 cursor-zoom-in rounded-xl border border-[#2a2a30] object-cover"
                              onClick={() => setProgressLightbox(entry.photos[0])}
                            />
                          )}
                        </div>
                      )
                    })}
                </div>
              </SectionShell>
            )}

            <SectionShell eyebrow="Milestones" title="Build milestones" description="Check things off as you go.">
              <div className="space-y-2">
                <div className="flex justify-end">
                  <button onClick={addMilestone} className="rounded-lg border border-[#2a2a30] px-3 py-1.5 text-xs text-zinc-300 hover:text-white">+ Add milestone</button>
                </div>
                {milestones.length ? milestones.map((m) => (
                  <button key={m.id} onClick={() => toggleMilestone(m.id)} className="flex w-full items-center gap-2 rounded-xl border border-[#2a2a30] bg-[#111116] px-3 py-2 text-left">
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${m.done ? 'border-green-500 bg-green-500 text-white' : 'border-zinc-600 text-zinc-500'}`}>{m.done ? '✓' : ''}</span>
                    <span className={`text-sm ${m.done ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{m.title}</span>
                  </button>
                )) : <p className="text-sm text-zinc-500">No milestones yet. Add one above.</p>}
              </div>
            </SectionShell>

            {/* Recent Progress visual timeline */}
            {partPhotos.length > 0 ? (
              <SectionShell eyebrow="Visual Log" title="Recent progress" description="Photos across all parts, most recent first.">
                <div className="space-y-1">
                  {[...partPhotos]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 20)
                    .map((photo, idx, arr) => (
                      <div key={photo.id} className="relative flex gap-4">
                        {/* Vertical line */}
                        {idx < arr.length - 1 && (
                          <div className="absolute left-[13px] top-8 bottom-0 w-px bg-[#2a2a30]" />
                        )}
                        {/* Tag dot */}
                        <div className={`relative mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          photo.tag === 'unboxing' ? 'border-blue-500/30 bg-blue-500/10' :
                          photo.tag === 'installation' ? 'border-yellow-500/30 bg-yellow-500/10' :
                          'border-green-500/30 bg-green-500/10'
                        }`}>
                          <div className={`h-2.5 w-2.5 rounded-full ${tagConfig[photo.tag].dot}`} />
                        </div>
                        {/* Content */}
                        <div className="flex min-w-0 flex-1 items-start gap-3 pb-4">
                          <img
                            src={photo.imageData}
                            alt={photo.caption || photo.partName}
                            className="h-16 w-16 shrink-0 cursor-zoom-in rounded-xl border border-[#2a2a30] object-cover transition-opacity hover:opacity-90"
                            onClick={() => setProgressLightbox(photo.imageData)}
                          />
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p className="truncate text-sm font-semibold text-white">{photo.partName}</p>
                            <span className={`text-[10px] font-medium ${tagConfig[photo.tag].text}`}>{tagConfig[photo.tag].label}</span>
                            {photo.caption && <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{photo.caption}</p>}
                            <p className="mt-1 text-[11px] text-zinc-600">
                              {new Date(photo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </SectionShell>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#2a2a30] py-14 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2a2a30] bg-[#111116]">
                  <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-zinc-300">No progress photos yet</p>
                <p className="mt-1 text-xs text-zinc-600">Go to the Plan tab and click the camera icon on any part to add photos.</p>
              </div>
            )}
          </div>
        )}

        {activeView === 'plan' && (
          <div className="space-y-6 tab-panel">
            {/* Conflict warnings */}
            {conflictWarnings.length > 0 && (
              <div className="rounded-2xl border border-red-500/25 bg-red-500/8 p-4 space-y-1.5">
                <p className="text-sm font-semibold text-red-300">⚠ Part conflict detected</p>
                {conflictWarnings.map(w => (
                  <p key={`${w.partA.id}-${w.partB?.id}`} className="text-xs text-red-200/70">
                    {w.partA.name} and {w.partB?.name} are redundant — using both is not recommended. Pick one.
                  </p>
                ))}
              </div>
            )}

            {/* Dependency warnings */}
            {dependencyWarnings.length > 0 && (
              <div className="rounded-2xl border border-orange-500/25 bg-orange-500/8 p-4 space-y-1.5">
                <p className="text-sm font-semibold text-orange-300">Recommended additions</p>
                {dependencyWarnings.map(w => (
                  <p key={`${w.part.id}-${w.missingId}`} className="text-xs text-orange-200/70">
                    {w.part.name} works best with <span className="text-orange-300 font-medium">{w.missing?.name ?? w.missingId}</span> — consider adding it to your plan.
                  </p>
                ))}
              </div>
            )}

            {/* Budget bar */}
            {budgetMax && (
              <div className="rounded-2xl border border-[#2a2a30] bg-[#0d0d12] p-4">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-zinc-500">Est. planned cost</span>
                  <span className={overBudget ? 'text-red-400 font-semibold' : 'text-zinc-400'}>
                    ${plannedCostMin.toLocaleString()}–${plannedCostMax.toLocaleString()} of ${budgetMax.toLocaleString()} budget{overBudget ? ' — over budget' : ''}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#1e1e24]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${overBudget ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-green-400'}`}
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
              </div>
            )}

            <SectionShell eyebrow="Roadmap" title="Recommended build order" description="Phases help keep the project manageable instead of turning into one giant wall of tasks.">
              <PhaseTimeline parts={parts.filter(p => !hiddenParts.has(p.id))} checked={checked} trackerItems={trackerItems} />
            </SectionShell>

            <SectionShell eyebrow="Checklist" title="Full ranked parts plan" description="Everything is still here — just moved into its own focused space so it doesn't dominate the whole dashboard.">
              <Top10
                topRated={topRated}
                checked={checked}
                onToggle={handleToggle}
                hiddenParts={hiddenParts}
                customMods={customMods}
                partsOrder={partsOrder}
                onHide={handleHidePart}
                onUnhide={handleUnhidePart}
                onAddMod={handleAddCustomMod}
                onRemoveMod={handleRemoveCustomMod}
                onReorder={handleReorder}
                onOpenPartPhotos={openPartPhotoModal}
              />
            </SectionShell>
          </div>
        )}

        {activeView === 'journal' && (() => {
          // ── shared derived data ──────────────────────────────────────
          const sorted = [...journalEntries].sort((a, b) => b.date.localeCompare(a.date))
          const milestones = sorted.filter((e) => e.isMilestone)
          const totalPhotos = sorted.reduce((n, e) => n + (e.photos?.length ?? 0), 0)
          const journeyDays = sorted.length > 0
            ? Math.round((new Date().getTime() - new Date(sorted[sorted.length - 1].date + 'T12:00:00').getTime()) / 86400000)
            : 0

          // ── streak calculation (wrench entries AND scenic photo posts) ──
          function computeStreak(): number {
            if (!sorted.length) return 0
            const days = new Set(sorted.map((e) => e.date))
            let streak = 0
            const today = new Date()
            for (let i = 0; i < 365; i++) {
              const d = new Date(today)
              d.setDate(d.getDate() - i)
              const key = d.toISOString().slice(0, 10)
              if (days.has(key)) streak++
              else if (i > 0) break
            }
            return streak
          }
          const streak = computeStreak()

          // ── filtering ────────────────────────────────────────────────
          const filtered = sorted.filter((e) => {
            if (journalFilter === 'milestones' && !e.isMilestone) return false
            if (journalFilter === 'photos' && (!e.photos || e.photos.length === 0)) return false
            if (journalSearch.trim()) {
              const q = journalSearch.toLowerCase()
              return (
                e.narrative?.toLowerCase().includes(q) ||
                e.partName?.toLowerCase().includes(q) ||
                e.milestoneLabel?.toLowerCase().includes(q)
              )
            }
            return true
          })

          // ── book-view derived data (kept for book mode) ──────────────
          const ENTRIES_PER_PAGE = 5
          const bookSorted = [...journalEntries].sort((a, b) => a.date.localeCompare(b.date))
          const pages: JournalEntry[][] = []
          for (let i = 0; i < bookSorted.length; i += ENTRIES_PER_PAGE) {
            pages.push(bookSorted.slice(i, i + ENTRIES_PER_PAGE))
          }
          const totalPages = pages.length
          const entryPageMap = new Map<string, number>()
          pages.forEach((pg, idx) => pg.forEach((e) => entryPageMap.set(e.id, idx + 1)))

          function navigateJournalPage(newPage: number) {
            if (journalAnimPhase !== 'idle') return
            setJournalAnimDir(newPage > journalPage ? 'forward' : 'back')
            setJournalAnimPhase('out')
            setTimeout(() => {
              setJournalPage(newPage)
              setJournalAnimPhase('in')
              setTimeout(() => setJournalAnimPhase('idle'), 400)
            }, 400)
          }

          const flipAnimClass =
            journalAnimPhase === 'out'
              ? journalAnimDir === 'forward' ? 'page-flip-out' : 'page-flip-out-back'
              : journalAnimPhase === 'in'
              ? journalAnimDir === 'forward' ? 'page-flip-in' : 'page-flip-in-back'
              : ''

          const leftFlipClass  = journalAnimDir === 'back'    ? flipAnimClass : ''
          const rightFlipClass = journalAnimDir === 'forward' ? flipAnimClass : ''
          const leftStyle  = journalAnimDir === 'back'    && journalAnimPhase !== 'idle' ? { transformOrigin: 'right center', willChange: 'transform' as const } : {}
          const rightStyle = journalAnimDir === 'forward' && journalAnimPhase !== 'idle' ? { transformOrigin: 'left center',  willChange: 'transform' as const } : {}

          function deriveChapter(entries: JournalEntry[]): string {
            const names = entries.flatMap((e) => (e.partName ? [e.partName] : []))
            const unique = Array.from(new Set(names))
            if (unique.length >= 2) return unique.slice(0, 2).join(' & ')
            if (unique.length === 1) return unique[0]
            const dates = entries.map((e) => new Date(e.date + 'T12:00:00'))
            const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            const first = fmt(dates[0])
            const last  = fmt(dates[dates.length - 1])
            return first === last ? first : `${first} – ${last}`
          }

          function PageHdr({ chapter, pageLabel }: { chapter: string; pageLabel: string }) {
            return (
              <div className="mb-3 flex items-start justify-between border-b border-zinc-200 pb-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Build Journal</p>
                  {chapter && <p className="mt-0.5 text-[10px] font-semibold text-zinc-600 truncate max-w-[120px]">{chapter}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] text-zinc-400">{intake?.year} {intake?.make} {intake?.model}</p>
                  <p className="text-[9px] font-semibold text-zinc-500">{pageLabel}</p>
                </div>
              </div>
            )
          }

          function renderEntries(entries: JournalEntry[]) {
            return (
              <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '62vh' }}>
                {entries.map((entry, idx) => {
                  const d = new Date(entry.date + 'T12:00:00')
                  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  return (
                    <div key={entry.id} className={`group relative ${idx < entries.length - 1 ? 'border-b border-zinc-200 pb-4' : ''}`}>
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-zinc-700">{dateStr}</span>
                        {entry.mileage != null && <span className="text-[9px] text-zinc-400">{entry.mileage.toLocaleString()} mi</span>}
                        {entry.isMilestone && (
                          <span className="rounded-full border border-amber-400/50 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">⭐ {entry.milestoneLabel || 'Milestone'}</span>
                        )}
                        {entry.partName && (
                          <span className="rounded-full border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[9px] text-purple-600">{entry.partName}</span>
                        )}
                        <div className="ml-auto flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => { setEditingEntry(entry); setJournalModalOpen(true) }} className="text-[9px] text-zinc-400 hover:text-zinc-700">Edit</button>
                          <button onClick={() => { if (window.confirm('Remove this entry?')) handleDeleteJournalEntry(entry.id) }} className="text-[9px] text-zinc-400 hover:text-red-500">Delete</button>
                        </div>
                      </div>
                      {entry.narrative && <p className="text-[11px] leading-relaxed text-zinc-600 whitespace-pre-wrap line-clamp-5">{entry.narrative}</p>}
                      {entry.photos.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {entry.photos.map((src, pi) => (
                            <img key={pi} src={src} alt="" onClick={() => setProgressLightbox(src)}
                              className="max-h-28 w-auto cursor-zoom-in rounded border border-zinc-200 object-contain hover:opacity-90"
                              style={{ maxWidth: entry.photos.length === 1 ? '100%' : '47%' }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          }

          function leftContent() {
            if (journalPage === 0) {
              return (
                <div className="flex h-full min-h-[56vh] flex-col items-center justify-center px-5 text-center select-none">
                  <div className="mb-3 w-6 h-px bg-zinc-400" />
                  <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-400 mb-4">Modvora Labs</p>
                  <p className="text-[28px] font-black leading-none tracking-tight text-zinc-700">BUILD</p>
                  <p className="text-[28px] font-black leading-none tracking-tight text-zinc-700">JOURNAL</p>
                  <div className="my-4 w-6 h-px bg-zinc-400" />
                  <p className="text-xs font-semibold text-zinc-600">{intake?.year} {intake?.make} {intake?.model}</p>
                  <p className="mt-1 text-[9px] text-zinc-400">Performance Build</p>
                  <div className="mt-6 text-3xl" style={{ opacity: 0.1 }}>🔧</div>
                  {sorted.length > 0 && (
                    <div className="mt-6 space-y-1">
                      <p className="text-[9px] text-zinc-400"><span className="font-bold text-zinc-600">{sorted.length}</span> entries</p>
                      <p className="text-[9px] text-zinc-400"><span className="font-bold text-zinc-600">{milestones.length}</span> milestones</p>
                    </div>
                  )}
                </div>
              )
            }
            if (journalPage === 1) {
              return (
                <div className="p-5">
                  <PageHdr chapter="Table of Contents" pageLabel="TOC" />
                  <div className="space-y-1">
                    {pages.map((pg, idx) => (
                      <button key={idx} onClick={() => navigateJournalPage(idx + 1)}
                        className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left hover:bg-zinc-100">
                        <span className="w-4 text-[9px] text-zinc-400 font-mono">{idx + 1}</span>
                        <span className="flex-1 text-[10px] text-zinc-600 truncate">{deriveChapter(pg)}</span>
                        <span className="text-[9px] text-zinc-300">p.{idx + 2}</span>
                      </button>
                    ))}
                    {milestones.length > 0 && <>
                      <div className="my-2 border-t border-zinc-200" />
                      <p className="px-1 text-[8px] uppercase tracking-widest text-zinc-400 mb-1">Milestones</p>
                      {milestones.map((m) => {
                        const pg = entryPageMap.get(m.id) ?? 1
                        return (
                          <button key={m.id} onClick={() => navigateJournalPage(pg)}
                            className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left hover:bg-amber-50">
                            <span className="text-[10px]">⭐</span>
                            <span className="flex-1 text-[10px] text-zinc-600 truncate">{m.milestoneLabel || 'Milestone'}</span>
                            <span className="text-[9px] text-amber-600 font-semibold">p.{pg + 1}</span>
                          </button>
                        )
                      })}
                    </>}
                  </div>
                </div>
              )
            }
            const prevEntries = pages[journalPage - 2] ?? []
            return (
              <div className="p-5">
                <PageHdr chapter={`Chapter: ${deriveChapter(prevEntries)}`} pageLabel={`Page ${journalPage}`} />
                {renderEntries(prevEntries)}
              </div>
            )
          }

          function rightContent() {
            if (journalPage === 0) {
              return (
                <div className="p-5">
                  <PageHdr chapter="Table of Contents" pageLabel="TOC" />
                  {sorted.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="mb-2 text-3xl opacity-25">📖</div>
                      <p className="text-xs font-medium text-zinc-600">No entries yet</p>
                      <p className="mt-1 text-[10px] text-zinc-400">Start documenting your build.</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4 grid grid-cols-3 gap-1.5">
                        {[{ label: 'Entries', value: sorted.length }, { label: 'Milestones', value: milestones.length }, { label: 'Pages', value: totalPages }].map((s) => (
                          <div key={s.label} className="rounded-lg border border-zinc-200 bg-white/60 p-2 text-center">
                            <p className="text-base font-black text-zinc-800">{s.value}</p>
                            <p className="text-[8px] uppercase tracking-wide text-zinc-400">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {pages.map((pg, idx) => (
                          <button key={idx} onClick={() => navigateJournalPage(idx + 1)}
                            className="group flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-zinc-100">
                            <span className="w-5 text-[10px] font-bold text-zinc-400">{idx + 1}</span>
                            <span className="flex-1 text-xs font-medium text-zinc-700">{deriveChapter(pg)}</span>
                            <span className="text-[10px] text-zinc-300 group-hover:text-zinc-500">→ p.{idx + 2}</span>
                          </button>
                        ))}
                      </div>
                      {milestones.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-1.5 text-[8px] uppercase tracking-widest text-zinc-400">Milestones</p>
                          {milestones.map((m) => {
                            const pg = entryPageMap.get(m.id) ?? 1
                            return (
                              <button key={m.id} onClick={() => navigateJournalPage(pg)}
                                className="group flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-amber-50">
                                <span>⭐</span>
                                <span className="flex-1 text-xs font-semibold text-zinc-700">{m.milestoneLabel || 'Milestone'}</span>
                                <span className="text-[10px] text-zinc-400">{new Date(m.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span className="text-[10px] font-semibold text-amber-600">p.{pg + 1}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            }
            const pageEntries = pages[journalPage - 1] ?? []
            return (
              <div className="p-5">
                <PageHdr chapter={`Chapter: ${deriveChapter(pageEntries)}`} pageLabel={`Page ${journalPage + 1} / ${totalPages + 1}`} />
                {renderEntries(pageEntries)}
              </div>
            )
          }

          // ── mood config ──────────────────────────────────────────────
          const MOOD_MAP: Record<string, { label: string; color: string }> = {
            hyped:         { label: '🔥 Hyped',     color: 'border-orange-500/30 bg-orange-500/10 text-orange-300' },
            grinding:      { label: '⚙️ Grinding',  color: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300' },
            satisfied:     { label: '✅ Satisfied',  color: 'border-green-500/30 bg-green-500/10 text-green-300' },
            problem_solved:{ label: '💡 Solved it', color: 'border-blue-500/30 bg-blue-500/10 text-blue-300' },
            frustrated:    { label: '😤 Frustrated', color: 'border-red-500/30 bg-red-500/10 text-red-300' },
          }

          return (
            <div className="space-y-5 tab-panel">

              {/* ── header ─────────────────────────────────────────────── */}
              <div className="flex flex-wrap items-start gap-4 justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Build Journal</h2>
                  <p className="mt-0.5 text-sm text-zinc-500">Every wrench turn. Every scenic stop.</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* view toggle */}
                  <div className="flex rounded-xl border border-[#2a2a30] overflow-hidden">
                    <button
                      onClick={() => setJournalViewMode('timeline')}
                      className={`px-3 py-2 text-xs font-semibold transition-colors ${journalViewMode === 'timeline' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                    >Timeline</button>
                    <button
                      onClick={() => setJournalViewMode('book')}
                      className={`px-3 py-2 text-xs font-semibold transition-colors ${journalViewMode === 'book' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                    >Book</button>
                    <button
                      onClick={() => { setCompilationIndex(0); setCompilationPlaying(true); setJournalViewMode('compilation') }}
                      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${journalViewMode === 'compilation' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      Reel
                    </button>
                  </div>
                  <button
                    onClick={() => { setEditingEntry(null); setJournalModalOpen(true) }}
                    className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    New Entry
                  </button>
                </div>
              </div>

              {/* ── stats bar ──────────────────────────────────────────── */}
              {sorted.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Entries', value: sorted.length, icon: '📝' },
                    { label: 'Milestones', value: milestones.length, icon: '⭐' },
                    { label: 'Photos', value: totalPhotos, icon: '📷' },
                    streak > 0
                      ? { label: `${streak}-day streak`, value: streak, icon: '🔥' }
                      : { label: 'Journey days', value: journeyDays, icon: '📅' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-[#2a2a30] bg-[#111116] px-4 py-3 flex items-center gap-3">
                      <span className="text-xl leading-none">{s.icon}</span>
                      <div>
                        <p className="text-lg font-bold text-white leading-none">{s.value}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── timeline view ──────────────────────────────────────── */}
              {journalViewMode === 'timeline' && (
                <div className="space-y-4">
                  {/* search + filter */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative flex-1 min-w-[180px]">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                      <input
                        type="text"
                        placeholder="Search entries…"
                        value={journalSearch}
                        onChange={(e) => setJournalSearch(e.target.value)}
                        className="w-full rounded-xl border border-[#2a2a30] bg-[#111116] pl-8 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-purple-500/50 focus:outline-none"
                      />
                    </div>
                    {(['all', 'milestones', 'photos'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setJournalFilter(f)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold capitalize transition-colors ${journalFilter === f ? 'bg-purple-600 text-white' : 'border border-[#2a2a30] text-zinc-400 hover:text-white'}`}
                      >{f}</button>
                    ))}
                  </div>

                  {/* entries */}
                  {filtered.length === 0 && sorted.length === 0 ? (
                    /* empty state */
                    <div className="rounded-2xl border border-[#2a2a30] bg-[#0d0d12] px-6 py-16 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/8 text-3xl">🔧</div>
                      <h3 className="text-lg font-semibold text-white mb-2">Your build story starts here</h3>
                      <p className="text-sm text-zinc-500 max-w-sm mx-auto mb-6 leading-relaxed">
                        Log a wrench session, drop a scenic photo, or mark a milestone.
                        Every entry becomes part of your car&apos;s permanent record.
                      </p>
                      <button
                        onClick={() => { setEditingEntry(null); setJournalModalOpen(true) }}
                        className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        Write first entry
                      </button>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-[#2a2a30] bg-[#0d0d12] px-6 py-10 text-center">
                      <p className="text-zinc-500 text-sm">No entries match your search.</p>
                    </div>
                  ) : (
                    <div className="relative space-y-0">
                      {/* vertical spine */}
                      <div className="absolute left-[88px] top-0 bottom-0 w-px bg-[#2a2a30] hidden sm:block" />

                      {filtered.map((entry) => {
                        const d = new Date(entry.date + 'T12:00:00')
                        const dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        const yearStr = d.getFullYear().toString()
                        const isExpanded = expandedEntryId === entry.id
                        const mood = entry.mood ? MOOD_MAP[entry.mood] : null
                        const isScenicOnly = (entry.photos?.length ?? 0) > 0 && !entry.partId && !entry.narrative?.trim()

                        return (
                          <div key={entry.id} className="group flex gap-0 sm:gap-5">
                            {/* date column */}
                            <div className="hidden sm:flex flex-col items-end justify-start pt-4 w-[80px] shrink-0 text-right">
                              <span className="text-xs font-bold text-zinc-300 leading-none">{dayStr}</span>
                              <span className="text-[10px] text-zinc-600 mt-0.5">{yearStr}</span>
                            </div>

                            {/* dot */}
                            <div className="hidden sm:flex flex-col items-center shrink-0">
                              <div className={`mt-4 h-3 w-3 rounded-full border-2 shrink-0 z-10 ${entry.isMilestone ? 'border-amber-400 bg-amber-400/30' : isScenicOnly ? 'border-purple-400 bg-purple-400/20' : 'border-[#3a3a44] bg-[#111116]'}`} />
                            </div>

                            {/* card */}
                            <div className="flex-1 pb-4">
                              <div className={`rounded-2xl border transition-all duration-200 ${entry.isMilestone ? 'border-amber-500/25 bg-[#14120a]' : 'border-[#2a2a30] bg-[#111116]'} hover:border-purple-500/20`}>
                                {/* card header */}
                                <div className="flex flex-wrap items-start gap-2 px-4 pt-4 pb-2">
                                  {/* mobile date */}
                                  <span className="sm:hidden text-[11px] font-semibold text-zinc-500">{dayStr} {yearStr} ·</span>

                                  {entry.isMilestone && (
                                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-400">
                                      ⭐ {entry.milestoneLabel || 'Milestone'}
                                    </span>
                                  )}
                                  {isScenicOnly && (
                                    <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-400">📸 Scenic</span>
                                  )}
                                  {entry.partName && (
                                    <span className="rounded-full border border-purple-500/20 bg-purple-500/8 px-2 py-0.5 text-[10px] text-purple-400">{entry.partName}</span>
                                  )}
                                  {mood && (
                                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${mood.color}`}>{mood.label}</span>
                                  )}
                                  {entry.timeSpent != null && entry.timeSpent > 0 && (
                                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">⏱ {entry.timeSpent}h</span>
                                  )}
                                  {entry.mileage != null && (
                                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{entry.mileage.toLocaleString()} mi</span>
                                  )}

                                  {/* actions */}
                                  <div className="ml-auto flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingEntry(entry); setJournalModalOpen(true) }} className="text-[11px] text-zinc-500 hover:text-white transition-colors">Edit</button>
                                    <button onClick={() => { if (window.confirm('Delete this entry?')) handleDeleteJournalEntry(entry.id) }} className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors">Delete</button>
                                  </div>
                                </div>

                                {/* narrative */}
                                {entry.narrative?.trim() && (
                                  <div className="px-4 pb-3">
                                    <p className={`text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-3' : ''}`}>
                                      {entry.narrative}
                                    </p>
                                    {entry.narrative.length > 200 && (
                                      <button
                                        onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                                        className="mt-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                      >{isExpanded ? 'Show less' : 'Read more'}</button>
                                    )}
                                  </div>
                                )}

                                {/* photos */}
                                {entry.photos && entry.photos.length > 0 && (
                                  <div className={`px-4 pb-4 ${entry.photos.length === 1 ? '' : 'grid grid-cols-2 gap-1.5'}`}>
                                    {entry.photos.map((src, pi) => (
                                      <img
                                        key={pi}
                                        src={src}
                                        alt=""
                                        onClick={() => setProgressLightbox(src)}
                                        className="w-full rounded-xl object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                                        style={{ maxHeight: entry.photos.length === 1 ? '340px' : '180px' }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── compilation / reel view ───────────────────────────── */}
              {journalViewMode === 'compilation' && (() => {
                const slides = sorted
                  .filter((e) => e.photos && e.photos.length > 0)
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .flatMap((e) => e.photos.map((src) => ({ src, entry: e })))

                if (!slides.length) {
                  return (
                    <div className="rounded-2xl border border-[#2a2a30] bg-[#0d0d12] px-6 py-16 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/8 text-3xl">🎬</div>
                      <h3 className="text-lg font-semibold text-white mb-2">No photos yet</h3>
                      <p className="text-sm text-zinc-500 max-w-sm mx-auto">Add photos to your journal entries and they&apos;ll appear in your compilation reel.</p>
                    </div>
                  )
                }

                const safeIndex = compilationIndex % slides.length
                const slide = slides[safeIndex]
                const entryDate = new Date(slide.entry.date + 'T12:00:00')
                const mood = slide.entry.mood ? MOOD_MAP[slide.entry.mood] : null

                return (
                  <div className="relative overflow-hidden rounded-2xl bg-black flex items-center justify-center" style={{ minHeight: '80vh' }}>
                    {/* photo — natural aspect ratio, centered */}
                    <img
                      key={safeIndex}
                      src={slide.src}
                      alt=""
                      className="block max-h-[80vh] w-auto max-w-full transition-opacity duration-700"
                      style={{ opacity: 0.85 }}
                    />
                    {/* vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none" />

                    {/* top bar */}
                    <div className="relative z-10 flex items-center justify-between px-6 pt-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/50">Build Reel</span>
                        <span className="text-white/30 text-xs">·</span>
                        <span className="text-xs text-white/50">{intake?.year} {intake?.make} {intake?.model}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setCompilationPlaying((p) => !p)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white hover:bg-black/70 transition-colors"
                          aria-label={compilationPlaying ? 'Pause' : 'Play'}
                        >
                          {compilationPlaying
                            ? <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            : <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                          }
                        </button>
                        <button
                          onClick={() => setJournalViewMode('timeline')}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white hover:bg-black/70 transition-colors"
                          aria-label="Close reel"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>

                    {/* progress bar */}
                    <div className="relative z-10 flex gap-1 px-6 pt-3">
                      {slides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => { setCompilationIndex(i); setCompilationPlaying(false) }}
                          className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/20"
                          style={{ minWidth: 0 }}
                        >
                          <div
                            className={`h-full rounded-full transition-all ${i < safeIndex ? 'bg-white' : i === safeIndex ? (compilationPlaying ? 'bg-white compilation-progress' : 'bg-white/60') : 'bg-transparent'}`}
                            style={i === safeIndex && compilationPlaying ? { width: '100%', transition: 'width 4.5s linear' } : { width: i < safeIndex ? '100%' : '0%' }}
                          />
                        </button>
                      ))}
                    </div>

                    {/* nav arrows */}
                    <button
                      onClick={() => { setCompilationIndex((safeIndex - 1 + slides.length) % slides.length); setCompilationPlaying(false) }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                    </button>
                    <button
                      onClick={() => { setCompilationIndex((safeIndex + 1) % slides.length); setCompilationPlaying(false) }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                    </button>

                    {/* bottom info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-8 pt-20">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-white/70">
                          {entryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        {slide.entry.isMilestone && (
                          <span className="rounded-full border border-amber-400/60 bg-amber-400/15 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                            ⭐ {slide.entry.milestoneLabel || 'Milestone'}
                          </span>
                        )}
                        {mood && (
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${mood.color}`}>{mood.label}</span>
                        )}
                        {slide.entry.partName && (
                          <span className="rounded-full border border-purple-400/40 bg-purple-400/10 px-2.5 py-0.5 text-xs text-purple-300">{slide.entry.partName}</span>
                        )}
                      </div>
                      {slide.entry.narrative?.trim() && (
                        <p className="text-white/85 text-sm leading-relaxed max-w-xl line-clamp-3">{slide.entry.narrative}</p>
                      )}
                      <p className="mt-3 text-xs text-white/35">{safeIndex + 1} / {slides.length}</p>
                    </div>
                  </div>
                )
              })()}

              {/* ── book view ──────────────────────────────────────────── */}
              {journalViewMode === 'book' && (
                <div className="space-y-4">
                  <div className="mx-auto max-w-5xl" style={{ perspective: '2400px' }}>
                    <div className="flex overflow-hidden rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.55)]" style={{ minHeight: '620px' }}>

                      <div
                        className={`relative w-1/2 overflow-hidden bg-[#f0ece4] ${journalAnimPhase !== 'idle' && journalAnimDir === 'back' ? (journalAnimPhase === 'out' ? 'page-flip-out' : 'page-flip-in-back') : journalAnimPhase !== 'idle' && journalAnimDir === 'forward' ? '' : ''}`}
                        style={{ minHeight: '620px', ...(journalAnimDir === 'back' && journalAnimPhase !== 'idle' ? { transformOrigin: 'right center', willChange: 'transform' as const } : {}) }}
                      >
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/10 to-transparent z-10" />
                        {leftContent()}
                      </div>

                      <div className="relative z-20 w-6 shrink-0">
                        <div className="h-full w-full bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400" style={{ boxShadow: 'inset -3px 0 6px rgba(0,0,0,0.18), inset 3px 0 6px rgba(0,0,0,0.18)' }} />
                      </div>

                      <div
                        className={`relative w-1/2 overflow-hidden bg-[#f9f7f3] ${journalAnimPhase !== 'idle' && journalAnimDir === 'forward' ? (journalAnimPhase === 'out' ? 'page-flip-out' : 'page-flip-in') : ''}`}
                        style={{ minHeight: '620px', ...(journalAnimDir === 'forward' && journalAnimPhase !== 'idle' ? { transformOrigin: 'left center', willChange: 'transform' as const } : {}) }}
                      >
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/10 to-transparent z-10" />
                        {rightContent()}
                      </div>

                    </div>
                  </div>

                  <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <button
                      onClick={() => navigateJournalPage(Math.max(0, journalPage - 1))}
                      disabled={journalPage === 0 || journalAnimPhase !== 'idle'}
                      className="flex items-center gap-2 rounded-xl border border-[#2a2a30] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                      Flip Back
                    </button>
                    <button
                      onClick={() => navigateJournalPage(0)}
                      disabled={journalPage === 0}
                      className="text-xs text-zinc-500 hover:text-white transition-colors disabled:opacity-30"
                    >↑ Table of Contents</button>
                    <button
                      onClick={() => navigateJournalPage(Math.min(totalPages, journalPage + 1))}
                      disabled={journalPage >= totalPages || totalPages === 0 || journalAnimPhase !== 'idle'}
                      className="flex items-center gap-2 rounded-xl border border-[#2a2a30] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      Flip Forward
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )
        })()}

        {activeView === 'garage' && (
          <div className="space-y-6 tab-panel">
            <VehicleSwitcher vehicles={vehicles} activeVehicleId={intake.id} onSelect={handleSelectVehicle} onDelete={handleDeleteVehicle} />

            <div className="rounded-[28px] border border-purple-500/15 bg-[linear-gradient(180deg,#141419_0%,#101015_100%)] p-6 text-center">
              <h3 className="text-xl font-semibold text-white">Keep building your garage</h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">Each saved vehicle keeps its own recommendations and checklist locally, and now each one can become a community post without re-entering the car details.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button onClick={() => setShareModalOpen(true)} className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75V16.5ZM16.5 6.75h.75v.75h-.75v-.75Z" /></svg>
                  Generate QR Code
                </button>
                <a href="/dashboard/publish" className="rounded-xl border border-[#2a2a30] px-6 py-3 font-semibold text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Publish a Build</a>
                <a href="/community" className="rounded-xl border border-[#2a2a30] px-6 py-3 font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Browse Community</a>
                <a href="/dashboard/admin/botw" className="rounded-xl border border-amber-500/30 px-6 py-3 font-medium text-amber-300 transition-colors hover:border-amber-500/60 hover:text-white">🏆 Build of the Week</a>
                <a href="/intake?new=1" className="rounded-xl border border-[#2a2a30] px-6 py-3 font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Add Another Vehicle</a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Part photo modal */}
      {partModalId && (
        <PartPhotoModal
          partId={partModalId}
          partName={partModalName}
          vehiclePhotos={partPhotos}
          onSave={handleSavePartPhoto}
          onDelete={handleDeletePartPhoto}
          onClose={() => setPartModalId(null)}
        />
      )}

      {/* Journal entry modal */}
      {journalModalOpen && (
        <JournalEntryModal
          entry={editingEntry}
          availableParts={[
            ...topRated.map((x) => ({ id: x.part.id, name: x.part.name })),
            ...customMods.map((m) => ({ id: m.id, name: m.name })),
          ]}
          onSave={handleSaveJournalEntry}
          onClose={() => { setJournalModalOpen(false); setEditingEntry(null) }}
        />
      )}

      {/* Share / QR modal */}
      {shareModalOpen && intake && (
        <ShareBuildModal
          vehicle={intake}
          trackerItems={trackerItems}
          topRated={topRated}
          journalEntries={journalEntries}
          onClose={() => setShareModalOpen(false)}
        />
      )}

      {/* Progress tab lightbox */}
      {progressLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setProgressLightbox(null)}>
          <img src={progressLightbox} alt="" className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl" />
          <button onClick={() => setProgressLightbox(null)} className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white hover:bg-black/80 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* ── Show Mode — Cinematic full-bleed overlay ───────────────────── */}
      {showMode && (() => {
        const heroPhoto =
          partPhotos.length > 0
            ? [...partPhotos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.imageData
            : photos.length > 0
            ? [...photos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.imageUrl
            : null

        const latestMilestone = [...journalEntries]
          .filter((e) => e.isMilestone)
          .sort((a, b) => b.date.localeCompare(a.date))[0]

        const latestEntry = [...journalEntries]
          .sort((a, b) => b.date.localeCompare(a.date))[0]

        const storyEntry = latestMilestone ?? latestEntry

        return (
          <div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl show-mode-enter"
            aria-modal="true"
            role="dialog"
            aria-label="Show Mode — cinematic build view"
          >
            {/* Close */}
            <button
              onClick={() => setShowMode(false)}
              className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:text-white transition-colors"
              aria-label="Exit Show Mode"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Ambient glow behind photo */}
            {heroPhoto && (
              <div
                className="pointer-events-none absolute inset-0 opacity-20 blur-[100px]"
                style={{ backgroundImage: `url(${heroPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
            )}

            <div className="relative w-full max-w-3xl px-6 flex flex-col items-center gap-8 text-center">
              {/* Vehicle name */}
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-600 mb-2">Current build</p>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
                  {intake?.year} {intake?.make} {intake?.model}
                </h2>
                {intake?.trim && <p className="mt-1 text-zinc-500 text-sm">{intake.trim}</p>}
              </div>

              {/* Hero photo */}
              {heroPhoto ? (
                <div className="w-full rounded-3xl overflow-hidden border border-white/[0.06] shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
                  <img
                    src={heroPhoto}
                    alt="Build progress photo"
                    className="w-full max-h-[42vh] object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-48 rounded-3xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
                  <p className="text-zinc-700 text-sm">No photos yet</p>
                </div>
              )}

              {/* Completion */}
              <div className="w-full max-w-sm">
                <div className="flex justify-between text-xs text-zinc-500 mb-2">
                  <span>Build progress</span>
                  <span className="text-white font-semibold">{completion}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#A020F0] to-purple-400 transition-all duration-1000"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>

              {/* Story entry */}
              {storyEntry && (
                <div className="w-full max-w-xl">
                  {storyEntry.isMilestone && storyEntry.milestoneLabel && (
                    <p className="text-amber-400 text-xs uppercase tracking-widest mb-2 font-semibold">
                      ⭐ {storyEntry.milestoneLabel}
                    </p>
                  )}
                  <p className="text-zinc-300 text-lg md:text-xl leading-relaxed font-light italic">
                    &ldquo;{storyEntry.narrative}&rdquo;
                  </p>
                  <p className="mt-4 text-zinc-600 text-sm">
                    {new Date(storyEntry.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )}

              {!storyEntry && intake?.goals && (
                <p className="text-zinc-400 text-lg leading-relaxed font-light italic max-w-xl">&ldquo;{intake.goals}&rdquo;</p>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
