'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { fetchPublishedBuilds, CommunityPostWithVehicle } from '@/lib/community'
import { useResolvedImageMap } from '@/lib/local-images'

function getHeroFrameStyle(frame?: { x: number; y: number; zoom: number; orientation?: 'landscape' | 'portrait' }) {
  if (!frame) return {}

  return {
    objectPosition: `${frame.x}% ${frame.y}%`,
    transform: `scale(${Math.max(frame.zoom, 1)})`,
  }
}

function getHeroHeightClass(orientation?: 'landscape' | 'portrait') {
  return orientation === 'portrait' ? 'min-h-[34rem]' : 'min-h-[420px]'
}

function getCardHeightClass(orientation?: 'landscape' | 'portrait') {
  return orientation === 'portrait' ? 'h-80' : 'h-64'
}

const filters = ['all', 'in-progress', 'completed'] as const

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-dashed border-[#2a2a30] bg-[#101014] p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-2xl">🏁</div>
      <h3 className="mt-5 text-2xl font-semibold text-white">No community builds yet</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">Publish one of your saved garage builds to kick off the gallery. Car details come from the linked vehicle automatically, so posting stays quick.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-purple-500">Go to Garage</Link>
        <Link href="/dashboard/publish" className="rounded-xl border border-[#2a2a30] px-5 py-3 font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Publish a build</Link>
      </div>
    </div>
  )
}

export default function CommunityGallery() {
  const [posts, setPosts] = useState<CommunityPostWithVehicle[]>([])
  const [statusFilter, setStatusFilter] = useState<(typeof filters)[number]>('all')

  useEffect(() => {
    fetchPublishedBuilds().then(setPosts)
  }, [])

  const featured = posts[0] ?? null
  const resolvedImageMap = useResolvedImageMap(posts.flatMap((post) => [post.heroImage]))
  const list = useMemo(() => {
    return posts.filter((post, index) => {
      if (featured && index === 0) return false
      return statusFilter === 'all' || post.status === statusFilter
    })
  }, [featured, posts, statusFilter])

  return (
    <div className="min-h-screen bg-[#0a0a0b] px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-[#212129] bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_32%),linear-gradient(180deg,#141419_0%,#0d0d11_100%)] p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-purple-200">
                <span className="h-2 w-2 rounded-full bg-purple-400" />
                Community gallery
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">Real builds, clean showcases, and a faster path from garage to public post.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">Browse saved builds that were published straight from the garage. No re-entering vehicle info, no messy flow — just the car, the vibe, and the story around it.</p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <Link href="/dashboard/publish" className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-purple-500">Publish my build</Link>
                <Link href="/dashboard" className="rounded-xl border border-[#2a2a30] px-5 py-3 font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white">Back to garage</Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Published builds', value: String(posts.length).padStart(2, '0') },
                { label: 'Completed showcases', value: String(posts.filter((post) => post.status === 'completed').length).padStart(2, '0') },
                { label: 'Fresh in progress', value: String(posts.filter((post) => post.status === 'in-progress').length).padStart(2, '0') },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {featured && (
          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Link href={`/community/${featured.slug}`} className="group relative overflow-hidden rounded-[30px] border border-[#23232a] bg-[#101014]">
              <img src={resolvedImageMap[featured.heroImage] || featured.heroImage} alt={featured.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" style={getHeroFrameStyle(featured.heroFrame)} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/80" />
              <div className={`relative flex flex-col justify-end p-6 sm:p-8 ${getHeroHeightClass(featured.heroFrame?.orientation)}`}>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-200">Featured build</span>
                <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">{featured.title}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-200/90">{featured.description}</p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm text-zinc-200/85">
                  <span>{featured.vehicleLabel}</span>
                  <span>•</span>
                  <span>{featured.status === 'completed' ? 'Completed' : 'In progress'}</span>
                  <span>•</span>
                  <span>{featured.progressPercent}% build progress</span>
                </div>
              </div>
            </Link>

            <div className="rounded-[30px] border border-[#23232a] bg-[linear-gradient(180deg,#131318_0%,#0f0f13_100%)] p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">Browse mood</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Filter what you want to see</h3>
                </div>
                <span className="rounded-full border border-[#2a2a30] bg-[#15151a] px-3 py-1 text-xs text-zinc-400">MVP</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {filters.map((filter) => {
                  const active = filter === statusFilter
                  return (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${active ? 'bg-purple-600 text-white' : 'border border-[#2a2a30] bg-[#111116] text-zinc-300 hover:text-white'}`}
                    >
                      {filter.replace('-', ' ')}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 space-y-3">
                {posts.slice(0, 3).map((post) => (
                  <Link key={post.id} href={`/community/${post.slug}`} className="flex items-center justify-between gap-3 rounded-2xl border border-[#23232a] bg-black/20 px-4 py-3 transition-colors hover:border-purple-500/30 hover:bg-[#15151b]">
                    <div>
                      <p className="text-sm font-semibold text-white">{post.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">{post.vehicleLabel} · {post.vibe}</p>
                    </div>
                    <span className="text-xs text-zinc-400">{post.progressPercent}%</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Gallery</p>
              <h2 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Freshly published community builds</h2>
            </div>
            <p className="text-sm text-zinc-500">Each card is linked to a saved garage build under the hood.</p>
          </div>

          {list.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {list.map((post) => (
                <Link key={post.id} href={`/community/${post.slug}`} className="group overflow-hidden rounded-[28px] border border-[#23232a] bg-[linear-gradient(180deg,#141419_0%,#0f0f13_100%)] transition-colors hover:border-purple-500/30">
                  <div className={`relative w-full overflow-hidden ${getCardHeightClass(post.heroFrame?.orientation)}`}>
                    <img src={resolvedImageMap[post.heroImage] || post.heroImage} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" style={getHeroFrameStyle(post.heroFrame)} />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-purple-200">{post.status === 'completed' ? 'Completed' : 'In progress'}</span>
                      <span className="rounded-full border border-[#2a2a30] bg-[#111116] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-zinc-400">{post.progressPercent}% built</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{post.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">{post.description}</p>
                    </div>
                    <div className="rounded-2xl border border-[#23232a] bg-black/20 p-4">
                      <p className="text-sm font-medium text-zinc-200">{post.vehicleLabel}</p>
                      <p className="mt-1 text-xs text-zinc-500">{post.vibe}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="rounded-full border border-[#2a2a30] bg-[#111116] px-3 py-1 text-xs text-zinc-300">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
