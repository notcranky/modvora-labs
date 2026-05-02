// Social features - with localStorage fallback for offline/limited access
// Primary: Supabase for cross-device sync
// Fallback: localStorage for immediate UX when DB unavailable

import { supabase, supabaseEnabled } from './supabase'

// localStorage keys
const LIKES_KEY = 'modvora_likes_v2'
const LIKE_COUNTS_KEY = 'modvora_like_counts_v2'

// Helper to check if Supabase is available and working
let supabaseWorking = true
let lastSupabaseError: string | null = null

function checkSupabase(): boolean {
  if (!supabaseEnabled) {
    supabaseWorking = false
    return false
  }
  // If we've had recent errors, be cautious
  if (!supabaseWorking && lastSupabaseError) {
    const timeSinceError = Date.now() - (parseInt(localStorage.getItem('modvora_supabase_error_time') || '0'))
    // Retry after 5 minutes
    if (timeSinceError < 5 * 60 * 1000) {
      return false
    }
    supabaseWorking = true
  }
  return supabaseWorking
}

function markSupabaseFailed(error: string) {
  supabaseWorking = false
  lastSupabaseError = error
  localStorage.setItem('modvora_supabase_error_time', Date.now().toString())
  console.warn('Supabase failed, using localStorage fallback:', error)
}

// localStorage helpers
function safeRead<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function safeWrite(key: string, value: any) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Failed to write to localStorage:', e)
  }
}

// ===== LIKES WITH LOCALSTORAGE FALLBACK =====

// Get likes - tries Supabase first, falls back to localStorage
export async function getUserLikes(userId: string): Promise<Set<string>> {
  if (!checkSupabase()) {
    // Use localStorage fallback
    const localLikes = safeRead<Record<string, boolean>>(LIKES_KEY, {})
    return new Set(Object.entries(localLikes).filter(([_, liked]) => liked).map(([id, _]) => id))
  }
  
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId)
    
    if (error) {
      // Check if it's a permissions error (RLS not set up)
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        markSupabaseFailed('RLS policies not configured - using localStorage')
        const localLikes = safeRead<Record<string, boolean>>(LIKES_KEY, {})
        return new Set(Object.entries(localLikes).filter(([_, liked]) => liked).map(([id, _]) => id))
      }
      throw error
    }
    
    // Merge with localStorage (in case user had offline likes)
    const dbLikes = new Set(data?.map(l => l.post_id) || [])
    const localLikes = safeRead<Record<string, boolean>>(LIKES_KEY, {})
    
    // If we have local likes not in DB, try to sync them
    const unsynced = Object.entries(localLikes)
      .filter(([id, liked]) => liked && !dbLikes.has(id))
      .map(([id]) => id)
    
    return dbLikes
  } catch (err: any) {
    console.error('Error fetching likes:', err)
    markSupabaseFailed(err.message)
    
    // Fallback to localStorage
    const localLikes = safeRead<Record<string, boolean>>(LIKES_KEY, {})
    return new Set(Object.entries(localLikes).filter(([_, liked]) => liked).map(([id, _]) => id))
  }
}

