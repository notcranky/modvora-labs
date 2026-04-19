'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCommunityPostBySlug, CommunityPostWithVehicle } from '@/lib/community'
import { useResolvedImageMap } from '@/lib/local-images'

function getHeroFrameStyle(frame?: { x: number; y: number; zoom: number; orientation?: 'landscape' | 'portrait' }) {
  if (!frame) return {}

  return {
    objectPosition: `${frame.x}% ${frame.y}%`,
    transform: `scale(${Math.max(frame.zoom, 1)})`,
  }
}

function getHeroHeightClass(orientation?: 'landscape' | 'portrait') {
  return orientation === 'portrait' ? 'py-28 sm:py-36 lg:py-44' : 'py-20 sm:py-24 lg:py-28'
}

function getGalleryHeroHeightClass(orientation?: 'landscape' | 'portrait') {
  return orientation === 'portrait' ? 'h-[32rem] sm:h-[36rem]' : 'h-72 sm:h-80'
}

export default function CommunityPostPage({ slug }: { slug: string }) {
  const [post, setPost] = useState<CommunityPostWithVehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const resolvedImageMap = useResolvedImageMap(post ? [post.heroImage, ...post.gallery] : [])

  useEffect(() => {
    setPost(getCommunityPostBySlug(slug))
    setLoading(false)
  }, [slug])

  useEffect(() => {
    if (lightboxIndex === null) return
    function onKey(e: KeyboardEvent) {
      if (!post) return
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight') setLightboxIndex((i) => i !== null ? Math.min(i + 1, post.gallery.length - 1) : null)
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => i !== null ? Math.max(i - 1, 0) : null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, post])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] px-4 pb-16 pt-24">
        <div className="mx-auto flex max-w-5xl items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            <p className="text-zinc-400">Loading showcase...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] px-4 pb-16 pt-24">
        <div className="mx-auto max-w-3xl rounded-[30px] border border-[#23232a] bg-[#111116] p-10 text-center">
          <div className="text-5xl">📷</div>
          <h1 className="mt-5 text-3xl font-semibold text-white">Build not found</h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">This showcase either does not exist locally yet or has not been published on this device.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/community" className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-purple-500">Back to community</Link>
            <Link href="/dashboard/publish" className="rounded-xl border border-[#2a2a30] px-5 py-3 font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Publish a build</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] pb-16 pt-16">
      <section className="relative overflow-hidden border-b border-[#1e1e24]">
        <img src={resolvedImageMap[post.heroImage] || post.heroImage} alt={post.title} className="absolute inset-0 h-full w-full object-cover" style={getHeroFrameStyle(post.heroFrame)} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/85" />
        <div className={`relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 ${getHeroHeightClass(post.heroFrame?.orientation)}`}>
          <div className="max-w-4xl">
            <Link href="/community" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.22em] text-zinc-200 transition-colors hover:border-purple-500/30 hover:text-white">← Back to gallery</Link>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-purple-200">{post.status === 'completed' ? 'Completed build' : 'In progress build'}</span>
              <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-200">{post.progressPercent}% progress</span>
              {post.isLocal && <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-200">Editable local post</span>}
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">{post.title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-200/90 sm:text-base">{post.description}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-zinc-200/85">
              <span>{post.vehicleLabel}</span>
              <span>•</span>
              <span>{post.vibe}</span>
              <span>•</span>
              <span>{post.checkedPartsCount} tracked parts acquired</span>
            </div>
            {post.isLocal && (
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/dashboard/publish?edit=${encodeURIComponent(post.slug)}`} className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-500">Edit post</Link>
                <p className="self-center text-xs text-zinc-400">Opens the same publish flow with your existing post details loaded in.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto mt-8 max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[30px] border border-[#23232a] bg-[linear-gradient(180deg,#141419_0%,#0f0f13_100%)] p-6 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Build snapshot</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Platform', value: post.vehicleLabel },
                { label: 'Direction', value: post.vehicle.focus },
                { label: 'Budget', value: post.vehicle.budget || 'Not set' },
                { label: 'Status', value: post.status === 'completed' ? 'Completed' : 'Still evolving' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
                  <p className="mt-2 text-sm font-medium text-white">{item.value}</p>
                </div>
              ))}
            </div>

            {post.vehicle.goals && (
              <div className="mt-5 rounded-2xl border border-purple-500/15 bg-purple-500/8 p-4">
                <p className="text-sm font-medium text-purple-200">Builder goal</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{post.vehicle.goals}</p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-[#2a2a30] bg-[#111116] px-3 py-1 text-xs text-zinc-300">#{tag}</span>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-[#23232a] bg-[linear-gradient(180deg,#131318_0%,#0f0f13_100%)] p-6 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Showcase gallery</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">A proper MVP build page, not just a giant caption.</h2>
              </div>
              <span className="rounded-full border border-[#2a2a30] bg-[#111116] px-3 py-1 text-xs text-zinc-400">{post.gallery.length} photos</span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {post.gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => setLightboxIndex(index)}
                  className={`group overflow-hidden rounded-2xl border border-[#23232a] bg-[#111116] text-left ${index === 0 ? 'sm:col-span-2' : ''}`}
                >
                  <div className={`relative overflow-hidden ${index === 0 ? getGalleryHeroHeightClass(post.heroFrame?.orientation) : 'h-52'}`}>
                    <img src={resolvedImageMap[image] || image} alt={`${post.title} photo ${index + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" style={index === 0 ? getHeroFrameStyle(post.heroFrame) : undefined} />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                      <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-white opacity-0 transition-opacity group-hover:opacity-80" strokeWidth={1.5}>
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[30px] border border-[#23232a] bg-[linear-gradient(180deg,#141419_0%,#101015_100%)] p-6 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Current setup</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">What this build is working with</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                <p className="text-xs text-zinc-500">Engine</p>
                <p className="mt-2 text-sm font-medium text-white">{post.vehicle.engine || 'Not listed'}</p>
              </div>
              <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                <p className="text-xs text-zinc-500">Drivetrain</p>
                <p className="mt-2 text-sm font-medium text-white">{post.vehicle.drivetrain || 'Not listed'}</p>
              </div>
              <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4 sm:col-span-2">
                <p className="text-xs text-zinc-500">Current mods</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{post.vehicle.currentMods || 'Still mostly stock.'}</p>
              </div>
              {post.vehicle.notes && (
                <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4 sm:col-span-2">
                  <p className="text-xs text-zinc-500">Builder notes</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-300">{post.vehicle.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            {post.links.length > 0 && (
              <div className="rounded-[30px] border border-[#23232a] bg-[linear-gradient(180deg,#141419_0%,#0f0f13_100%)] p-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Extra links</p>
                <div className="mt-4 space-y-3">
                  {post.links.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-2xl border border-[#23232a] bg-black/20 px-4 py-3 text-sm text-zinc-300 transition-colors hover:border-purple-500/30 hover:text-white">
                      <span>{link.label}</span>
                      <span>↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[30px] border border-purple-500/15 bg-[linear-gradient(180deg,#15151a_0%,#101015_100%)] p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Want your own?</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Publish from the garage in a couple minutes.</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">Pick an existing saved vehicle, add title + story + vibe, then publish. The core car details stay linked automatically.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/dashboard/publish" className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-purple-500">Publish a build</Link>
                <Link href="/dashboard" className="rounded-xl border border-[#2a2a30] px-5 py-3 font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Open garage</Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && post && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={() => setLightboxIndex(null)}>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(Math.max(lightboxIndex - 1, 0)) }}
            disabled={lightboxIndex === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/40 p-3 text-white transition-colors hover:bg-black/70 disabled:opacity-20"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2}><path d="M15 18l-6-6 6-6" /></svg>
          </button>

          <img
            src={resolvedImageMap[post.gallery[lightboxIndex]] || post.gallery[lightboxIndex]}
            alt={`${post.title} photo ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(Math.min(lightboxIndex + 1, post.gallery.length - 1)) }}
            disabled={lightboxIndex === post.gallery.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/40 p-3 text-white transition-colors hover:bg-black/70 disabled:opacity-20"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2}><path d="M9 18l6-6-6-6" /></svg>
          </button>

          <button onClick={() => setLightboxIndex(null)} className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/40 p-2 text-white hover:bg-black/70">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2}><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {post.gallery.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setLightboxIndex(i) }}
                className={`h-1.5 rounded-full transition-all ${i === lightboxIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/30'}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
