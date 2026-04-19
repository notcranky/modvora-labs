'use client'

import { useEffect, useRef, useState } from 'react'
import {
  getActiveVehicle,
  getBuildTrackerSummary,
  loadBuildMilestones,
  loadBuildTracker,
  loadBuildPhotos,
  SavedVehicle,
  BuildPhotoLog,
} from '@/lib/garage'

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'power',    label: 'Power',    color: '#f97316', partIds: ['cold-air-intake','ecu-tune','turbo-kit','performance-headers'] },
  { id: 'handling', label: 'Handling', color: '#22c55e', partIds: ['coilovers','lowering-springs','sway-bars'] },
  { id: 'exhaust',  label: 'Exhaust',  color: '#eab308', partIds: ['catback-exhaust','performance-headers'] },
  { id: 'brakes',   label: 'Brakes',   color: '#ef4444', partIds: ['performance-brake-pads','big-brake-kit'] },
  { id: 'wheels',   label: 'Wheels',   color: '#3b82f6', partIds: ['aftermarket-wheels','performance-tires'] },
  { id: 'exterior', label: 'Exterior', color: '#a855f7', partIds: ['front-lip-splitter','rear-spoiler','window-tint','led-headlights'] },
]

// ─── Stage / type config ──────────────────────────────────────────────────────

function getBuildStage(installed: number, spend: number) {
  if (installed === 0 && spend === 0) return { label: 'Stock',   tier: 0, hp: 50,  type: 'Normal',  icon: '○' }
  if (installed <= 2 || spend < 500)  return { label: 'Stage 1', tier: 1, hp: 120, type: 'Grass',   icon: '❋' }
  if (installed <= 5 || spend < 2000) return { label: 'Stage 2', tier: 2, hp: 190, type: 'Water',   icon: '◈' }
  if (installed <= 9 || spend < 5000) return { label: 'Stage 3', tier: 3, hp: 260, type: 'Psychic', icon: '✦' }
  return                              { label: 'Built',   tier: 4, hp: 340, type: 'Fire',   icon: '⬡' }
}

