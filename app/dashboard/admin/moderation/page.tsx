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

export default function ModerationAdmin() {
  const router = useRouter()
  const [queue, setQueue] = useState<ModerationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'video' | 'flagged'>('all')
  const [showMobilePanel, setShowMobilePanel] = useState(false)

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
      router.push('/signin?from=/dashboard/admin/moderation')
      return
    }

    // Check if admin or moderator
    const { data: profile } = await supabase
      .from('profiles')
      .select('verified, verified_type, username')
      .eq('id', session.user.id)
      .single()

    if (!profile?.verified || !['admin', 'moderator'].includes(profile.verified_type)) {
      router.push('/dashboard')
      return
    }

    setUser({ ...session.user, ...profile })
  }

  async function loadQueue() {
    setLoading(true)
    const data = await getModerationQueue()
    
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
      setQueue(queue.filter(item => item.id !== itemId))
      setSelectedItem(null)
    }
    
    setActionLoading(null)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-zinc-500">Checking admin access...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111116] border border-[#1e1e24] rounded-xl p-4">
          <div className="text-3xl font-bold text-white">{queue.length}</div>
          <div className="text-sm text-zinc-500">Pending Reviews</div>
        </div>
        <div className="bg-[#111116] border border-[#1e1e24] rounded-xl p-4">
          <div className="text-3xl font-bold text-white">
            {queue.filter(i => i.media_type === 'video').length}
          </div>
          <div className="text-sm text-zinc-500">Videos</div>
        </div>
        <div className="bg-[#111116] border border-[#1e1e24] rounded-xl p-4">
          <div className="text-3xl font-bold text-white">
            {queue.filter(i => i.ai_score > 0.5).length}
          </div>
          <div className="text-sm text-zinc-500">AI Flagged</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
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
        
        {/* Mobile queue toggle */}
        <button
          onClick={() => setShowMobilePanel(true)}
          className="lg:hidden ml-auto flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-400"
        >
          <span>📝</span>
          <span className="font-medium">{queue.length}</span>
        </button>
      </div>

      {/* Mobile Slide-out Panel */}
      {showMobilePanel && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMobilePanel(false)}
          />
          <div className="w-4/5 max-w-sm bg-[#0a0a0b] border-l border-[#1e1e24] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#1e1e24]">
              <div>
                <h2 className="font-bold text-white">Moderation Queue</h2>
                <p className="text-sm text-zinc-500">{queue.length} pending</p>
              </div>
              <button 
                onClick={() => setShowMobilePanel(false)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {queue.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item)
                    setShowMobilePanel(false)
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedItem?.id === item.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-[#1e1e24] bg-[#111116]'
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
                        ⚠️ FLAGGED
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                    {item.post_title || 'Untitled'}
                  </h4>
                  <p className="text-xs text-zinc-500">
                    @{item.author_handle || 'unknown'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full" />
        </div>
      ) : queue.length === 0 ? (
        <div className="text-center py-20 bg-[#111116] border border-[#1e1e24] rounded-2xl">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
          <p className="text-zinc-500">No pending moderation items.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue List - Desktop */}
          <div className="hidden lg:block lg:col-span-1 space-y-3 max-h-[70vh] overflow-y-auto">
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
              <div className="flex items-center justify-center h-full min-h-[400px] bg-[#111116] border border-[#1e1e24] rounded-2xl text-zinc-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="mb-2">Select an item to review</p>
                  <p className="text-sm text-zinc-600 lg:hidden">
                    Tap the 📝 button above to open the queue
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
