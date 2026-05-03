'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { fetchPublishedBuilds, CommunityPostWithVehicle } from '@/lib/community'
import { useResolvedImageMap } from '@/lib/local-images'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function CommunityExplore() {
  const [posts, setPosts] = useState<CommunityPostWithVehicle[]>([])
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchPublishedBuilds().then((p) => {
      setPosts(p)
      setLoaded(true)
    })
  }, [])

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const post of posts) {
      for (const tag of post.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1
      }
    }
    return counts
  }, [posts])

  const sortedTags = useMemo(() =>
    Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count })),
    [tagCounts],
  )

  const displayPosts = useMemo(() => {
    if (!activeTag) return posts
    return posts.filter((p) => p.tags.includes(activeTag))
  }, [posts, activeTag])

  const heroImages = useMemo(() => displayPosts.map((p) => p.heroImage), [displayPosts])
  const resolvedImageMap = useResolvedImageMap(heroImages)

  return (
    <div className="min-h-screen bg-[#0a0a0b] px-4 pb-16 pt-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Link href="/community" className="text-zinc-500 transition-colors hover:text-zinc-300 text-sm">← Community</Link>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Explore builds</h1>
          <p className="mt-1.5 text-sm text-zinc-500">Browse by tag and find builds that match your style.</p>
        </div>

        <div className="flex gap-6 lg:gap-8">
          {/* Tag sidebar */}
          <aside className="hidden w-48 shrink-0 lg:block">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-zinc-600">Browse by tag</p>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTag(null)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${!activeTag ? 'bg-purple-500/10 text-purple-300' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                All builds
                <span className="ml-1.5 text-xs text-zinc-600">({posts.length})</span>
              </button>
              {sortedTags.map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${activeTag === tag ? 'bg-purple-500/10 text-purple-300' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  #{tag}
                  <span className="ml-1.5 text-xs text-zinc-600">({count})</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Mobile tag pills */}
          <div className="flex-1 min-w-0">
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              <button
                onClick={() => setActiveTag(null)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${!activeTag ? 'border-purple-500/40 bg-purple-500/10 text-purple-300' : 'border-[#2a2a35] text-zinc-500'}`}
              >
                All
              </button>
              {sortedTags.map(({ tag }) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${activeTag === tag ? 'border-purple-500/40 bg-purple-500/10 text-purple-300' : 'border-[#2a2a35] text-zinc-500'}`}
                >
                  #{tag}
                </button>
              ))}
            </div>

            {!loaded ? (
              <div className="py-20 text-center text-sm text-zinc-600">Loading…</div>
            ) : displayPosts.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[#2a2a30] bg-[#101014] p-10 text-center">
                <p className="text-sm text-zinc-500">No builds tagged with #{activeTag} yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {displayPosts.map((post) => {
                  const resolved = resolvedImageMap[post.heroImage] || post.heroImage
                  return (
                    <Link
                      key={post.id}
                      href={`/community/${post.slug}`}
                      className="group overflow-hidden rounded-[20px] border border-[#23232a] bg-[#101014] transition-colors hover:border-purple-500/30"
                    >
                      <div className="relative w-full overflow-hidden bg-[#0a0a0e]" style={{ aspectRatio: '4/3' }}>
                        {resolved ? (
                          <img
                            src={resolved}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
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
                        <p className="mt-0.5 text-xs text-zinc-500">{post.vehicleLabel} · {timeAgo(post.publishedAt ?? post.updatedAt)}</p>
                        {post.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {post.tags.slice(0, 3).map((t) => (
                              <span key={t} className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300">#{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