// Toggle like - works with localStorage when Supabase unavailable
export async function toggleLike(userId: string, postId: string): Promise<boolean | null> {
  const localLikes = safeRead<Record<string, boolean>>(LIKES_KEY, {})
  const currentlyLiked = !!localLikes[postId]
  
  // Always update localStorage first (instant response)
  localLikes[postId] = !currentlyLiked
  safeWrite(LIKES_KEY, localLikes)
  
  // Update counts in localStorage
  const counts = safeRead<Record<string, number>>(LIKE_COUNTS_KEY, {})
  counts[postId] = (counts[postId] || 0) + (currentlyLiked ? -1 : 1)
  safeWrite(LIKE_COUNTS_KEY, counts)
  
  // Try Supabase if available
  if (!checkSupabase()) {
    console.log('Using localStorage only (Supabase unavailable)')
    return !currentlyLiked
  }
  
  try {
    // Check if already liked in DB
    const { data: existing, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle()
    
    if (checkError) {
      // If it's a permissions error, just use localStorage
      if (checkError.code === '42501') {
        markSupabaseFailed('RLS blocking reads')
        return !currentlyLiked
      }
      throw checkError
    }
    
    if (existing && currentlyLiked) {
      // Unlike in DB
      const { error } = await supabase.from('likes').delete().eq('id', existing.id)
      if (error) {
        if (error.code === '42501') {
          markSupabaseFailed('RLS blocking delete')
          return !currentlyLiked // localStorage already updated
        }
        throw error
      }
      return false
    } else if (!existing && !currentlyLiked) {
      // Like in DB
      const { error } = await supabase.from('likes').insert({ user_id: userId, post_id: postId })
      if (error) {
        if (error.code === '42505' || error.code === '42501' || error.message?.includes('security')) {
          markSupabaseFailed('RLS blocking insert')
          return !currentlyLiked // localStorage already updated
        }
        throw error
      }
      return true
    }
    
    return !currentlyLiked
  } catch (err: any) {
    console.error('Supabase like error:', err)
    markSupabaseFailed(err.message)
    // localStorage already updated, so return that state
    return !currentlyLiked
  }
}

export async function getLikeCounts(postIds: string[]): Promise<Record<string, number>> {
  if (!checkSupabase()) {
    // Use localStorage fallback
    return safeRead<Record<string, number>>(LIKE_COUNTS_KEY, {})
  }
  
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('post_id')
      .in('post_id', postIds)
    
    if (error) {
      // If RLS error, use localStorage
      if (error.code === '42501') {
        markSupabaseFailed('RLS blocking counts')
        return safeRead<Record<string, number>>(LIKE_COUNTS_KEY, {})
      }
      throw error
    }
    
    const counts: Record<string, number> = {}
    for (const like of data || []) {
      counts[like.post_id] = (counts[like.post_id] || 0) + 1
    }
    
    // Merge with localStorage counts (for offline likes)
    const localCounts = safeRead<Record<string, number>>(LIKE_COUNTS_KEY, {})
    postIds.forEach(id => {
      if (localCounts[id] && !counts[id]) {
        counts[id] = localCounts[id]
      }
    })
    
    return counts
  } catch (err: any) {
    console.error('Error fetching like counts:', err)
    markSupabaseFailed(err.message)
    return safeRead<Record<string, number>>(LIKE_COUNTS_KEY, {})
  }
}

// ===== SAVES =====

export async function getUserSaves(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('saves')
    .select('post_id')
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error fetching saves:', error)
    return new Set()
  }
  
  return new Set(data?.map(s => s.post_id) || [])
}

export async function toggleSave(userId: string, postId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('saves')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single()
  
  if (existing) {
    const { error } = await supabase
      .from('saves')
      .delete()
      .eq('id', existing.id)
    
    return !error
  } else {
    const { error } = await supabase
      .from('saves')
      .insert({ user_id: userId, post_id: postId })
    
    return !error
  }
}

// ===== COMMENTS =====

export interface CommentWithReplies {
  id: string
  author: string
  text: string
  created_at: string
  user_id: string
  replies?: CommentWithReplies[]
}

export async function getComments(postId: string): Promise<CommentWithReplies[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  
  if (error || !data) {
    console.error('Error fetching comments:', error)
    return []
  }
  
  // Organize into parent comments and replies
  const parents: CommentWithReplies[] = []
  const replies: CommentWithReplies[] = []
  
  for (const comment of data) {
    if (comment.parent_id) {
      replies.push(comment)
    } else {
      parents.push({ ...comment, replies: [] })
    }
  }
  
  // Attach replies to parents
  for (const reply of replies) {
    const parent = parents.find(p => p.id === reply.parent_id)
    if (parent) {
      parent.replies = parent.replies || []
      parent.replies.push(reply)
    }
  }
  
  return parents
}

export async function addComment(
  userId: string, 
  postId: string, 
  text: string, 
  author: string,
  parentId?: string
): Promise<CommentWithReplies | null> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ 
      user_id: userId, 
      post_id: postId, 
      text, 
      author,
      parent_id: parentId || null 
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error adding comment:', error)
    return null
  }
  
  return data
}

export async function getAllComments(postIds: string[]): Promise<Record<string, CommentWithReplies[]>> {
  const result: Record<string, CommentWithReplies[]> = {}
  
  for (const postId of postIds) {
    result[postId] = await getComments(postId)
  }
  
  return result
}

// ===== COMMENT LIKES =====

