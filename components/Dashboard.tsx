'use client'

import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Part } from '@/lib/types'
import { getRecommendedParts, getTopRatedParts, estimateTotalCost } from '@/lib/parts-matcher'
import CarVisualizer from './CarVisualizer'
import BuildDnaCard from './BuildDnaCard'
import {
  addBuildPhoto,
  BuildMilestone,
  deleteVehicle,
  getBuildTrackerSummary,
  getVehicleLabel,
  loadBuildMilestones,
  loadBuildPhotos,
  loadCheckedParts,
  loadVehicles,
  saveCheckedParts,
  saveBuildMilestones,
  saveVehicles,
  setActiveVehicleId,
  SavedVehicle,
} from '@/lib/garage'

const FLIP_ATTR = 'data-flip-id'
const CONFETTI_COLORS = ['#a855f7', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#f97316']

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

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'Build spend tracked', value: `$${trackedSpend.toLocaleString()}`, sub: `est. range $${cost.min.toLocaleString()}-$${cost.max.toLocaleString()}` },
        { label: 'Recommended parts', value: String(parts.length), sub: 'curated for this build' },
        { label: 'Installed parts', value: String(installedCount), sub: `${boltOnCount} DIY-friendly options available` },
        { label: 'Build progress', value: `${completion}%`, sub: `${milestonesDone}/${milestonesTotal || 0} milestones done` },
      ].map((s) => (
        <div key={s.label} className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{s.label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{s.value}</p>
          <p className="mt-1 text-sm text-zinc-500">{s.sub}</p>
        </div>
      ))}
    </div>
  )
}

