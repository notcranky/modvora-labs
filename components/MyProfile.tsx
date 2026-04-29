'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchPublishedBuilds, loadCommunityPosts, CommunityPostWithVehicle } from '@/lib/community'
import { loadVehicles } from '@/lib/garage'
import { toHandle } from '@/lib/profiles'
import HPBadge, { getStoredHP, storeHP } from '@/components/HPBadge'
import { useResolvedImageMap } from '@/lib/local-images'
import { useAuth } from '@/hooks/useAuth'

const LIKES_KEY = 'modvora_likes'
const SAVES_KEY = 'modvora_saves'
const COMMENTS_KEY = 'modvora_comments'

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    try {
      return JSON.parse(raw) as T
    } catch {
      return raw as unknown as T
    }
  } catch {
    return fallback
  }
}

function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const size = 240
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(''); return }
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2
        const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

type Tab = 'posts' | 'saved' | 'liked' | 'commented'

export default function MyProfile() {
  const [activeTab, setActiveTab] = useState<Tab>('posts')
  const [allPosts, setAllPosts] = useState<CommunityPostWithVehicle[]>([])
  const [ownedVehicleIds, setOwnedVehicleIds] = useState<Set<string>>(new Set())
  const [ownedPostIds, setOwnedPostIds] = useState<Set<string>>(new Set())
  const [likes, setLikes] = useState<Record<string, boolean>>({})
  const [saves, setSaves] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, unknown[]>>({})
  const [commenterName, setCommenterName] = useState('')
  const [commenterHandle, setCommenterHandle] = useState('')
  const [profilePhoto, setProfilePhoto] = useState<string>('')
  const [bio, setBio] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  // Edit modal state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editHandle, setEditHandle] = useState('')
  const [editPhoto, setEditPhoto] = useState<string>('')
  const [editBio, setEditBio] = useState('')
  const [handleError, setHandleError] = useState('')
  const [editHP, setEditHP] = useState<string>('')
  const [editCrankHP, setEditCrankHP] = useState<string>('')
  const [hp, setHp] = useState<number | null>(null)
  const [crankHp, setCrankHp] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Load profile from database if logged in, otherwise localStorage
  useEffect(() => {
    fetchPublishedBuilds().then(async (posts) => {
      setAllPosts(posts)
      setOwnedVehicleIds(new Set(loadVehicles().map((v) => v.id)))
      setOwnedPostIds(new Set(loadCommunityPosts().map((p) => p.id)))
      setLikes(safeRead(LIKES_KEY, {}))
      setSaves(safeRead(SAVES_KEY, {}))
      setComments(safeRead(COMMENTS_KEY, {}))

      // If logged in, try to load from database first
      if (user) {
        try {
          console.log('[MyProfile] Loading profile from DB...')
          const res = await fetch('/api/profile')
          console.log('[MyProfile] Profile response:', res.status)
          if (res.ok) {
            const { profile } = await res.json()
            console.log('[MyProfile] Loaded profile:', profile)
            if (profile && profile.email) {
              setCommenterName(profile.name || '')
              setCommenterHandle(profile.handle || toHandle(profile.name || ''))
              setProfilePhoto(profile.photo_url || '')
              setBio(profile.bio || '')
              setHp(profile.horsepower_wh || null)
              setCrankHp(profile.horsepower_crank || null)
              // Also sync to localStorage for offline
              localStorage.setItem('modvora_commenter_name', profile.name || '')
              localStorage.setItem('modvora_commenter_handle', profile.handle || '')
              if (profile.photo_url) localStorage.setItem('modvora_profile_photo', profile.photo_url)
              if (profile.bio) localStorage.setItem('modvora_profile_bio', profile.bio)
              storeHP(profile.horsepower_wh, profile.horsepower_crank)
              setLoaded(true)
              return
            }
          } else {
            const err = await res.text()
            console.error('[MyProfile] Failed to load profile:', err)
          }
        } catch (e) {
          console.error('[MyProfile] Error loading profile:', e)
        }
      }

      // Fallback to localStorage
      console.log('[MyProfile] Falling back to localStorage')
      const name = safeRead<string>('modvora_commenter_name', '')
      const handle = safeRead<string>('modvora_commenter_handle', '') || toHandle(name)
      const photo = safeRead<string>('modvora_profile_photo', '')
      const storedBio = safeRead<string>('modvora_profile_bio', '')
      setCommenterName(name)
      setCommenterHandle(handle)
      setProfilePhoto(photo)
      setBio(storedBio)
      const storedHP = getStoredHP()
      setHp(storedHP.whp)
      setCrankHp(storedHP.crank)
      setLoaded(true)
    })
  }, [user])

  function openEdit() {
    setEditName(commenterName)
    setEditHandle(commenterHandle)
    setEditPhoto(profilePhoto)
    setEditBio(bio)
    setEditHP(hp?.toString() || '')
    setEditCrankHP(crankHp?.toString() || '')
    setHandleError('')
    setEditing(true)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await compressImageFile(file)
    setEditPhoto(dataUrl)
  }

  async function checkHandleUnique(handle: string): Promise<boolean> {
    if (!handle || handle === commenterHandle) return true

    // Check against database
    try {
      const res = await fetch(`/api/profile/check-handle?handle=${encodeURIComponent(handle)}`)
      if (res.ok) {
        const { available } = await res.json()
        return available
      }
    } catch {
      // Fallback to local check if API fails
    }

    // Fallback: check local posts
    const takenHandles = new Set(
      allPosts
        .filter((p) => !ownedVehicleIds.has(p.vehicleId) && !ownedPostIds.has(p.id) && !p.isLocal)
        .map((p) => toHandle(p.vehicle.name || '')),
    )
    return !takenHandles.has(handle)
  }

  async function saveProfile() {
    const trimmedName = editName.trim()
    const trimmedHandle = toHandle(editHandle.replace(/^@/, '').trim())

    // Check handle uniqueness
    if (trimmedHandle && trimmedHandle !== commenterHandle) {
      const isUnique = await checkHandleUnique(trimmedHandle)
      if (!isUnique) {
        setHandleError(`@${trimmedHandle} is already taken`)
        return
      }
    }

    setSaving(true)
    const finalHandle = trimmedHandle || toHandle(trimmedName)
    const whpNum = editHP ? parseInt(editHP, 10) : null
    const crankNum = editCrankHP ? parseInt(editCrankHP, 10) : null

    // Save to database if logged in
    if (user) {
      try {
        console.log('[MyProfile] Saving profile to DB...', { name: trimmedName, handle: finalHandle })
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            handle: finalHandle,
            bio: editBio.trim() || null,
            photo_url: editPhoto || null,
            horsepower_wh: whpNum && whpNum > 0 ? whpNum : null,
            horsepower_crank: crankNum && crankNum > 0 ? crankNum : null,
          }),
        })
        console.log('[MyProfile] Save response:', res.status)
        if (!res.ok) {
          const err = await res.text()
          console.error('[MyProfile] Failed to save:', err)
          if (err.includes('taken')) {
            setHandleError(`@${finalHandle} is already taken`)
            setSaving(false)
            return
          }
        } else {
          const saved = await res.json()
          console.log('[MyProfile] Saved profile:', saved)
        }
      } catch (e) {
        console.error('[MyProfile] Error saving:', e)
      }
    }

    // Update local state
    setCommenterName(trimmedName)
    setCommenterHandle(finalHandle)
    setProfilePhoto(editPhoto)
    setBio(editBio.trim())
    setHp(whpNum && whpNum > 0 ? whpNum : null)
    setCrankHp(crankNum && crankNum > 0 ? crankNum : null)

    // Always save to localStorage as backup
    try {
      if (trimmedName) localStorage.setItem('modvora_commenter_name', trimmedName)
      if (finalHandle) localStorage.setItem('modvora_commenter_handle', finalHandle)
      if (editPhoto) localStorage.setItem('modvora_profile_photo', editPhoto)
      else localStorage.removeItem('modvora_profile_photo')
      if (editBio.trim()) localStorage.setItem('modvora_profile_bio', editBio.trim())
      else localStorage.removeItem('modvora_profile_bio')
      storeHP(whpNum && whpNum > 0 ? whpNum : null, crankNum && crankNum > 0 ? crankNum : null)
    } catch {}

    setSaving(false)
    setEditing(false)
  }

  const myPosts = useMemo(
    () => allPosts.filter((p) => ownedVehicleIds.has(p.vehicleId) || ownedPostIds.has(p.id) || p.isLocal),
    [allPosts, ownedVehicleIds, ownedPostIds],
  )

  const savedPosts = useMemo(() => allPosts.filter((p) => saves[p.id]), [allPosts, saves])
  const likedPosts = useMemo(() => allPosts.filter((p) => likes[p.id]), [allPosts, likes])
  const commentedPosts = useMemo(
    () => allPosts.filter((p) => (comments[p.id] as unknown[])?.length > 0),
    [allPosts, comments],
  )

  const activePosts =
    activeTab === 'posts' ? myPosts
    : activeTab === 'saved' ? savedPosts
    : activeTab === 'liked' ? likedPosts
    : commentedPosts

  const heroImages = useMemo(() => activePosts.map((p) => p.heroImage), [activePosts])
  const resolvedImageMap = useResolvedImageMap(heroImages)

  const displayName = commenterName || 'Your Name'
  const displayHandle = commenterHandle || toHandle(commenterName) || 'yourhandle'
  const initials = commenterName ? commenterName.slice(0, 2).toUpperCase() : '?'

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'posts', label: 'Posts', count: myPosts.length },
    { id: 'saved', label: 'Saved', count: savedPosts.length },
    { id: 'liked', label: 'Liked', count: likedPosts.length },
    { id: 'commented', label: 'Commented', count: commentedPosts.length },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0b] px-4 pb-16 pt-24 sm:px-6">
      <div className="mx-auto max-w-[680px]">
        {/* Profile header */}
        <div className="mb-6 flex items-start gap-5">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-purple-900 text-2xl font-bold text-white">
            {profilePhoto
              ? <img src={profilePhoto} alt={displayName} className="h-full w-full object-cover" />
              : initials}
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className={`text-2xl font-bold ${commenterName ? 'text-white' : 'text-zinc-500'}`}>{displayName}</h1>
              <HPBadge hp={hp} crankHP={crankHp} size="md" />
            </div>
            <p className="mt-0.5 text-sm text-zinc-500">@{displayHandle}</p>
            {bio && <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">{bio}</p>}
            {loaded && (
              <p className="mt-1 text-sm text-zinc-500">
                {myPosts.length} {myPosts.length === 1 ? 'post' : 'posts'}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={openEdit}
                className="rounded-xl border border-[#2a2a35] bg-[#18181f] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white"
              >
                Edit Profile
              </button>
              <Link
                href="/dashboard/publish"
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500"
              >
                Publish a build
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-[#1e1e25]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 pb-3 pt-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-purple-500 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
              {loaded && tab.count > 0 && (
                <span className="ml-1.5 text-xs text-zinc-600">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Post grid */}
        {!loaded ? (
          <div className="py-20 text-center text-sm text-zinc-600">Loading…</div>
        ) : activePosts.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#2a2a30] bg-[#101014] p-10 text-center">
            <p className="text-sm text-zinc-500">
              {activeTab === 'posts' ? 'No published builds yet.'
                : activeTab === 'saved' ? 'No saved posts yet.'
                : activeTab === 'liked' ? 'No liked posts yet.'
                : 'No commented posts yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {activePosts.map((post) => {
              const resolved = resolvedImageMap[post.heroImage] || post.heroImage
              return (
                <Link
                  key={post.id}
                  href={`/community/${post.slug}`}
                  className="group overflow-hidden rounded-[20px] border border-[#23232a] bg-[#101014] transition-colors hover:border-purple-500/30"
                >
                  <div className="relative w-full overflow-hidden bg-[#0a0a0e]" style={{ aspectRatio: '4/3' }}>
                    {resolved ? (
                      <img src={resolved} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-700">
                        <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current" strokeWidth={1.5}>
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="m21 15-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-3">
                    <p className="truncate text-sm font-semibold text-white">{post.title}</p>
                    {post.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{post.description}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setEditing(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-[24px] border border-[#2a2a35] bg-[#101014] p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Edit Profile</h2>
                <button onClick={() => setEditing(false)} className="rounded-full p-1.5 text-zinc-500 hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2}><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Photo */}
              <div className="mb-5 flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-purple-900 text-2xl font-bold text-white">
                    {editPhoto
                      ? <img src={editPhoto} alt="Preview" className="h-full w-full object-cover" />
                      : (editName ? editName.slice(0, 2).toUpperCase() : initials)}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-[#2a2a35] bg-[#18181f] text-zinc-400 hover:text-white transition-colors"
                    aria-label="Upload photo"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth={2}>
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                </div>
                {editPhoto && (
                  <button type="button" onClick={() => setEditPhoto('')} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                    Remove photo
                  </button>
                )}
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs text-zinc-500">Display name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-[#2a2a35] bg-[#18181f] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-purple-500/50 transition-colors"
                />
              </div>

              {/* Bio */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs text-zinc-500">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell the community about your build journey…"
                  maxLength={160}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#2a2a35] bg-[#18181f] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-purple-500/50 transition-colors"
                />
                <p className="mt-0.5 text-right text-[11px] text-zinc-600">{editBio.length}/160</p>
              </div>

              {/* HP Badge */}
              <div className="mb-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                <label className="mb-1.5 block text-xs font-medium text-orange-400">🔥 Horsepower Badge</label>
                <p className="mb-3 text-[11px] text-zinc-500">Display your build's power. Shows as a badge next to your name.</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500">WHP</label>
                    <input
                      type="number"
                      value={editHP}
                      onChange={(e) => setEditHP(e.target.value)}
                      placeholder="340"
                      min="0"
                      max="5000"
                      className="w-full rounded-xl border border-[#2a2a35] bg-[#18181f] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-orange-500/50 transition-colors"
                    />
                    <p className="mt-0.5 text-[10px] text-zinc-600">Wheel HP (preferred)</p>
                  </div>
                  <div className="flex-1">
                    <label className="mb-1.5 block text-[10px] uppercase tracking-wider text-zinc-500">Crank HP</label>
                    <input
                      type="number"
                      value={editCrankHP}
                      onChange={(e) => setEditCrankHP(e.target.value)}
                      placeholder="400"
                      min="0"
                      max="5000"
                      className="w-full rounded-xl border border-[#2a2a35] bg-[#18181f] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-orange-500/50 transition-colors"
                    />
                    <p className="mt-0.5 text-[10px] text-zinc-600">If no WHP</p>
                  </div>
                </div>
              </div>

              {/* Handle */}
              <div className="mb-6">
                <label className="mb-1.5 block text-xs text-zinc-500">Handle</label>
                <div className="flex items-center gap-1.5 rounded-xl border bg-[#18181f] px-3 py-2 transition-colors focus-within:border-purple-500/50 border-[#2a2a35]">
                  <span className="text-sm text-zinc-500">@</span>
                  <input
                    type="text"
                    value={editHandle.replace(/^@/, '')}
                    onChange={(e) => { setEditHandle(e.target.value); setHandleError('') }}
                    placeholder="yourhandle"
                    className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
                  />
                </div>
                {handleError && <p className="mt-1.5 text-xs text-red-400">{handleError}</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                    saving ? 'bg-purple-600/50 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500'
                  }`}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="rounded-xl border border-[#2a2a35] px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
