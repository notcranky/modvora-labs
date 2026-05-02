'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { SharedBuild, SharedBuildPart, loadSharedBuild, saveSharedBuild, calcBuildDuration } from '@/lib/shared-build'
import { useAuth } from '@/hooks/useAuth'
import { loadVehicles, SavedVehicle } from '@/lib/garage'

export default function PublicBuildPage() {
  const params = useParams()
  const id = params?.id as string
  const { user } = useAuth()
  const [build, setBuild] = useState<SharedBuild | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editContact, setEditContact] = useState('')
  const [editHeroPhoto, setEditHeroPhoto] = useState<string | null>(null)
  const [editParts, setEditParts] = useState<SharedBuildPart[]>([])
  const [editTotalCost, setEditTotalCost] = useState(0)
  const [editStartDate, setEditStartDate] = useState('')

  useEffect(() => {
    const b = loadSharedBuild(id)
    setBuild(b)
    
    // Check if current user owns this build
    if (b) {
      const vehicles = loadVehicles()
      const ownerVehicle = vehicles.find(v => v.id === b.vehicleId)
      setIsOwner(!!ownerVehicle)
      
      // Initialize edit state
      setEditContact(b.contactLink || '')
      setEditHeroPhoto(b.heroPhoto || null)
      setEditParts([...b.parts])
      setEditTotalCost(b.totalCost)
      setEditStartDate(b.startDate?.split('T')[0] || '')
    }
    
    setLoaded(true)
  }, [id])

  const handleSave = async () => {
    if (!build) return
    setSaving(true)
    
    const updated: SharedBuild = {
      ...build,
      contactLink: editContact.trim() || undefined,
      heroPhoto: editHeroPhoto || undefined,
      parts: editParts,
      totalCost: editTotalCost,
      startDate: editStartDate ? new Date(editStartDate).toISOString() : build.startDate,
      updatedAt: new Date().toISOString(),
    }
    
    saveSharedBuild(updated)
    setBuild(updated)
    setIsEditing(false)
    setSaving(false)
  }

  const togglePartVisibility = (partId: string) => {
    setEditParts(prev => prev.map(p => 
      p.id === partId ? { ...p, hidden: !p.hidden } : p
    ))
  }

  const updatePartCost = (partId: string, cost: number) => {
    setEditParts(prev => prev.map(p => 
      p.id === partId ? { ...p, cost } : p
    ))
    // Recalculate total
    const newTotal = editParts.reduce((sum, p) => sum + (p.id === partId ? cost : (p.cost || 0)), 0)
    setEditTotalCost(newTotal)
  }

  const handleHeroPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Compress image
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxW = 1200
      const scale = Math.min(1, maxW / img.width)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      setEditHeroPhoto(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.src = URL.createObjectURL(file)
  }

  const visibleParts = useMemo(() => {
    if (!build) return []
    return isEditing ? editParts : build.parts.filter(p => !(p as any).hidden)
  }, [build, editParts, isEditing])

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07070a]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    )
  }

  if (!build) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#07070a] px-4 text-center">
        <p className="text-5xl">🔧</p>
        <h1 className="text-2xl font-bold text-white">Build not found</h1>
        <p className="text-zinc-500">This build link may have expired or hasn&apos;t been shared yet.</p>
        <Link href="/" className="mt-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500">
          Create Your Own Build
        </Link>
      </div>
    )
  }

  const doneParts = visibleParts.filter((p) => p.status === 'installed')
  const milestones = build.journalEntries
    .filter((e) => e.isMilestone)
    .sort((a, b) => a.date.localeCompare(b.date))
  const journalSorted = [...build.journalEntries].sort((a, b) => b.date.localeCompare(a.date))
  const duration = calcBuildDuration(isEditing ? (editStartDate || build.startDate) : build.startDate)
  const vehicleName = `${build.year} ${build.make} ${build.model}${build.trim ? ' ' + build.trim : ''}`
  const displayTotal = isEditing ? editTotalCost : build.totalCost

  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      {/* ── Owner Edit Bar ───────────────────────────── */}
      {isOwner && (
        <div className="sticky top-0 z-50 bg-purple-600/90 backdrop-blur-sm border-b border-purple-500/30">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-medium text-white">👋 This is your build page</p>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="text-sm font-semibold text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-sm text-white/70 hover:text-white px-3 py-2"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm font-semibold text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                >
                  ✏️ Edit Page
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────── */}
      <div className="relative h-[55vw] max-h-[480px] min-h-[260px] w-full overflow-hidden bg-[#111116]">
        {isEditing ? (
          <div className="relative h-full w-full">
            {editHeroPhoto ? (
              <img src={editHeroPhoto} alt={vehicleName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#1a1a24]">
                <span className="text-7xl opacity-20">🚗</span>
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer hover:bg-black/40 transition-colors">
              <div className="text-center">
                <p className="text-lg font-semibold text-white mb-2">{editHeroPhoto ? 'Change Photo' : 'Add Hero Photo'}</p>
                <p className="text-sm text-zinc-400">Click to upload</p>
              </div>
              <input type="file" accept="image/*" className="sr-only" onChange={handleHeroPhotoChange} />
            </label>
          </div>
        ) : (
          <>
            {build.heroPhoto ? (
              <img src={build.heroPhoto} alt={vehicleName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-7xl opacity-10">🚗</span>
              </div>
            )}
          </>
        )}
        
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/20 to-transparent" />

        {/* vehicle name */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-400">Build Profile</p>
          <h1 className="mt-1 text-2xl font-black leading-tight text-white sm:text-4xl">{vehicleName}</h1>
        </div>

        {/* Modvora badge */}
        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-xs font-bold text-white/70">MV</span>
          <span className="text-[10px] text-white/40">Modvora Labs</span>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-2xl border border-[#1e1e24] bg-[#111116] p-3 text-center">
            {isEditing ? (
              <input
                type="number"
                value={editTotalCost}
                onChange={(e) => setEditTotalCost(Number(e.target.value))}
                className="w-full bg-transparent text-lg font-black text-white text-center outline-none"
              />
            ) : (
              <p className="text-lg font-black text-white sm:text-xl">
                {displayTotal > 0 ? `$${displayTotal.toLocaleString()}` : '—'}
              </p>
            )}
            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-zinc-500">Total Cost</p>
          </div>
          
          <div className="rounded-2xl border border-[#1e1e24] bg-[#111116] p-3 text-center">
            {isEditing ? (
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="w-full bg-transparent text-xs font-black text-white text-center outline-none"
              />
            ) : (
              <p className="text-lg font-black text-white sm:text-xl">{duration}</p>
            )}
            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-zinc-500">Build Time</p>
          </div>
          
          <div className="rounded-2xl border border-[#1e1e24] bg-[#111116] p-3 text-center">
            <p className="text-lg font-black text-white sm:text-xl">{doneParts.length}/{visibleParts.length}</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-zinc-500">Parts Done</p>
          </div>
          
          <div className="rounded-2xl border border-[#1e1e24] bg-[#111116] p-3 text-center">
            <p className="text-lg font-black text-white sm:text-xl">{milestones.length || '—'}</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-zinc-500">Milestones</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        {/* ── Parts list ───────────────────────────────── */}
        {visibleParts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                {isEditing ? `The Build (${visibleParts.length} parts)` : 'The Build'}
              </h2>
              {isEditing && (
                <p className="text-xs text-zinc-500">Toggle visibility or edit costs</p>
              )}
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#1e1e24]">
              {visibleParts.map((part, idx) => (
                <div
                  key={part.id}
                  className={`flex items-center gap-3 px-4 py-3 ${idx < visibleParts.length - 1 ? 'border-b border-[#1a1a20]' : ''}`}
                >
                  {isEditing ? (
                    <button
                      onClick={() => togglePartVisibility(part.id)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-red-500/40 bg-red-500/15 hover:bg-red-500/25 transition-colors"
                      title="Hide from public view"
                    >
                      <svg className="h-3 w-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : (
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${part.status === 'installed' ? 'border-green-500/40 bg-green-500/15' : 'border-[#2a2a30] bg-[#0e0e12]'}`}>
                      {part.status === 'installed' && (
                        <svg className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  )}
                  <span className={`flex-1 text-sm ${part.status === 'installed' ? 'text-white' : 'text-zinc-400'}`}>{part.name}</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={part.cost || ''}
                      onChange={(e) => updatePartCost(part.id, Number(e.target.value))}
                      placeholder="Cost"
                      className="w-20 text-sm text-right bg-transparent text-zinc-300 border border-[#2a2a30] rounded px-2 py-1 outline-none focus:border-purple-500"
                    />
                  ) : (
                    part.cost != null && (
                      <span className="text-sm font-semibold text-zinc-300">${part.cost.toLocaleString()}</span>
                    )
                  )}
                  {part.status !== 'installed' && !isEditing && (
                    <span className="rounded-full border border-[#2a2a30] px-2 py-0.5 text-[10px] font-medium capitalize text-zinc-500">
                      {part.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {/* Hidden parts toggle in edit mode */}
            {isEditing && editParts.filter((p: any) => p.hidden).length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-zinc-500 mb-2">Hidden parts (click to show):</p>
                <div className="flex flex-wrap gap-2">
                  {editParts.filter((p: any) => p.hidden).map(part => (
                    <button
                      key={part.id}
                      onClick={() => togglePartVisibility(part.id)}
                      className="px-3 py-1.5 rounded-full border border-zinc-600 bg-zinc-800/50 text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
                    >
                      + {part.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Milestones ───────────────────────────────── */}
        {milestones.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Milestones</h2>
            <div className="space-y-2">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                  <span className="text-lg">⭐</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-200">{m.milestoneLabel || 'Milestone'}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(m.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Journal ──────────────────────────────────── */}
        {journalSorted.length > 0 && (
          <section>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Build Journal</h2>
            <div className="relative space-y-0">
              <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gradient-to-b from-[#2a2a30] via-[#2a2a30] to-transparent" />
              {journalSorted.map((entry) => {
                const d = new Date(entry.date + 'T12:00:00')
                return (
                  <div key={entry.id} className="relative flex gap-5 pb-7 pl-8">
                    {/* dot */}
                    <div className={`absolute left-0 top-1 h-[11px] w-[11px] rounded-full border ${entry.isMilestone ? 'border-amber-500/60 bg-amber-500/30' : 'border-[#3a3a40] bg-[#1a1a20]'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-zinc-300">
                          {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {entry.mileage != null && (
                          <span className="text-[10px] text-zinc-600">{entry.mileage.toLocaleString()} mi</span>
                        )}
                        {entry.isMilestone && (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                            ⭐ {entry.milestoneLabel || 'Milestone'}
                          </span>
                        )}
                        {entry.partName && (
                          <span className="rounded-full border border-purple-500/25 bg-purple-500/10 px-2 py-0.5 text-[9px] font-medium text-purple-300">
                            {entry.partName}
                          </span>
                        )}
                      </div>
                      {entry.narrative && (
                        <p className="text-sm leading-relaxed text-zinc-400">{entry.narrative}</p>
                      )}
                      {entry.photos.length > 0 && (
                        <div className={`mt-3 grid gap-2 ${entry.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {entry.photos.map((src, i) => (
                            <img
                              key={i}
                              src={src}
                              alt=""
                              onClick={() => setLightbox(src)}
                              className="w-full cursor-zoom-in rounded-xl border border-[#2a2a30] object-cover"
                              style={{ aspectRatio: '4/3' }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Contact ──────────────────────────────────── */}
        <section className="rounded-2xl border border-[#1e1e24] bg-[#111116] p-6 text-center">
          {isEditing ? (
            <>
              <p className="text-sm font-semibold text-zinc-200 mb-3">Contact Link (Instagram, etc.)</p>
              <input
                type="text"
                value={editContact}
                onChange={(e) => setEditContact(e.target.value)}
                placeholder="@username or https://..."
                className="w-full max-w-sm mx-auto block text-sm text-center bg-transparent text-white border border-[#2a2a35] rounded-xl px-4 py-3 outline-none focus:border-purple-500"
              />
            </>
          ) : build.contactLink ? (
            <>
              <p className="text-sm font-semibold text-zinc-200">Want to know more about this build?</p>
              <p className="mt-1 text-xs text-zinc-500">Reach out to the builder directly.</p>
              <a
                href={build.contactLink.startsWith('http') ? build.contactLink : `https://instagram.com/${build.contactLink.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-500"
              >
                Contact the Builder
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </>
          ) : (
            <>
              <p className="text-sm text-zinc-500">No contact link added yet.</p>
              {isOwner && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-3 text-sm text-purple-400 hover:text-purple-300"
                >
                  Add one →
                </button>
              )}
            </>
          )}
        </section>

        {/* ── Footer ───────────────────────────────────── */}
        <div className="border-t border-[#1a1a20] pt-6 text-center">
          <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Powered by <span className="font-semibold text-zinc-500">Modvora Labs</span> · Track your own build →
          </Link>
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  )
}
