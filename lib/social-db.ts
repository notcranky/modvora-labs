// Social features - migrated from localStorage to Supabase
// All data persists across devices and sessions

import { supabase } from './supabase'

// ===== LIKES =====

export async function getUserLikes(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('likes')
    .select('post_id')
    .eq('user_id', userId)
  
  if (error) {
    console.error('Error fetching likes:', error)
    return new Set()
  }
  
  return new Set(data?.map(l => l.post_id) || [])
}

export async function toggleLike(userId: string, postId: string): Promise<boolean> {
  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single()
  
  if (existing) {
    // Unlike
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', existing.id)
    
    if (error) {
      console.error('Error removing like:', error)
      return false
    }
    return false // Now unliked
  } else {
    // Like
    const { error } = await supabase
      .from('likes')
      .insert({ user_id: userId, post_id: postId })
    
    if (error) {
      console.error('Error adding like:', error)
      return false
    }
    return true // Now liked
  }
}

export async function getLikeCounts(postIds: string[]): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('likes')
    .select('post_id')
    .in('post_id', postIds)
  
  if (error) {
    console.error('Error fetching like counts:', error)
    return {}
  }
  
  const counts: Record<string, number> = {}
  for (const like of data || []) {
    counts[like.post_id] = (counts[like.post_id] || 0) + 1
  }
  
  return counts
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