const STAGE_THEME = [
  { border: '#6b7280', glow: '#6b7280', accent: '#9ca3af', bg: 'linear-gradient(160deg,#1c1c22 0%,#141418 100%)', foil: '#9ca3af' },
  { border: '#22c55e', glow: '#22c55e', accent: '#4ade80', bg: 'linear-gradient(160deg,#0d1f12 0%,#090d0a 100%)', foil: '#4ade80' },
  { border: '#3b82f6', glow: '#3b82f6', accent: '#60a5fa', bg: 'linear-gradient(160deg,#0c1628 0%,#080e18 100%)', foil: '#60a5fa' },
  { border: '#a855f7', glow: '#a855f7', accent: '#c084fc', bg: 'linear-gradient(160deg,#1a0d28 0%,#110815 100%)', foil: '#c084fc' },
  { border: '#f97316', glow: '#f97316', accent: '#fb923c', bg: 'linear-gradient(160deg,#1f1008 0%,#130a04 100%)', foil: '#fb923c' },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function BuildDnaCard() {
  const cardRef = useRef<HTMLDivElement>(null)

  const [vehicle, setVehicle]     = useState<SavedVehicle | null>(null)
  const [summary, setSummary]     = useState({ spend: 0, installed: 0, planned: 0, purchased: 0, totalTracked: 0 })
  const [milestones, setMilestones] = useState({ total: 0, done: 0 })
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set())
  const [plannedIds, setPlannedIds]     = useState<Set<string>>(new Set())
  const [photos, setPhotos]       = useState<BuildPhotoLog[]>([])
  const [daysBuilding, setDaysBuilding] = useState(0)
  const [copied, setCopied]       = useState(false)
  const [mounted, setMounted]     = useState(false)
  const [holo, setHolo]           = useState({ x: 50, y: 50, active: false })

  useEffect(() => {
    const v = getActiveVehicle()
    if (!v) return
    setVehicle(v)

    const s = getBuildTrackerSummary(v.id)
    setSummary(s)

    const ms = loadBuildMilestones(v.id)
    setMilestones({ total: ms.length, done: ms.filter(m => m.done).length })

    const tracker = loadBuildTracker(v.id)
    const inst = new Set(Object.entries(tracker).filter(([, i]) => i.status === 'installed').map(([id]) => id))
    const plan = new Set(Object.entries(tracker).filter(([, i]) => i.status !== 'installed').map(([id]) => id))
    setInstalledIds(inst)
    setPlannedIds(plan)

    setPhotos(loadBuildPhotos(v.id))

    const diff = Math.floor((Date.now() - new Date(v.createdAt).getTime()) / 86400000)
    setDaysBuilding(diff)

    const t = setTimeout(() => setMounted(true), 120)
    return () => clearTimeout(t)
  }, [])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    setHolo({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      active: true,
    })
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!vehicle) return null

  const stage  = getBuildStage(summary.installed, summary.spend)
  const theme  = STAGE_THEME[stage.tier]
  const buildId = vehicle.id.slice(-8).toUpperCase()

  const categoryFills = CATEGORIES.map((cat, i) => {
    const total     = cat.partIds.length
    const installed = cat.partIds.filter(id => installedIds.has(id)).length
    const planned   = cat.partIds.filter(id => plannedIds.has(id)).length
    return {
      ...cat,
      fill:        total > 0 ? installed / total : 0,
      plannedFill: total > 0 ? Math.min((installed + planned) / total, 1) : 0,
      delay:       i * 70,
    }
  })

  const goalTags = [vehicle.goals, vehicle.focus]
    .filter(Boolean)
    .flatMap(s => s.split(/[,\/;]/))
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 4)

  const specParts = [vehicle.engine, vehicle.transmission, vehicle.drivetrain].filter(Boolean)

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHolo(h => ({ ...h, active: false }))}
      style={{
        position: 'relative',
        borderRadius: 22,
        padding: 3,
        background: `linear-gradient(145deg, ${theme.border}cc, ${theme.border}40 40%, ${theme.border}cc 100%)`,
        boxShadow: `0 0 0 1px ${theme.border}20, 0 30px 80px ${theme.glow}25, 0 8px 30px rgba(0,0,0,0.7)`,
        maxWidth: 400,
        userSelect: 'none',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* Inner card surface */}
      <div
        style={{
          borderRadius: 19,
          background: theme.bg,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Holographic shimmer overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20,
          borderRadius: 'inherit',
          opacity: holo.active ? 1 : 0,
          background: `radial-gradient(circle at ${holo.x}% ${holo.y}%,
            rgba(255,80,80,0.13) 0%,
            rgba(255,200,0,0.09) 18%,
            rgba(60,255,100,0.09) 36%,
            rgba(0,200,255,0.09) 54%,
            rgba(140,60,255,0.09) 72%,
            transparent 90%)`,
          transition: 'opacity 0.2s ease',
          mixBlendMode: 'screen',
        }} />

        {/* Foil shine line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${theme.foil}60, transparent)`,
          pointerEvents: 'none', zIndex: 21,
        }} />

        <div style={{ padding: '18px 18px 16px', position: 'relative', zIndex: 2 }}>

          {/* ── Top row: type + HP ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: `${theme.border}22`,
                border: `1.5px solid ${theme.border}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: theme.accent, fontWeight: 700,
              }}>
                {stage.icon}
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: theme.accent, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                {stage.type}
              </span>
              <span style={{ fontSize: 10, color: '#3f3f46', letterSpacing: '0.08em' }}>#{buildId}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {stage.hp}
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#52525b', letterSpacing: '0.12em' }}>HP</span>
            </div>
          </div>

          {/* ── Vehicle name ──────────────────────────────────────────────── */}
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 1px', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>
            {vehicle.trim && (
              <p style={{ fontSize: 12, color: theme.accent, margin: '0 0 3px', fontWeight: 700, letterSpacing: '0.04em' }}>
                {vehicle.trim}
              </p>
            )}
            {specParts.length > 0 && (
              <p style={{ fontSize: 10, color: '#52525b', margin: 0 }}>
                {specParts.join(' · ')}
              </p>
            )}
          </div>

          {/* ── Car photo ─────────────────────────────────────────────────── */}
          <div style={{
            width: '100%', aspectRatio: '16/9', borderRadius: 12,
            overflow: 'hidden',
            border: `1.5px solid ${theme.border}25`,
            background: '#080810',
            marginBottom: 14,
            position: 'relative',
            boxShadow: `inset 0 0 20px rgba(0,0,0,0.5)`,
          }}>
            {photos.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photos[0].imageUrl}
                alt="Car"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: `linear-gradient(135deg, ${theme.border}08 0%, transparent 100%)`,
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={theme.border} strokeWidth="1.2" opacity={0.35}>
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span style={{ fontSize: 10, color: '#3f3f46', textAlign: 'center' }}>No photo yet — add one in Progress</span>
              </div>
            )}

            {/* Stage badge on photo */}
            <div style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.border}50`,
              borderRadius: 999,
              padding: '3px 10px',
              fontSize: 10, fontWeight: 800, color: theme.accent,
              letterSpacing: '0.1em',
            }}>
              {stage.label}
            </div>
          </div>

          {/* ── Mod Genome bars ───────────────────────────────────────────── */}
          <div style={{
            background: 'rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: '12px 12px 10px',
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#3f3f46', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Mod Genome
              </span>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: 'Planned',   bg: 'rgba(255,255,255,0.12)' },
                  { label: 'Installed', bg: theme.accent             },
                ].map(leg => (
                  <span key={leg.label} style={{ fontSize: 8, color: '#52525b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ display: 'inline-block', width: 10, height: 4, borderRadius: 2, background: leg.bg }} />
                    {leg.label}
                  </span>
                ))}
              </div>
            </div>

            {categoryFills.map((cat, i) => (
              <div key={cat.id} style={{ marginBottom: i < categoryFills.length - 1 ? 8 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 9, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{cat.label}</span>
                  <span style={{ fontSize: 9, color: cat.fill > 0 ? cat.color : '#3f3f46' }}>
                    {cat.fill > 0 ? `${Math.round(cat.fill * 100)}%` : cat.plannedFill > 0 ? 'planned' : '—'}
                  </span>
                </div>
                <div style={{ position: 'relative', height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                  {/* Planned */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    width: mounted ? `${cat.plannedFill * 100}%` : '0%',
                    background: `${cat.color}28`,
                    borderRadius: 4,
                    transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${cat.delay}ms`,
                  }} />
                  {/* Installed */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    width: mounted ? `${cat.fill * 100}%` : '0%',
                    background: `linear-gradient(90deg, ${cat.color}aa, ${cat.color})`,
                    borderRadius: 4,
                    boxShadow: cat.fill > 0 ? `0 0 8px ${cat.color}60` : 'none',
                    transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${cat.delay + 180}ms`,
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Stats ─────────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12 }}>
            {[
              { label: 'Installed',  value: summary.installed                     },
              { label: 'Planned',    value: summary.planned + summary.purchased    },
              { label: 'Milestones', value: milestones.total ? `${milestones.done}/${milestones.total}` : '—' },
              { label: 'Spend',      value: summary.spend > 0 ? `$${(summary.spend / 1000).toFixed(1)}k` : '—' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 9,
                padding: '8px 4px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 8, color: '#52525b', marginTop: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── Goal tags ─────────────────────────────────────────────────── */}
          {goalTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
              {goalTags.map((tag, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 700,
                  background: `${theme.border}12`,
                  border: `1px solid ${theme.border}35`,
                  color: theme.accent,
                  borderRadius: 999,
                  padding: '3px 10px',
                  letterSpacing: '0.05em',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* ── Stage pips ────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                width: i === stage.tier ? 20 : 8,
                height: 6,
                borderRadius: 3,
                background: i <= stage.tier ? theme.border : 'rgba(255,255,255,0.06)',
                boxShadow: i === stage.tier ? `0 0 8px ${theme.glow}80` : 'none',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#3f3f46' }}>
              {daysBuilding > 0 ? `${daysBuilding}d in the build` : 'Build started today'}
            </span>
            <button
              onClick={handleShare}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: copied ? `${theme.border}18` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${copied ? theme.border + '60' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8, padding: '5px 12px',
                cursor: 'pointer', fontSize: 11, fontWeight: 700,
                color: copied ? theme.accent : '#71717a',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {copied
                  ? <path d="M20 6L9 17l-5-5"/>
                  : <><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></>
                }
              </svg>
              {copied ? 'Copied!' : 'Share Build'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom stamp */}
      <div style={{
        textAlign: 'center', paddingTop: 5,
        fontSize: 8, color: `${theme.border}50`,
        letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 800,
        pointerEvents: 'none',
      }}>
        Modvora Labs
      </div>
    </div>
  )
}
