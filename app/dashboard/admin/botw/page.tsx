'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchPublishedBuilds, CommunityPostWithVehicle } from '@/lib/community'
import { getBuildOfWeek, getBuildOfWeekHistory, selectBuildOfWeek, BuildOfWeek, formatWeekDisplay, Nomination, getTopNominees, getNominations, resetNominationsForWeek } from '@/lib/build-of-week'
import { getPostAuthorHandle } from '@/lib/profiles'

const LIKE_COUNTS_KEY = 'modvora_like_counts'
const COMMENTS_KEY = 'modvora_comments'

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

interface PostStats {
  likes: number
  comments: number
  views: number
}

function getPostStats(postId: string): PostStats {
  const likeCounts = safeRead<Record<string, number>>(LIKE_COUNTS_KEY, {})
  const allComments = safeRead<Record<string, unknown[]>>(COMMENTS_KEY, {})
  const postComments = allComments[postId] || []
  
  // Count total comments including replies
  let totalComments = 0
  for (const c of postComments) {
    totalComments++
    if (typeof c === 'object' && c && 'replies' in c && Array.isArray((c as {replies?: unknown[]}).replies)) {
      totalComments += ((c as {replies: unknown[]}).replies).length
    }
  }
  
  // Views are estimated based on engagement (likes * 10-15)
  const likes = likeCounts[postId] ?? 0
  const views = Math.max(likes * 12, 100) // Minimum 100 views
  
  return { likes, comments: totalComments, views }
}

