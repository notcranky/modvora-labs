'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getModerationQueue, moderateContentAction } from '@/lib/moderation'

interface ModerationItem {
  id: string
  post_id: string
  flagged_by: string
  reason: string
  ai_score: number
  ai_categories: string[]
  status: string
  created_at: string
  post_title: string
  post_description: string
  author_id: string
  media_type: string
  video_url: string
  hero_image: string
  author_username: string
  author_handle: string
}

export default function ModeratorDashboard() {
  const router = useRouter()
  const [queue, setQueue] = useState<ModerationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'video' | 'flagged'>('all')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadQueue()
    }
  }, [user, filter])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      router.push('/partner')
      return
    }

    // Check if moderator or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('verified, verified_type, username')
      .eq('id', session.user.id)
      .single()

    if (!profile?.verified || !['admin', 'moderator'].includes(profile.verified_type)) {
      await supabase.auth.signOut()
      router.push('/partner')
      return
    }

    setUser({ ...session.user, ...profile })
  }

  async function loadQueue() {
    setLoading(true)
    const data = await getModerationQueue()
    
    // Apply filters
    let filtered = data
    if (filter === 'video') {
      filtered = data.filter((item: ModerationItem) => item.media_type === 'video')
    } else if (filter === 'flagged') {
      filtered = data.filter((item: ModerationItem) => item.flagged_by === 'ai' && item.ai_score > 0.5)
    }
    
    setQueue(filtered)
    setLoading(false)
  }

  async function handleAction(itemId: string, action: 'approve' | 'reject') {
    if (!user) return
    
    setActionLoading(itemId)
    const success = await moderateContentAction(itemId, action, user.id)
    
    if (success) {
      // Remove from queue locally
      setQueue(queue.filter(item => item.id !== itemId))
      setSelectedItem(null)
    }
    
    setActionLoading(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/partner')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-zinc-500">Checking access...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a0b]/95 backdrop-blur-md border-b border-[#1e1e24]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center text-xl">
              🛡️
            </div>
            <div>
              <h1 className="font-bold text-white">Moderator Dashboard</h1>
              <p className="text-xs text-zinc-500">
                {user.verified_type === 'admin' ? 'Admin Access' : 'Partner Moderator'} • {user.username}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-bold text-white">{queue.length}</div>
              <div className="text-xs text-zinc-500">Pending Reviews</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg border border-[#1e1e24] text-zinc-400 hover:text-white hover:border-purple-500/40 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-[#1e1e24]/50">
        <div className="flex gap-2">
          {(['all', 'video', 'flagged'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#111116] text-zinc-400 hover:text-white border border-[#1e1e24]'
              }`}
            >
              {f === 'all' && 'All Pending'}
              {f === 'video' && '🎥 Videos'}
              {f === 'flagged' && '⚠️ Flagged'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full" />
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
            <p className="text-zinc-500">No pending moderation items.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Queue List */}
            <div className="lg:col-span-1 space-y-3">
              {queue.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedItem?.id === item.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-[#1e1e24] bg-[#111116] hover:border-[#2a2a35]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.media_type === 'video' 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {item.media_type === 'video' ? 'VIDEO' : 'IMAGE'}
                    </span>
                    {item.ai_score > 0.5 && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                        FLAGGED
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-white truncate mb-1">
                    {item.post_title || 'Untitled Post'}
                  </h4>
                  <p className="text-xs text-zinc-500">
                    By @{item.author_handle || 'unknown'} • {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>

            {/* Detail View */}
            <div className="lg:col-span-2">
              {selectedItem ? (
                <div className="bg-[#111116] rounded-2xl border border-[#1e1e24] overflow-hidden">
                  {/* Preview */}
                  <div className="aspect-video bg-black flex items-center justify-center">
                    {selectedItem.media_type === 'video' && selectedItem.video_url ? (
                      <video
                        src={selectedItem.video_url}
                        controls
                        className="w-full h-full"
                      />
                    ) : selectedItem.hero_image ? (
                      <img
                        src={selectedItem.hero_image}
                        alt={selectedItem.post_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-zinc-600">No preview available</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {selectedItem.post_title || 'Untitled Post'}
                      </h3>
                      <p className="text-zinc-400 text-sm">
                        {selectedItem.post_description || 'No description'}
                      </p>
                    </div>

                    {/* AI Flags */}
                    {selectedItem.ai_score > 0 && (
                      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-yellow-400">⚠️</span>
                          <span className="font-medium text-yellow-400">AI Flags</span>
                        </div>
                        <div className="text-sm text-zinc-400">
                          <p>Score: {(selectedItem.ai_score * 100).toFixed(1)}%</p>
                          <p>Reason: {selectedItem.reason}</p>
                          {selectedItem.ai_categories?.length > 0 && (
                            <p>Categories: {selectedItem.ai_categories.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Author Info */}
                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-white font-semibold">
                        {(selectedItem.author_username || 'U').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white">@{selectedItem.author_handle || 'unknown'}</p>
                        <p>Posted {new Date(selectedItem.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleAction(selectedItem.id, 'approve')}
                        disabled={actionLoading === selectedItem.id}
                        className="flex-1 py-3 rounded-xl bg-green-600 font-semibold text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === selectedItem.id ? 'Processing...' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(selectedItem.id, 'reject')}
                        disabled={actionLoading === selectedItem.id}
                        className="flex-1 py-3 rounded-xl bg-red-600 font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === selectedItem.id ? 'Processing...' : '✕ Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[400px] text-zinc-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">👆</div>
                    <p>Select an item from the queue to review</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
