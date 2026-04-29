// Advanced engagement features for car social media
// Stories, highlights, reactions, enhanced notifications

import { supabase } from './supabase'

// ===== STORIES / EPHEMERAL CONTENT =====
export interface Story {
  id: string
  userId: string
  userName: string
  userHandle: string
  userAvatar?: string
  imageUrl: string
  caption?: string
  createdAt: string
  expiresAt: string
  viewedBy: string[] // userIds who viewed
}

export async function createStory(
  userId: string,
  imageUrl: string,
  caption?: string
): Promise<Story | null> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours

  const { data, error } = await supabase
    .from('stories')
    .insert({
      user_id: userId,
      image_url: imageUrl,
      caption,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      viewed_by: []
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating story:', error)
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    userName: data.user_name,
    userHandle: data.user_handle,
    userAvatar: data.user_avatar,
    imageUrl: data.image_url,
    caption: data.caption,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    viewedBy: data.viewed_by || []
  }
}

export async function getActiveStories(): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data.map(s => ({
    id: s.id,
    userId: s.user_id,
    userName: s.user_name,
    userHandle: s.user_handle,
    userAvatar: s.user_avatar,
    imageUrl: s.image_url,
    caption: s.caption,
    createdAt: s.created_at,
    expiresAt: s.expires_at,
    viewedBy: s.viewed_by || []
  }))
}

// ===== WHO LIKED (SOCIAL PROOF) =====
export interface LikerInfo {
  userId: string
  userName: string
  userHandle: string
  userAvatar?: string
  isFollowing: boolean
  isVerified: boolean
}

export async function getRecentLikers(postId: string, limit: number = 3): Promise<LikerInfo[]> {
  const { data, error } = await supabase
    .from('likes')
    .select(`
      user_id,
      profiles:user_id (username, handle, avatar_url, verified)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map((like: any) => ({
    userId: like.user_id,
    userName: like.profiles?.username || 'Unknown',
    userHandle: like.profiles?.handle || 'unknown',
    userAvatar: like.profiles?.avatar_url,
    isFollowing: false, // TODO: check following status
    isVerified: like.profiles?.verified || false
  }))
}

export async function getLikeCountText(postId: string): Promise<string> {
  const likers = await getRecentLikers(postId, 2)
  const { count } = await supabase
    .from('likes')
    .select('id', { count: 'exact' })
    .eq('post_id', postId)

  const total = count || 0

  if (total === 0) return ''
  if (total === 1 && likers.length === 1) return `Liked by ${likers[0].userName}`
  if (total === 2 && likers.length === 2) return `Liked by ${likers[0].userName} and ${likers[1].userName}`
  if (likers.length >= 1) return `Liked by ${likers[0].userName} and ${total - 1} others`
  return `${total} likes`
}

// ===== TRENDING ALGORITHM =====
export interface TrendingScore {
  postId: string
  score: number
  breakdown: {
    likesWeight: number
    commentsWeight: number
    sharesWeight: number
    recencyWeight: number
    engagementRate: number
  }
}

export function calculateTrendingScore(
  likes: number,
  comments: number,
  shares: number,
  views: number,
  hoursSincePosted: number
): TrendingScore {
  // Engagement rate (what % of viewers engaged)
  const engagementRate = views > 0 ? (likes + comments + shares) / views : 0

  // Time decay - posts older than 24h get penalty
  const recencyBoost = hoursSincePosted < 24 ? 1 : Math.max(0.1, 1 - (hoursSincePosted - 24) / 72)

  // Weighted scoring
  const likesWeight = likes * 1
  const commentsWeight = comments * 3 // Comments worth more
  const sharesWeight = shares * 5 // Shares worth most
  const recencyWeight = recencyBoost * 10

  const score = likesWeight + commentsWeight + sharesWeight + recencyWeight + (engagementRate * 100)

  return {
    postId: '', // filled by caller
    score,
    breakdown: {
      likesWeight,
      commentsWeight,
      sharesWeight,
      recencyWeight,
      engagementRate
    }
  }
}

// ===== ENHANCED NOTIFICATIONS =====
export type NotificationType = 'like' | 'comment' | 'follow' | 'mention' | 'share' | 'build_complete'

export interface Notification {
  id: string
  type: NotificationType
  actorId: string
  actorName: string
  actorHandle: string
  actorAvatar?: string
  postId?: string
  postTitle?: string
  commentText?: string
  read: boolean
  createdAt: string
}

export async function createNotification(
  recipientId: string,
  type: NotificationType,
  actorId: string,
  postId?: string,
  commentText?: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert({
      recipient_id: recipientId,
      type,
      actor_id: actorId,
      post_id: postId,
      comment_text: commentText,
      read: false
    })

  if (error) {
    console.error('Error creating notification:', error)
  }
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:actor_id (username, handle, avatar_url)
    `)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  return data.map((n: any) => ({
    id: n.id,
    type: n.type,
    actorId: n.actor_id,
    actorName: n.actor?.username || 'Someone',
    actorHandle: n.actor?.handle || 'unknown',
    actorAvatar: n.actor?.avatar_url,
    postId: n.post_id,
    postTitle: n.post_title,
    commentText: n.comment_text,
    read: n.read,
    createdAt: n.created_at
  }))
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('recipient_id', userId)
    .eq('read', false)

  return count || 0
}

// ===== USER MENTIONS =====
export function parseMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1])
  }
  return mentions
}

export async function resolveMentions(handles: string[]): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('profiles')
    .select('handle, id')
    .in('handle', handles)

  const map: Record<string, string> = {}
  data?.forEach((p: any) => {
    map[p.handle] = p.id
  })
  return map
}