export default function BuildOfWeekAdmin() {
  const [posts, setPosts] = useState<CommunityPostWithVehicle[]>([])
  const [current, setCurrent] = useState<BuildOfWeek | null>(null)
  const [history, setHistory] = useState<BuildOfWeek[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<CommunityPostWithVehicle | null>(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [nominees, setNominees] = useState<Nomination[]>([])
  const [showNominees, setShowNominees] = useState(true)
  const [postStats, setPostStats] = useState<Record<string, PostStats>>({})

  function loadData() {
    fetchPublishedBuilds().then((fetched) => {
      setPosts(fetched)
      setCurrent(getBuildOfWeek())
      setHistory(getBuildOfWeekHistory().slice(0, 5))
      setNominees(getTopNominees(10))
      
      // Load stats for all posts
      const stats: Record<string, PostStats> = {}
      for (const post of fetched) {
        stats[post.id] = getPostStats(post.id)
      }
      setPostStats(stats)
      
      setLoading(false)
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleSelect(post: CommunityPostWithVehicle) {
    setSelectedPost(post)
    setReason('')
  }

  function handleConfirm() {
    if (!selectedPost || !reason.trim()) return
    setSaving(true)
    
    // Get real stats for the selected post
    const stats = postStats[selectedPost.id] || { likes: 0, comments: 0, views: 0 }
    
    const botw = selectBuildOfWeek(selectedPost, reason.trim(), 'admin', stats)
    
    // Reset nominations for next week
    resetNominationsForWeek()
    
    setCurrent(botw)
    setHistory(prev => [botw, ...prev].slice(0, 5))
    setNominees([]) // Clear nominees after selection
    setSelectedPost(null)
    setReason('')
    setSaving(false)
  }

  function handleSelectFromNominee(nominee: Nomination) {
    const post = posts.find(p => p.id === nominee.buildId)
    if (post) {
      setSelectedPost(post)
      setReason(`Top community nominee with ${nominee.count} nominations`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] pt-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-[#1e1e24] rounded" />
            <div className="h-64 bg-[#1e1e24] rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] pt-24 px-6 pb-16">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🏆 Build of the Week</h1>
            <p className="text-zinc-500 mt-1">Select the featured build for this week</p>
          </div>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 rounded-xl bg-[#1e1e24] text-zinc-300 hover:text-white hover:bg-[#2a2a35] transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Current BOTW */}
        {current && (
          <div className="bg-gradient-to-br from-purple-900/20 to-amber-900/20 rounded-2xl border border-purple-500/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">👑</span>
              <h2 className="text-lg font-semibold text-white">Current Build of the Week</h2>
              <span className="ml-auto text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
                Week {current.weekId}
              </span>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 rounded-xl bg-[#1e1e24] flex-shrink-0 overflow-hidden">
                {current.slug && (
                  <img 
                    src={`/community/${current.slug}/hero.jpg`} 
                    alt={current.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{current.title}</h3>
                <p className="text-zinc-400">by {current.author}</p>
                <p className="text-amber-400/80 text-sm mt-2 italic">"{current.reason}"</p>
                <div className="flex gap-4 mt-3 text-xs text-zinc-500">
                  <span>❤️ {current.stats.likes.toLocaleString()}</span>
                  <span>💬 {current.stats.comments}</span>
                  <span>👁️ {current.stats.views.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Nominees */}
        {nominees.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">🏆 Top 10 Nominees</h2>
              <button 
                onClick={() => setShowNominees(!showNominees)}
                className="text-sm text-zinc-500 hover:text-white"
              >
                {showNominees ? 'Hide' : 'Show'}
              </button>
            </div>
            {showNominees && (
              <div className="space-y-2">
                {nominees.map((nominee, i) => (
                  <div 
                    key={nominee.buildId}
                    className="flex items-center gap-4 bg-[#111116] rounded-xl border border-[#1e1e24] p-4 hover:border-[#2a2a35] transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e1e24] text-sm font-bold text-zinc-400">
                      {i + 1}
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-[#1e1e24] flex-shrink-0 overflow-hidden">
                      {nominee.heroImage && (
                        <img 
                          src={nominee.heroImage} 
                          alt={nominee.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{nominee.title}</h3>
                      <p className="text-xs text-zinc-500">{nominee.author}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-amber-400 font-bold">{nominee.count} votes</span>
                      <button
                        onClick={() => handleSelectFromNominee(nominee)}
                        className="px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-400 text-xs font-medium hover:bg-purple-600 hover:text-white transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Select New BOTW */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Select New Build of the Week</h2>
          
          {selectedPost ? (
            <div className="bg-[#111116] rounded-2xl border border-[#1e1e24] p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-[#1e1e24] flex-shrink-0 overflow-hidden">
                  {selectedPost.heroImage && (
                    <img src={selectedPost.heroImage} alt={selectedPost.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{selectedPost.title}</h3>
                  <p className="text-zinc-500 text-sm">{getPostAuthorHandle(selectedPost)} • {selectedPost.vehicleLabel}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-red-400">❤️ {postStats[selectedPost.id]?.likes ?? 0} likes</span>
                    <span className="text-blue-400">💬 {postStats[selectedPost.id]?.comments ?? 0} comments</span>
                    <span className="text-green-400">👁️ {postStats[selectedPost.id]?.views ?? 0} views</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="ml-auto text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div>
                <label className="text-sm text-zinc-400 block mb-2">Why is this build featured?</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., 'Perfect balance of power and reliability' or 'Most creative use of budget parts'"
                  className="w-full bg-[#0a0a0b] border border-[#2a2a35] rounded-xl p-4 text-white placeholder-zinc-600 focus:border-purple-500 outline-none resize-none h-24"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="px-4 py-2 rounded-xl bg-[#1e1e24] text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!reason.trim() || saving}
                  className="px-6 py-2 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : '👑 Set as Build of the Week'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <div 
                  key={post.id}
                  className="bg-[#111116] rounded-xl border border-[#1e1e24] p-4 hover:border-[#2a2a35] transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-lg bg-[#1e1e24] flex-shrink-0 overflow-hidden">
                      {post.heroImage && (
                        <img 
                          src={post.heroImage} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{post.title}</h3>
                      <p className="text-xs text-zinc-500 truncate">{getPostAuthorHandle(post)}</p>
                      <p className="text-xs text-zinc-600 mt-1">{post.vehicleLabel}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-zinc-500">❤️ {postStats[post.id]?.likes ?? 0}</span>
                        <span className="text-zinc-500">💬 {postStats[post.id]?.comments ?? 0}</span>
                        <span className="text-zinc-500">👁️ {postStats[post.id]?.views ?? 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link 
                      href={`/community/${post.slug}`}
                      target="_blank"
                      className="flex-1 text-center py-2 rounded-lg bg-[#1e1e24] text-xs text-zinc-400 hover:text-white transition-colors"
                    >
                      View Build
                    </Link>
                    <button
                      onClick={() => handleSelect(post)}
                      className="flex-1 py-2 rounded-lg bg-purple-600/20 text-purple-400 text-xs font-medium hover:bg-purple-600 hover:text-white transition-colors"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Previous Winners</h2>
            <div className="space-y-2">
              {history.map((botw, i) => (
                <div 
                  key={botw.weekId + i}
                  className="flex items-center gap-4 bg-[#111116] rounded-xl border border-[#1e1e24] p-4"
                >
                  <span className="text-xl">{i === 0 ? '👑' : '🏆'}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{botw.title}</h3>
                    <p className="text-xs text-zinc-500">{botw.author} • {formatWeekDisplay(botw.weekId)}</p>
                  </div>
                  <span className="text-xs text-amber-500/80">+100 XP Awarded</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
// Force redeploy Wed Apr 29 00:39:30 PDT 2026
