'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchPublishedBuilds, CommunityPostWithVehicle } from '@/lib/community'
import { getBuildOfWeek, getBuildOfWeekHistory, selectBuildOfWeek, BuildOfWeek, formatWeekDisplay } from '@/lib/build-of-week'
import { getPostAuthorHandle } from '@/lib/profiles'

export default function BuildOfWeekAdmin() {
  const [posts, setPosts] = useState<CommunityPostWithVehicle[]>([])
  const [current, setCurrent] = useState<BuildOfWeek | null>(null)
  const [history, setHistory] = useState<BuildOfWeek[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<CommunityPostWithVehicle | null>(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPublishedBuilds().then((fetched) => {
      setPosts(fetched)
      setCurrent(getBuildOfWeek())
      setHistory(getBuildOfWeekHistory().slice(0, 5))
      setLoading(false)
    })
  }, [])

  function handleSelect(post: CommunityPostWithVehicle) {
    setSelectedPost(post)
    setReason('')
  }

  function handleConfirm() {
    if (!selectedPost || !reason.trim()) return
    setSaving(true)
    
    const botw = selectBuildOfWeek(selectedPost, reason.trim(), 'admin')
    setCurrent(botw)
    setHistory(prev => [botw, ...prev].slice(0, 5))
    setSelectedPost(null)
    setReason('')
    setSaving(false)
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

        {/* Select New BOTW */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Select New Build of the Week</h2>
          
          {selectedPost ? (
            <div className="bg-[#111116] rounded-2xl border border-[#1e1e24] p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-[#1e1e24] flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">{selectedPost.title}</h3>
                  <p className="text-zinc-500 text-sm">{getPostAuthorHandle(selectedPost)} • {selectedPost.vehicleLabel}</p>
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
