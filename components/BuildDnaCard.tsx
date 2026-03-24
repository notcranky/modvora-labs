'use client'

import { useEffect, useState } from 'react'
import {
  getActiveVehicle,
  getBuildTrackerSummary,
  loadBuildMilestones,
  loadBuildTracker,
  SavedVehicle,
} from '@/lib/garage'

// ─── Category config ────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'power',     label: 'Power',     color: '#f97316', partIds: ['cold-air-intake','ecu-tune','turbo-kit','performance-headers'] },
  { id: 'exhaust',   label: 'Exhaust',   color: '#eab308', partIds: ['catback-exhaust','performance-headers'] },
  { id: 'handling',  label: 'Handling',  color: '#22c55e', partIds: ['coilovers','lowering-springs','sway-bars'] },
  { id: 'brakes',    label: 'Brakes',    color: '#ef4444', partIds: ['performance-brake-pads','big-brake-kit'] },
  { id: 'wheels',    label: 'Wheels',    color: '#3b82f6', partIds: ['aftermarket-wheels','performance-tires'] },
  { id: 'exterior',  label: 'Exterior',  color: '#a855f7', partIds: ['front-lip-splitter','rear-spoiler','window-tint','led-headlights'] },
  { id: 'interior',  label: 'Interior',  color: '#ec4899', partIds: ['performance-seats','short-shifter'] },
  { id: 'forced',    label: 'Boost',     color: '#06b6d4', partIds: ['turbo-kit'] },
]

// ─── Build stage ─────────────────────────────────────────────────────────────

function getBuildStage(installed: number, spend: number): { label: string; tier: number } {
  if (installed === 0 && spend === 0) return { label: 'Stock',        tier: 0 }
  if (installed <= 2 || spend < 500)  return { label: 'Stage 1',     tier: 1 }
  if (installed <= 5 || spend < 2000) return { label: 'Stage 2',     tier: 2 }
  if (installed <= 9 || spend < 5000) return { label: 'Stage 3',     tier: 3 }
  return                                     { label: 'Built',        tier: 4 }
}

function stageColor(tier: number) {
  return ['#71717a','#22c55e','#3b82f6','#a855f7','#f97316'][tier] ?? '#71717a'
}

// ─── DNA bar ──────────────────────────────────────────────────────────────────