export async function getUserCommentLikes(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .eq('user_id', userId)
  
  if (error) {
    return new Set()
  }
  
  return new Set(data?.map(l => l.comment_id) || [])
}

export async function toggleCommentLike(userId: string, commentId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('comment_likes')
    .select('id')
    .eq('user_id', userId)
    .eq('comment_id', commentId)
    .single()
  
  if (existing) {
    await supabase.from('comment_likes').delete().eq('id', existing.id)
    return false
  } else {
    await supabase.from('comment_likes').insert({ user_id: userId, comment_id: commentId })
    return true
  }
}

export async function getCommentLikeCounts(commentIds: string[]): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('comment_likes')
    .select('comment_id')
    .in('comment_id', commentIds)
  
  if (error) return {}
  
  const counts: Record<string, number> = {}
  for (const like of data || []) {
    counts[like.comment_id] = (counts[like.comment_id] || 0) + 1
  }
  
  return counts
}

// ===== SHARES =====

export async function trackShare(postId: string, userId?: string, platform: string = 'copy_link'): Promise<boolean> {
  const { error } = await supabase
    .from('shares')
    .insert({
      post_id: postId,
      user_id: userId || null,
      platform
    })
  
  if (error) {
    console.error('Error tracking share:', error)
    return false
  }
  return true
}

export async function getShareCounts(postIds: string[]): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('shares')
    .select('post_id')
    .in('post_id', postIds)
  
  if (error) {
    console.error('Error fetching share counts:', error)
    return {}
  }
  
  const counts: Record<string, number> = {}
  for (const share of data || []) {
    counts[share.post_id] = (counts[share.post_id] || 0) + 1
  }
  
  return counts
}

// ===== POST STATS (Combined) =====

export interface PostStats {
  likes: number
  comments: number
  shares: number
}

export async function getPostStats(postId: string): Promise<PostStats> {
  const [likes, comments, shares] = await Promise.all([
    supabase.from('likes').select('id', { count: 'exact' }).eq('post_id', postId),
    supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', postId),
    supabase.from('shares').select('id', { count: 'exact' }).eq('post_id', postId)
  ])
  
  return {
    likes: likes.count || 0,
    comments: comments.count || 0,
    shares: shares.count || 0
  }
}

export async function getAllPostStats(postIds: string[]): Promise<Record<string, PostStats>> {
  const { data, error } = await supabase
    .rpc('get_posts_stats', { post_ids: postIds })
  
  if (error || !data) {
    console.error('Error fetching post stats:', error)
    return {}
  }
  
  const stats: Record<string, PostStats> = {}
  for (const row of data) {
    stats[row.post_id] = {
      likes: Number(row.likes) || 0,
      comments: Number(row.comments) || 0,
      shares: Number(row.shares) || 0
    }
  }
  
  return stats
}

// ===== REALTIME SUBSCRIPTIONS =====

export function subscribeToLikes(postId: string, callback: (count: number) => void) {
  return supabase
    .channel(`likes:${postId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'likes',
      filter: `post_id=eq.${postId}`
    }, async () => {
      const { count } = await supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('post_id', postId)
      callback(count || 0)
    })
    .subscribe()
}

export function subscribeToComments(postId: string, callback: (comments: CommentWithReplies[]) => void) {
  return supabase
    .channel(`comments:${postId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'comments',
      filter: `post_id=eq.${postId}`
    }, async () => {
      const comments = await getComments(postId)
      callback(comments)
    })
    .subscribe()
}

// Subscribe to ALL likes changes (for community feed)
export function subscribeToAllLikes(callback: (postId: string, count: number) => void) {
  return supabase
    .channel('likes:all')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'likes'
    }, async (payload) => {
      const postId = payload.new?.post_id || payload.old?.post_id
      if (postId) {
        const { count } = await supabase
          .from('likes')
          .select('id', { count: 'exact' })
          .eq('post_id', postId)
        callback(postId, count || 0)
      }
    })
    .subscribe()
}

// Subscribe to ALL comments changes (for community feed)
export function subscribeToAllComments(callback: (postId: string, comments: CommentWithReplies[]) => void) {
  return supabase
    .channel('comments:all')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'comments'
    }, async (payload) => {
      const postId = payload.new?.post_id || payload.old?.post_id
      if (postId) {
        const comments = await getComments(postId)
        callback(postId, comments)
      }
    })
    .subscribe()
}
