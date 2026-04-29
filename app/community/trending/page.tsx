'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import PostCard from '@/components/PostCard'
import StoriesBar from '@/components/StoriesBar'
import PullToRefresh from '@/components/PullToRefresh'
import NotificationsCenter from '@/components/NotificationsCenter'
import { calculateTrendingScore, getActiveStories, type Story } from '@/lib/engagement'

// Inline icons (avoiding lucide-react dependency)
const FlameIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
const ClockIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6l4 2" /></svg>
const TrendingUpIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
const AwardIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="8" r="7" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" /></svg>

const timeRanges = [
  { id: '24h', label: '24 Hours', icon: ClockIcon },
  { id: '7d', label: '7 Days', icon: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
  { id: '30d', label: '30 Days', icon: TrendingUpIcon },
  { id: 'all', label: 'All Time', icon: AwardIcon },
]

interface Post {
  id: string
  title: string
  heroImage: string
  tags: string[]
  vehicle: {
    year: string
    make: string
    model: string
    name?: string
    avatar_url?: string
  }
  publishedAt: string
  author_id?: string
}

interface PostStats {
  likes: number
  comments: number
  shares: number
  views: number
}



function TrendingBadge({ rank }: { rank: number }) {
  const colors = [
    'from-yellow-400 via-orange-500 to-red-500', // #1
    'from-gray-300 via-gray-400 to-gray-500',    // #2
    'from-orange-400 via-orange-500 to-orange-600', // #3
    'from-purple-500 to-purple-600', // others
  ]
  const color = colors[Math.min(rank - 1, 3)]
  
  return (
    <div className={`
      absolute -top-2 -left-2 z-10 w-8 h-8 rounded-full 
      bg-gradient-to-br ${color}
      flex items-center justify-center
      shadow-lg shadow-purple-500/20
      border-2 border-[#16161a]
    `}>
      <span className="text-white font-bold text-sm">#{rank}</span>
    </div>
  )
}

export default function TrendingPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [postStats, setPostStats] = useState<Record<string, PostStats>>({})
  const [stories, setStories] = useState<Story[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set())
  const [userSaves, setUserSaves] = useState<Set<string>>(new Set())
  const [timeRange, setTimeRange] = useState('24h')
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [page, setPage] = useState(1)
  const POSTS_PER_PAGE = 10

  // Load user session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null)
    })
  }, [])

  // Load posts with infinite scroll
  const loadPosts = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : page
    const from = (currentPage - 1) * POSTS_PER_PAGE
    const to = from + POSTS_PER_PAGE - 1

    // Calculate time range
    let timeFilter = ''
    if (timeRange === '24h') {
      timeFilter = `created_at.gt.${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`
    } else if (timeRange === '7d') {
      timeFilter = `created_at.gt.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`
    } else if (timeRange === '30d') {
      timeFilter = `created_at.gt.${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`
    }

    let query = supabase
      .from('community_posts')
      .select('*, author:author_id (username, avatar_url)')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (timeFilter) {
      query = query.or(timeFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading posts:', error)
      return
    }

    const newPosts = data?.map(p => ({
      id: p.id,
      title: p.title,
      heroImage: p.hero_image,
      tags: p.tags || [],
      vehicle: {
        year: p.year,
        make: p.make,
        model: p.model,
        name: p.author?.username || 'Unknown',
        avatar_url: p.author?.avatar_url
      },
      publishedAt: p.created_at,
      author_id: p.author_id
    })) || []

    if (reset) {
      setPosts(newPosts)
      setPage(1)
    } else {
      setPosts(prev => [...prev, ...newPosts])
    }
    
    setHasMore(newPosts.length === POSTS_PER_PAGE)
    setLoading(false)

    // Load stats for new posts
    if (newPosts.length > 0) {
      const { data: statsData } = await supabase
        .rpc('get_posts_stats', { post_ids: newPosts.map(p => p.id) })
      
      if (statsData) {
        const stats: Record<string, PostStats> = {}
        statsData.forEach((s: any) => {
          stats[s.post_id] = {
            likes: Number(s.likes) || 0,
            comments: Number(s.comments) || 0,
            shares: Number(s.shares) || 0,
            views: Number(s.views) || 0
          }
        })
        setPostStats(prev => ({ ...prev, ...stats }))
      }
    }
  }, [page, timeRange])

  // Initial load
  useEffect(() => {
    loadPosts(true)
    
    // Load stories
    getActiveStories().then(setStories)
    
    // Load user's likes/saves if logged in
    if (userId) {
      supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .then(({ data }) => {
          setUserLikes(new Set(data?.map(l => l.post_id) || []))
        })
      
      supabase
        .from('saves')
        .select('post_id')
        .eq('user_id', userId)
        .then(({ data }) => {
          setUserSaves(new Set(data?.map(s => s.post_id) || []))
        })
    }
  }, [userId, timeRange])

  // Sort by trending score
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const aStats = postStats[a.id] || { likes: 0, comments: 0, shares: 0, views: 0 }
      const bStats = postStats[b.id] || { likes: 0, comments: 0, shares: 0, views: 0 }
      
      const hoursSinceA = (Date.now() - new Date(a.publishedAt).getTime()) / (1000 * 60 * 60)
      const hoursSinceB = (Date.now() - new Date(b.publishedAt).getTime()) / (1000 * 60 * 60)
      
      const scoreA = calculateTrendingScore(aStats.likes, aStats.comments, aStats.shares, aStats.views, hoursSinceA)
      const scoreB = calculateTrendingScore(bStats.likes, bStats.comments, bStats.shares, bStats.views, hoursSinceB)
      
      return scoreB.score - scoreA.score
    })
  }, [posts, postStats])

  // Infinite scroll observer
  const lastPostRef = useCallback((node: HTMLDivElement) => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(p => p + 1)
      }
    })
    
    if (node) observerRef.current.observe(node)
  }, [loading, hasMore])

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      loadPosts()
    }
  }, [page, loadPosts])

  const handleRefresh = async () => {
    setLoading(true)
    await loadPosts(true)
    const newStories = await getActiveStories()
    setStories(newStories)
  }

  const handleLike = async (postId: string) => {
    if (!userId) return
    
    const isLiked = userLikes.has(postId)
    
    // Optimistic update
    setUserLikes(prev => {
      const next = new Set(prev)
      if (isLiked) next.delete(postId)
      else next.add(postId)
      return next
    })
    
    setPostStats(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        likes: (prev[postId]?.likes || 0) + (isLiked ? -1 : 1)
      }
    }))
    
    // Database update
    if (isLiked) {
      await supabase.from('likes').delete().eq('user_id', userId).eq('post_id', postId)
    } else {
      await supabase.from('likes').insert({ user_id: userId, post_id: postId })
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-[#1e1e24]">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
              </div>
              <div>
                <h1 className="font-bold text-white text-lg">Trending</h1>
                <p className="text-xs text-zinc-500">Hottest builds right now</p>
              </div>
            </div>
            
            {userId && <NotificationsCenter userId={userId} />}
          </div>

          {/* Time range tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
            {timeRanges.map(range => {
              const Icon = range.icon
              return (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                    ${timeRange === range.id 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-[#1a1a20] text-zinc-400 hover:text-white hover:bg-[#252530]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {range.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Stories */}
      <div className="max-w-2xl mx-auto">
        <StoriesBar
          stories={stories}
          currentUserId={userId || undefined}
          onViewStory={(story) => console.log('View story:', story)}
          onCreateStory={() => console.log('Create story')}
        />
      </div>

      {/* Posts feed */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
          {sortedPosts.map((post, index) => (
            <div 
              key={post.id} 
              ref={index === sortedPosts.length - 1 ? lastPostRef : undefined}
              className="relative"
            >
              <TrendingBadge rank={index + 1} />
              <PostCard
                id={post.id}
                title={post.title}
                subtitle={`${post.vehicle.year} ${post.vehicle.make} ${post.vehicle.model}`}
                image={post.heroImage}
                tags={post.tags}
                author={post.vehicle.name || 'Unknown'}
                authorHandle={post.vehicle.name || 'unknown'}
                authorAvatar={post.vehicle.avatar_url}
                likeCount={postStats[post.id]?.likes || 0}
                isLiked={userLikes.has(post.id)}
                likers={[]} // TODO: Load likers
                commentCount={postStats[post.id]?.comments || 0}
                shareCount={postStats[post.id]?.shares || 0}
                createdAt={post.publishedAt}
                onLike={() => handleLike(post.id)}
                onSave={() => {}}
                onShare={() => {}}
                onOpenComments={() => {}}
                isSaved={userSaves.has(post.id)}
                viewCount={postStats[post.id]?.views}
              />
            </div>
          ))}

          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full" />
            </div>
          )}

          {!hasMore && sortedPosts.length > 0 && (
            <div className="text-center py-8 text-zinc-500">
              <p>You've reached the end! 🏁</p>
              <p className="text-sm mt-1">Check back later for more trending builds</p>
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  )
}


