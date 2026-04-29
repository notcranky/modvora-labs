'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { fetchPublishedBuilds, CommunityPostWithVehicle } from '@/lib/community'
import { getPostAuthorUsername, isFollowing, toggleFollow, getFollowerCount, toHandle } from '@/lib/profiles'
import { useResolvedImageMap } from '@/lib/local-images'
import { getVerifiedUsers, getVerifiedStatusByHandle, ProfileWithVerification, getVerificationStatus } from '@/lib/verification'

function VerifiedBadge({ type = 'free' }: { type?: 'free' | 'paid' | 'admin' }) {
  const color = type === 'admin' ? '#f59e0b' : type === 'paid' ? '#a855f7' : '#3b82f6'
  const tooltip = type === 'admin' ? 'Modvora Admin' : type === 'paid' ? 'Verified Builder (Premium)' : 'Verified Builder (1K+ followers)'
  
  return (
    <span className="inline-flex items-center justify-center w-5 h-5" title={tooltip}>
      <svg viewBox="0 0 20 20" className="w-full h-full" fill={color}>
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    </span>
  )
}

interface UserProfileProps {
  username: string
}

export default function UserProfile({ username }: UserProfileProps) {
  const [allPosts, setAllPosts] = useState<CommunityPostWithVehicle[]>([])
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [loaded, setLoaded] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<{ isVerified: boolean, badgeColor: string, tooltip: string } | null>(null)

  useEffect(() => {
    fetchPublishedBuilds().then(async (posts) => {
      setAllPosts(posts)
      setFollowing(isFollowing(username))
      setFollowerCount(getFollowerCount(username))
      try {
        const stored = localStorage.getItem('modvora_like_counts')
        setLikeCounts(stored ? JSON.parse(stored) : {})
      } catch { /* ignore */ }
      
      // Load verification status
      const verifiedUsers = await getVerifiedUsers()
      console.log('[UserProfile] Loaded verified users:', verifiedUsers.length)
      console.log('[UserProfile] Looking for username:', username, 'handle:', toHandle(username))
      const userProfile = verifiedUsers.find(p => {
        const match = toHandle(p.handle) === toHandle(username) || toHandle(p.username) === toHandle(username)
        console.log(`[UserProfile] Checking: ${p.handle} (${toHandle(p.handle)}) vs ${username} (${toHandle(username)}) = ${match}`)
        return match
      })
      console.log('[UserProfile] Found profile:', userProfile)
      
      // Try direct lookup if not found in list
      if (!userProfile) {
        console.log('[UserProfile] Not found in list, trying direct lookup')
        const directProfile = await getVerifiedStatusByHandle(username)
        console.log('[UserProfile] Direct lookup result:', directProfile)
        if (directProfile) {
          const status = getVerificationStatus(directProfile)
          console.log('[UserProfile] Setting verification status from direct:', status)
          setVerificationStatus(status)
        }
      } else {
        const status = getVerificationStatus(userProfile)
        console.log('[UserProfile] Setting verification status:', status)
        setVerificationStatus(status)
      }
      
      setLoaded(true)
    })
  }, [username])

  const posts = useMemo(
    () => allPosts.filter((post) => getPostAuthorUsername(post) === username),
    [allPosts, username],
  )

  const displayName = posts[0]?.vehicle.name || username

  const heroImages = useMemo(() => posts.map((p) => p.heroImage), [posts])
  const resolvedImageMap = useResolvedImageMap(heroImages)

  const initials = displayName.slice(0, 2).toUpperCase()

  const totalLikes = useMemo(
    () => posts.reduce((sum, p) => sum + (likeCounts[p.id] ?? 0), 0),
    [posts, likeCounts],
  )

  function handleFollowToggle() {
    const next = toggleFollow(username)
    setFollowing(next)
    setFollowerCount(getFollowerCount(username))
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] px-4 pb-16 pt-24 sm:px-6">
      <div className="mx-auto max-w-[680px]">
        {/* Profile header */}
        <div className="mb-8 flex flex-col gap-5">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-900 text-2xl font-bold text-white">
              {initials}
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1 pt-1">
              <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                {displayName}
                {verificationStatus?.isVerified && (
                  <VerifiedBadge type={verificationStatus.badgeColor === 'gold' ? 'admin' : verificationStatus.badgeColor === 'purple' ? 'paid' : 'free'} />
                )}
              </h1>
              <p className="mt-0.5 text-sm text-zinc-500">@{toHandle(displayName)}</p>
              {loaded && (
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  <span><span className="font-semibold text-white">{posts.length}</span> <span className="text-zinc-500">{posts.length === 1 ? 'post' : 'posts'}</span></span>
                  <span><span className="font-semibold text-white">{followerCount.toLocaleString()}</span> <span className="text-zinc-500">followers</span></span>
                  <span><span className="font-semibold text-white">{totalLikes.toLocaleString()}</span> <span className="text-zinc-500">likes</span></span>
                </div>
              )}
              <div className="mt-3">
                {following ? (
                  <button
                    onClick={handleFollowToggle}
                    className="rounded-xl border border-[#2a2a35] bg-[#18181f] px-5 py-2 text-sm text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white"
                  >
                    Following
                  </button>
                ) : (
                  <button
                    onClick={handleFollowToggle}
                    className="rounded-xl bg-purple-600 px-5 py-2 text-sm text-white transition-colors hover:bg-purple-500"
                  >
                    Follow
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Post grid */}
        {!loaded ? (
          <div className="py-20 text-center text-sm text-zinc-600">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#2a2a30] bg-[#101014] p-10 text-center">
            <p className="text-sm text-zinc-500">No published builds yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {posts.map((post) => {
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
    </div>
  )
}