function DnaBar({ color, fill, label }: { color: string; fill: number; label: string }) {
  // fill = 0–1
  const segments = 8
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex flex-col-reverse gap-[3px]">
        {Array.from({ length: segments }).map((_, i) => {
          const active = i / segments < fill
          return (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: active ? color : 'rgba(255,255,255,0.06)',
                boxShadow: active ? `0 0 6px ${color}88` : 'none',
                transition: 'background 0.4s ease, box-shadow 0.4s ease',
              }}
            />
          )
        })}
      </div>
      <span style={{ fontSize: 9, color: '#52525b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BuildDnaCard() {
  const [vehicle, setVehicle]     = useState<SavedVehicle | null>(null)
  const [summary, setSummary]     = useState({ spend: 0, installed: 0, planned: 0, purchased: 0, totalTracked: 0 })
  const [milestones, setMilestones] = useState({ total: 0, done: 0 })
  const [trackerIds, setTrackerIds] = useState<Set<string>>(new Set())
  const [copied, setCopied]       = useState(false)
  const [daysBuilding, setDaysBuilding] = useState(0)

  useEffect(() => {
    const v = getActiveVehicle()
    if (!v) return
    setVehicle(v)

    const s = getBuildTrackerSummary(v.id)
    setSummary(s)

    const ms = loadBuildMilestones(v.id)
    setMilestones({ total: ms.length, done: ms.filter(m => m.done).length })

    const tracker = loadBuildTracker(v.id)
    const installed = new Set(
      Object.entries(tracker)
        .filter(([, item]) => item.status === 'installed')
        .map(([id]) => id)
    )
    setTrackerIds(installed)

    // Days since vehicle was created
    const created = new Date(v.createdAt)
    const now = new Date()
    const diff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    setDaysBuilding(diff)
  }, [])

  if (!vehicle) return null

  const stage = getBuildStage(summary.installed, summary.spend)
  const sc    = stageColor(stage.tier)

  // Category fills
  const categoryFills = CATEGORIES.map(cat => {
    const total    = cat.partIds.length
    const done     = cat.partIds.filter(id => trackerIds.has(id)).length
    return { ...cat, fill: total > 0 ? done / total : 0 }
  })

  // Build ID (short hash from vehicle id)
  const buildId = vehicle.id.slice(-8).toUpperCase()

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0f0f14 0%, #141420 50%, #0f0f14 100%)',
        border: '1px solid #2a2a38',
        borderRadius: 20,
        padding: '28px 28px 24px',
        maxWidth: 560,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 200, height: 200, borderRadius: '50%',
        background: `${sc}18`,
        filter: 'blur(50px)',
        pointerEvents: 'none',
      }} />

      {/* Grid pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025,
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, position: 'relative' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: '#52525b',
            }}>
              Build DNA
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, color: '#3f3f46',
              letterSpacing: '0.1em',
            }}>
              #{buildId}
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.15, margin: 0 }}>
            {vehicle.year} {vehicle.make}
          </h2>
          <p style={{ fontSize: 15, color: '#71717a', margin: '2px 0 0', fontWeight: 500 }}>
            {vehicle.model}{vehicle.trim ? ` · ${vehicle.trim}` : ''}
          </p>
        </div>

        {/* Stage badge */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
        }}>
          <div style={{
            background: `${sc}18`,
            border: `1px solid ${sc}40`,
            borderRadius: 999,
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 700,
            color: sc,
            letterSpacing: '0.08em',
          }}>
            {stage.label}
          </div>
          {/* Stage pips */}
          <div style={{ display: 'flex', gap: 4 }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: 2,
                background: i <= stage.tier ? sc : '#27272a',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* DNA bars */}
      <div style={{
        background: '#0a0a0e',
        border: '1px solid #1f1f28',
        borderRadius: 12,
        padding: '20px 16px 14px',
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 8, left: 14,
          fontSize: 9, fontWeight: 600, letterSpacing: '0.15em',
          textTransform: 'uppercase', color: '#3f3f46',
        }}>
          Mod Genome
        </div>
        {categoryFills.map(cat => (
          <DnaBar key={cat.id} color={cat.color} fill={cat.fill} label={cat.label} />
        ))}
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8, marginBottom: 20,
      }}>
        {[
          { label: 'Installed',  value: summary.installed },
          { label: 'Planned',    value: summary.planned + summary.purchased },
          { label: 'Milestones', value: `${milestones.done}/${milestones.total || '—'}` },
          { label: 'Spend',      value: summary.spend > 0 ? `$${summary.spend.toLocaleString()}` : '—' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#0d0d12',
            border: '1px solid #1f1f28',
            borderRadius: 10,
            padding: '10px 8px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 9, color: '#52525b', marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#3f3f46' }}>
          {daysBuilding > 0 ? `${daysBuilding} day${daysBuilding !== 1 ? 's' : ''} in the build` : 'Build started today'}
        </div>

        <button
          onClick={handleShare}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: copied ? '#14532d' : '#18181b',
            border: `1px solid ${copied ? '#22c55e40' : '#2a2a38'}`,
            borderRadius: 8,
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            color: copied ? '#4ade80' : '#a1a1aa',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {copied
              ? <path d="M20 6L9 17l-5-5"/>
              : <><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></>
            }
          </svg>
          {copied ? 'Copied!' : 'Share Build'}
        </button>
      </div>

      {/* Modvora watermark */}
      <div style={{
        position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
        fontSize: 9, color: '#27272a', letterSpacing: '0.2em', textTransform: 'uppercase',
        fontWeight: 700, pointerEvents: 'none',
      }}>
        Modvora
      </div>
    </div>
  )
}
