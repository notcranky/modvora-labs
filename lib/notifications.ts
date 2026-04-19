'use client'

export interface AppNotification {
  id: string
  type: 'comment' | 'like' | 'comment_like' | 'comment_reply'
  postId: string
  postTitle: string
  actorName: string
  createdAt: string
  read: boolean
  context?: string // short snippet for comment_like / comment_reply
}

const NOTIF_KEY = 'modvora_notifications'
const LIKE_COUNTS_KEY = 'modvora_like_counts'
const SEED_LIKE_COUNTS: Record<string, number> = {
  'post-gr86-midnight': 47,
  'post-m2-voltage': 83,
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}

export function loadNotifications(): AppNotification[] {
  return safeRead<AppNotification[]>(NOTIF_KEY, [])
}

function saveNotifications(notifs: AppNotification[]): void {
  try { localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs)) } catch {}
}

export function getUnreadCount(): number {
  return loadNotifications().filter((n) => !n.read).length
}

export function markAllRead(): void {
  const notifs = loadNotifications().map((n) => ({ ...n, read: true }))
  saveNotifications(notifs)
}

export function notifyComment(
  postId: string,
  postTitle: string,
  actorName: string,
  myName: string,
  ownedPostIds: Set<string>,
): boolean {
  if (!ownedPostIds.has(postId)) return false
  if (actorName.trim().toLowerCase() === myName.trim().toLowerCase()) return false
  const notif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'comment',
    postId,
    postTitle,
    actorName,
    createdAt: new Date().toISOString(),
    read: false,
  }
  saveNotifications([notif, ...loadNotifications()])
  return true
}

export function notifyLike(
  postId: string,
  postTitle: string,
  ownedPostIds: Set<string>,
): boolean {
  if (!ownedPostIds.has(postId)) return false
  const counts = safeRead<Record<string, number>>(LIKE_COUNTS_KEY, {})
  const current = counts[postId] ?? SEED_LIKE_COUNTS[postId] ?? 0
  if (current <= 0) return false
  const notif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'like',
    postId,
    postTitle,
    actorName: 'Someone',
    createdAt: new Date().toISOString(),
    read: false,
  }
  const existing = loadNotifications()
  const recent = existing.find(
    (n) => n.type === 'like' && n.postId === postId && Date.now() - new Date(n.createdAt).getTime() < 5000,
  )
  if (recent) return false
  saveNotifications([notif, ...existing])
  return true
}

// Fires when someone likes a comment you authored
export function notifyCommentLike(
  postId: string,
  postTitle: string,
  commentText: string,
  commentAuthor: string,
  myName: string,
): boolean {
  if (!myName || commentAuthor.trim().toLowerCase() !== myName.trim().toLowerCase()) return false
  const notif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'comment_like',
    postId,
    postTitle,
    actorName: 'Someone',
    createdAt: new Date().toISOString(),
    read: false,
    context: commentText.slice(0, 80),
  }
  saveNotifications([notif, ...loadNotifications()])
  return true
}

// Fires when someone replies to a comment you authored
export function notifyCommentReply(
  postId: string,
  postTitle: string,
  actorName: string,
  replyText: string,
  parentAuthor: string,
  myName: string,
): boolean {
  if (!myName || parentAuthor.trim().toLowerCase() !== myName.trim().toLowerCase()) return false
  if (actorName.trim().toLowerCase() === myName.trim().toLowerCase()) return false
  const notif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'comment_reply',
    postId,
    postTitle,
    actorName,
    createdAt: new Date().toISOString(),
    read: false,
    context: replyText.slice(0, 80),
  }
  saveNotifications([notif, ...loadNotifications()])
  return true
}