function BuildSnapshot({ parts, checked }: { parts: Part[]; checked: Set<string> }) {
  const nextParts = parts.filter((part) => !checked.has(part.id)).slice(0, 3)
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
              <a key={part.id} href={`/dashboard/parts/${part.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[#23232a] bg-[#111116] px-4 py-3 transition-colors hover:border-purple-500/30 hover:bg-[#15151b]">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#2a2a30] bg-[#0c0c10] text-sm text-zinc-300">#{index + 1}</div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{part.name}</p>
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

function PhaseTimeline({ parts }: { parts: Part[] }) {
  const phaseLabels = ['Start Here', 'Next Up', 'Final Stage']
  const phaseColors = ['border-green-500/25 bg-green-500/5', 'border-yellow-500/25 bg-yellow-500/5', 'border-orange-500/25 bg-orange-500/5']
  const phaseBadge = ['bg-green-500/15 text-green-300', 'bg-yellow-500/15 text-yellow-300', 'bg-orange-500/15 text-orange-300']

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {[1, 2, 3].map((phase) => {
        const pp = parts.filter((p) => p.phase === phase)
        if (!pp.length) return null

        return (
          <div key={phase} className={`rounded-2xl border p-4 ${phaseColors[phase - 1]}`}>
            <div className="mb-3 flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${phaseBadge[phase - 1]}`}>Phase {phase}</span>
              <span className="text-sm text-zinc-400">{phaseLabels[phase - 1]}</span>
            </div>
            <ul className="space-y-2">
              {pp.map((p) => (
                <li key={p.id} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="mt-0.5">{categoryMeta[p.category]?.icon ?? '🛠️'}</span>
                  <span>{p.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function Top10({ topRated, checked, onToggle }: { topRated: { part: Part; score: number; stars: number }[]; checked: Set<string>; onToggle: (id: string) => void }) {
  const rankColors = ['text-yellow-400', 'text-zinc-300', 'text-orange-400']
  const rankBg = ['bg-yellow-500/10 border-yellow-500/30', 'bg-zinc-500/10 border-zinc-500/30', 'bg-orange-500/10 border-orange-500/30']
  const listRef = useRef<HTMLDivElement>(null)
  const snapRef = useRef<Map<string, number>>(new Map())
  const needsFlip = useRef(false)
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number } | null>(null)
  const confettiId = useRef(0)

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

  const doneCount = topRated.filter(({ part }) => checked.has(part.id)).length
  const sorted = [...topRated].sort((a, b) => Number(checked.has(a.part.id)) - Number(checked.has(b.part.id)))

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Recommended parts</h3>
          <p className="mt-1 text-sm text-zinc-500">The full ranked list stays here, while the overview above keeps the page calmer.</p>
        </div>
        <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs text-purple-200">{doneCount} acquired</span>
      </div>

      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-zinc-500">Progress through ranked picks</span>
          <span className="text-xs font-semibold text-green-400">{Math.round((doneCount / topRated.length) * 100) || 0}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#1e1e24]">
          <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500" style={{ width: `${(doneCount / topRated.length) * 100 || 0}%` }} />
        </div>
      </div>

      <div ref={listRef} className="space-y-2">
        {sorted.map(({ part, stars }, sortedIndex) => {
          const liveRank = sorted.slice(0, sortedIndex + 1).filter((x) => !checked.has(x.part.id)).length
          const meta = categoryMeta[part.category] ?? { icon: '🛠️', label: part.category }
          const isTop3 = liveRank <= 3
          const isDone = checked.has(part.id)

          return (
            <div key={part.id} {...{ [FLIP_ATTR]: part.id }} className={`flex items-center gap-3 rounded-2xl border transition-colors duration-300 ${isDone ? 'border-green-500/20 bg-green-500/5' : 'border-[#2a2a30] bg-[#131318]'}`}>
              <button onClick={(e) => handleToggle(part.id, e)} aria-label={isDone ? 'Uncheck' : 'Mark as acquired'} className={`ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${isDone ? 'border-green-500 bg-green-500' : 'border-zinc-600 hover:border-green-500'}`}>
                {isDone && <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </button>

              <a href={`/dashboard/parts/${part.id}`} className="group flex min-w-0 flex-1 items-center gap-3 py-3 pr-4">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black ${isDone ? 'border-green-500/20 bg-green-500/10' : isTop3 ? rankBg[liveRank - 1] : 'border-[#2a2a30] bg-[#0f0f12]'}`}>
                  {isDone ? <span className="text-green-400">✓</span> : <span className={isTop3 ? rankColors[liveRank - 1] : 'text-zinc-500'}>#{liveRank}</span>}
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="shrink-0 text-lg">{meta.icon}</span>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold transition-colors ${isDone ? 'text-zinc-500 line-through' : 'text-white group-hover:text-purple-300'}`}>{part.name}</p>
                    <p className="truncate text-xs text-zinc-600">{part.brand} · {meta.label}</p>
                  </div>
                </div>

                <div className="hidden min-w-[90px] shrink-0 flex-col items-end gap-0.5 sm:flex">
                  <span className={`text-xs font-semibold ${isDone ? 'text-zinc-600' : difficultyColor[part.difficulty]}`}>{difficultyLabel[part.difficulty] ?? part.difficulty}</span>
                  <span className="text-xs text-zinc-600">{part.timeToInstall}</span>
                </div>

                <div className="shrink-0 text-right">
                  <p className={`text-sm font-bold ${isDone ? 'text-zinc-600' : 'text-purple-400'}`}>${part.priceRange.min.toLocaleString()}</p>
                  <p className="text-xs text-zinc-700">–${part.priceRange.max.toLocaleString()}</p>
                </div>

                <div className="hidden shrink-0 items-center gap-0.5 md:flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className={`h-3 w-3 ${s <= stars ? (isDone ? 'text-zinc-600' : 'text-yellow-400') : 'text-zinc-700'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                </div>
              </a>
            </div>
          )
        })}
      </div>

      {confetti && <ConfettiBurst key={confetti.id} x={confetti.x} y={confetti.y} onDone={() => setConfetti(null)} />}
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
  const [activeView, setActiveView] = useState<'overview' | 'plan' | 'garage'>('overview')
  const [trackedSpend, setTrackedSpend] = useState(0)
  const [installedCount, setInstalledCount] = useState(0)
  const [milestones, setMilestones] = useState<BuildMilestone[]>([])
  const [photoCaption, setPhotoCaption] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoCount, setPhotoCount] = useState(0)

  const intake = useMemo(() => vehicles.find((vehicle) => vehicle.id === activeVehicleId) ?? null, [vehicles, activeVehicleId])

  useEffect(() => {
    const storedVehicles = loadVehicles()
    if (storedVehicles.length) {
      const activeId = localStorage.getItem('modvora_active_vehicle_id') ?? storedVehicles[0].id
      const safeActiveId = storedVehicles.find((vehicle) => vehicle.id === activeId)?.id ?? storedVehicles[0].id
      setVehicles(storedVehicles)
      setActiveVehicle(safeActiveId)
      setChecked(new Set(loadCheckedParts(safeActiveId)))
    }
    setLoading(false)
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
    setMilestones(loadBuildMilestones(intake.id))
    setPhotoCount(loadBuildPhotos(intake.id).length)
    setActiveVehicleId(intake.id)
    localStorage.setItem('modvora_intake', JSON.stringify(intake))
  }, [intake])

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
    setPhotoCount((n) => n + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400">Loading your garage...</p>
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
  const milestonesDone = milestones.filter((m) => m.done).length
  const tabs: Array<{ id: 'overview' | 'plan' | 'garage'; label: string; hint: string }> = [
    { id: 'overview', label: 'Overview', hint: 'Summary + visual planning' },
    { id: 'plan', label: 'Plan details', hint: 'Timeline + full parts list' },
    { id: 'garage', label: 'Garage', hint: 'Switch and manage vehicles' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0b] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[32px] border border-[#212129] bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.14),transparent_38%),linear-gradient(180deg,#141419_0%,#0e0e12_100%)] px-6 py-6 sm:px-7">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <p className="text-sm font-medium text-green-400">Build plan ready</p>
            <span className="rounded-full border border-[#2a2a30] bg-[#16161a] px-3 py-1 text-xs text-zinc-400">Vehicle {vehicles.findIndex((v) => v.id === intake.id) + 1} of {vehicles.length}</span>
            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs text-green-300">{completion}% complete</span>
          </div>

          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">My Build</h1>
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

        {activeView === 'overview' && (
          <div className="space-y-6">
            <SectionShell eyebrow="Overview" title="The important stuff first" description="A quieter summary of budget, progress, priorities, and visual direction so you can orient yourself fast.">
              <BuildSummary
                parts={parts}
                checkedCount={checked.size}
                trackedSpend={trackedSpend}
                installedCount={installedCount}
                milestonesDone={milestonesDone}
                milestonesTotal={milestones.length}
              />
              <div className="mt-5">
                <BuildSnapshot parts={parts} checked={checked} />
              </div>
            </SectionShell>

            <SectionShell eyebrow="Build Identity" title="Your Build DNA" description="A snapshot of your build — share it, screenshot it, flex it.">
              <BuildDnaCard />
            </SectionShell>

            <SectionShell
              eyebrow="Tracker"
              title="Milestones and photo log"
              description="Track real build progress without relying on retailer links."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Build milestones</p>
                    <button onClick={addMilestone} className="rounded-lg border border-[#2a2a30] px-3 py-1.5 text-xs text-zinc-300 hover:text-white">+ Add</button>
                  </div>
                  <div className="space-y-2">
                    {milestones.length ? milestones.map((m) => (
                      <button key={m.id} onClick={() => toggleMilestone(m.id)} className="flex w-full items-center gap-2 rounded-xl border border-[#2a2a30] bg-[#111116] px-3 py-2 text-left">
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${m.done ? 'border-green-500 bg-green-500 text-white' : 'border-zinc-600 text-zinc-500'}`}>{m.done ? '✓' : ''}</span>
                        <span className={`text-sm ${m.done ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{m.title}</span>
                      </button>
                    )) : <p className="text-sm text-zinc-500">No milestones yet.</p>}
                  </div>
                </div>
                <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">Photo progress log</p>
                  <p className="mt-1 text-xs text-zinc-500">{photoCount} photos saved</p>
                  <div className="mt-3 space-y-2">
                    <input value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} placeholder="Caption (optional)" className="w-full rounded-lg border border-[#2a2a30] bg-[#111116] px-3 py-2 text-sm text-white outline-none" />
                    <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="Image URL" className="w-full rounded-lg border border-[#2a2a30] bg-[#111116] px-3 py-2 text-sm text-white outline-none" />
                    <button onClick={addPhotoLog} className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-500">Save photo log</button>
                  </div>
                </div>
              </div>
            </SectionShell>

            <SectionShell eyebrow="Visual planning" title="Preview the look before you buy" description="Start with a clean stock reference, then flip into real-owner inspiration when you want to explore stance and styling.">
              <CarVisualizer intake={intake} />
            </SectionShell>
          </div>
        )}

        {activeView === 'plan' && (
          <div className="space-y-6">
            <SectionShell eyebrow="Roadmap" title="Recommended build order" description="Phases help keep the project manageable instead of turning into one giant wall of tasks.">
              <PhaseTimeline parts={parts} />
            </SectionShell>

            <SectionShell eyebrow="Checklist" title="Full ranked parts plan" description="Everything is still here — just moved into its own focused space so it doesn’t dominate the whole dashboard.">
              <Top10 topRated={topRated} checked={checked} onToggle={handleToggle} />
            </SectionShell>
          </div>
        )}

        {activeView === 'garage' && (
          <div className="space-y-6">
            <VehicleSwitcher vehicles={vehicles} activeVehicleId={intake.id} onSelect={handleSelectVehicle} onDelete={handleDeleteVehicle} />

            <div className="rounded-[28px] border border-purple-500/15 bg-[linear-gradient(180deg,#141419_0%,#101015_100%)] p-6 text-center">
              <h3 className="text-xl font-semibold text-white">Keep building your garage</h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">Each saved vehicle keeps its own recommendations and checklist locally, and now each one can become a community post without re-entering the car details.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <a href="/dashboard/publish" className="rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-500">Publish a Build</a>
                <a href="/community" className="rounded-xl border border-[#2a2a30] px-6 py-3 font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Browse Community</a>
                <a href="/intake?new=1" className="rounded-xl border border-[#2a2a30] px-6 py-3 font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Add Another Vehicle</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
