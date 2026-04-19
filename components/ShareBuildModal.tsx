'use client'

import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { SharedBuild, saveSharedBuild, createBuildId } from '@/lib/shared-build'
import { JournalEntry, SavedVehicle, BuildTrackerItem } from '@/lib/garage'
import { Part } from '@/lib/types'

interface RatedPart { part: Part; score: number; stars: number }

interface Props {
  vehicle: SavedVehicle
  trackerItems: Record<string, BuildTrackerItem>
  topRated: RatedPart[]
  journalEntries: JournalEntry[]
  onClose: () => void
}

export default function ShareBuildModal({ vehicle, trackerItems, topRated, journalEntries, onClose }: Props) {
  const [step, setStep] = useState<'setup' | 'done'>('setup')
  const [heroFile, setHeroFile] = useState<string | null>(null)
  const [contactLink, setContactLink] = useState('')
  const [buildId, setBuildId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const qrRef = useRef<HTMLDivElement>(null)

  // Check if already shared
  useEffect(() => {
    const existing = Object.values(
      (() => {
        try { return JSON.parse(localStorage.getItem('modvora_shared_builds') || '{}') } catch { return {} }
      })()
    ).find((b: unknown) => (b as SharedBuild).vehicleId === vehicle.id) as SharedBuild | undefined

    if (existing) {
      setBuildId(existing.id)
      setContactLink(existing.contactLink ?? '')
      setStep('done')
    }
  }, [vehicle.id])

  async function compressHero(file: File): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxW = 1200
        const scale = Math.min(1, maxW / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  async function handleGenerate() {
    // Reuse existing ID if this vehicle already has a shared build
    const existing = Object.values(
      (() => { try { return JSON.parse(localStorage.getItem('modvora_shared_builds') || '{}') } catch { return {} } })()
    ).find((b: unknown) => (b as SharedBuild).vehicleId === vehicle.id) as SharedBuild | undefined
    const id = existing?.id ?? createBuildId(vehicle.year, vehicle.make, vehicle.model)

    // Build parts list from tracker + topRated
    const parts = Object.values(trackerItems).map((item) => {
      const rp = topRated.find((r) => r.part.id === item.partId)
      return {
        id: item.partId,
        name: rp?.part.name ?? item.partId,
        category: rp?.part.category ?? 'other',
        cost: item.cost,
        vendor: item.vendor,
        status: item.status,
      }
    })

    const totalCost = Object.values(trackerItems).reduce((sum, t) => sum + (t.cost ?? 0), 0)

    const sorted = [...journalEntries].sort((a, b) => a.date.localeCompare(b.date))
    const startDate = sorted[0]?.date
      ? new Date(sorted[0].date + 'T12:00:00').toISOString()
      : vehicle.createdAt

    const build: SharedBuild = {
      id,
      vehicleId: vehicle.id,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      heroPhoto: heroFile ?? undefined,
      contactLink: contactLink.trim() || undefined,
      parts,
      totalCost,
      startDate,
      journalEntries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    saveSharedBuild(build)
    setBuildId(id)
    setStep('done')
  }


function handleCopy() {
    if (!buildId) return
    navigator.clipboard.writeText(`${window.location.origin}/build/${buildId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const publicUrl = buildId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/build/${buildId}` : ''
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-[#2a2a30] bg-[#0e0e12] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e1e24] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white">Share Your Build</h2>
            <p className="text-xs text-zinc-500">{vehicleName}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-zinc-500 hover:bg-[#1a1a20] hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {step === 'setup' ? (
            <>
              {/* Car photo */}
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">Car Photo (Hero Image)</label>
                {heroFile ? (
                  <div className="relative overflow-hidden rounded-2xl border border-[#2a2a30]">
                    <img src={heroFile} alt="" className="h-40 w-full object-cover" />
                    <button
                      onClick={() => setHeroFile(null)}
                      className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-zinc-300 hover:bg-black/80"
                    >Remove</button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#2a2a30] py-8 hover:border-zinc-600">
                    <span className="text-2xl mb-2">📷</span>
                    <span className="text-sm text-zinc-400">Upload a photo of your car</span>
                    <span className="text-xs text-zinc-600 mt-1">JPG, PNG, HEIC</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0]
                        if (f) setHeroFile(await compressHero(f))
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Contact */}
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-400">Contact Link (optional)</label>
                <input
                  type="text"
                  value={contactLink}
                  onChange={(e) => setContactLink(e.target.value)}
                  placeholder="@yourinstagram or https://..."
                  className="w-full rounded-xl border border-[#2a2a30] bg-[#111116] px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                />
              </div>

              <button
                onClick={handleGenerate}
                className="w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-500 transition-colors"
              >
                Generate QR Code
              </button>
            </>
          ) : (
            <>
              {/* Theme toggle */}
              <div className="flex items-center justify-center gap-1 rounded-xl border border-[#2a2a30] bg-[#111116] p-1">
                {(['dark', 'light'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors capitalize ${
                      theme === t ? 'bg-[#2a2a30] text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                ))}
              </div>

              {/* QR code — protected */}
              <div className="flex flex-col items-center gap-3">
                <div
                  ref={qrRef}
                  className="relative select-none overflow-hidden rounded-2xl"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  style={{ WebkitUserDrag: 'none' } as React.CSSProperties}
                >
                  {/* The QR card */}
                  <div className={`p-5 ${theme === 'dark' ? 'bg-[#0a0a0f]' : 'bg-white'}`}>
                    <QRCodeSVG
                      value={publicUrl}
                      size={220}
                      level="H"
                      bgColor={theme === 'dark' ? '#0a0a0f' : '#ffffff'}
                      fgColor={theme === 'dark' ? '#a855f7' : '#0a0a0f'}
                      imageSettings={{
                        src: '/favicon-logo.png',
                        height: 42,
                        width: 42,
                        excavate: true,
                      }}
                    />
                    <p className={`mt-2 text-center text-[10px] font-medium tracking-wide ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      modvora labs · scan to see the build
                    </p>
                  </div>

                  {/* Watermark overlay — diagonal lines barely visible live, obvious in screenshots */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage: `repeating-linear-gradient(
                        -55deg,
                        transparent,
                        transparent 18px,
                        ${theme === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.045)'} 18px,
                        ${theme === 'dark' ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.045)'} 19px
                      )`,
                    }}
                  />

                  {/* PREVIEW badge */}
                  <div className="pointer-events-none absolute bottom-8 right-2 rotate-[-30deg] rounded border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-red-400/70">
                    Preview
                  </div>
                </div>

                <p className="max-w-[240px] text-center text-xs text-zinc-500">
                  Scan this to test your build page.<br />
                  <span className="text-purple-400">Order a print-ready sticker below.</span>
                </p>
              </div>

              {/* URL row */}
              <div className="flex items-center gap-2 rounded-xl border border-[#2a2a30] bg-[#111116] px-3 py-2.5">
                <span className="flex-1 truncate text-xs text-zinc-400">{publicUrl}</span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-lg border border-[#2a2a30] px-3 py-1 text-xs text-zinc-300 hover:text-white transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Order sticker CTA */}
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Get the real sticker</p>
                    <p className="mt-0.5 text-xs text-zinc-400">High-quality vinyl QR sticker printed and shipped to you. Perfect for windows, hoods, or dashboards.</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-purple-300">$8</span>
                </div>
                <a
                  href={`mailto:hello@modvoralabs.com?subject=QR Sticker Order — ${vehicleName}&body=Build URL: ${publicUrl}`}
                  className="mt-3 block w-full rounded-xl bg-purple-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-purple-500 transition-colors"
                >
                  Order Sticker →
                </a>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep('setup')}
                  className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Update photo or contact
                </button>
                <a
                  href={`/build/${buildId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-white transition-colors"
                >
                  Preview page →
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
