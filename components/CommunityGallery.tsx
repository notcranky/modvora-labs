'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { fetchPublishedBuilds, CommunityPostWithVehicle, loadCommunityPosts } from '@/lib/community'
import { getPostAuthorUsername, getPostAuthorHandle, isFollowing, getFollowedUsernames, toHandle } from '@/lib/profiles'
import { getBuildOfWeek, BuildOfWeek, formatWeekDisplay } from '@/lib/build-of-week'
import { supabase } from '@/lib/supabase'
import { 
  getUserLikes, 
  getLikeCounts as getDbLikeCounts,
  toggleLike as toggleDbLike,
  getUserSaves,
  toggleSave as toggleDbSave,
  getComments as getDbComments,
  addComment as addDbComment,
  getUserCommentLikes,
  toggleCommentLike as toggleDbCommentLike,
  getCommentLikeCounts,
  getShareCounts,
  trackShare,
  getAllPostStats,
  PostStats,
  subscribeToAllLikes,
  subscribeToAllComments
} from '@/lib/social-db'
import { getVerifiedUsers, getVerifiedStatusByHandle, isOwnerHandle, ProfileWithVerification, getVerificationStatus } from '@/lib/verification'
import NotificationBell from '@/components/NotificationBell'
import HPBadge, { getStoredHP } from '@/components/HPBadge'
import { notifyComment, notifyLike, notifyCommentLike, notifyCommentReply } from '@/lib/notifications'
import { useResolvedImageMap } from '@/lib/local-images'
import { loadVehicles } from '@/lib/garage'
import { motion, AnimatePresence } from 'framer-motion'
import { PostCardSkeleton, FeedSkeleton } from '@/components/ui/Skeleton'
import OfflineIndicator from '@/components/OfflineIndicator'
import { StreakBadge, LevelBadge } from '@/components/GamificationBadge'
import { getConnectionQuality } from '@/lib/offline'

// ── Types ────────────────────────────────────────────────────────────────────

interface Reply {
  id: string
  author: string
  text: string
  createdAt: string
}

interface Comment {
  id: string
  author: string
  text: string
  createdAt: string
  replies?: Reply[]
}

// ── Fallback localStorage for anonymous users ─────────────────────────────────

const LIKES_KEY = 'modvora_likes'
const SAVES_KEY = 'modvora_saves'
const LIKE_COUNTS_KEY = 'modvora_like_counts'
const COMMENTS_KEY = 'modvora_comments'
const COMMENTER_NAME_KEY = 'modvora_commenter_name'
const COMMENT_LIKES_KEY = 'modvora_comment_likes'
const DEVICE_ID_KEY = 'modvora_device_id'

// Get or create a stable anonymous device ID for this browser
function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server'
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY)
    if (existing) return existing
    // Store as plain UUID — no prefix so it passes Supabase uuid column validation
    const id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

// Convert any string (email, device id) into a valid UUID v5-style string.
// This lets us use emails as user IDs without the DB rejecting them.
async function toUserId(input: string): Promise<string> {
  // If it's already a UUID format, use it as-is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)) {
    return input
  }
  try {
    const encoded = new TextEncoder().encode(input)
    const hashBuf = await crypto.subtle.digest('SHA-256', encoded)
    const hex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
    // Format as UUID v4 shape
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-${((parseInt(hex.slice(16,18), 16) & 0x3f) | 0x80).toString(16)}${hex.slice(18,20)}-${hex.slice(20,32)}`
  } catch {
    return crypto.randomUUID()
  }
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function safeWrite(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Icons ────────────────────────────────────────────────────────────────────

function VerifiedBadge({ 
  className = '', 
  type = 'purple'
}: { 
  className?: string
  type?: 'purple' | 'gold' | null
}) {
  // Unified badge: purple for verified (paid OR 1K followers), gold for admin
  const color = type === 'gold' ? '#f59e0b' : '#a855f7' // gold for admin, purple for verified
  const tooltip = type === 'gold' ? 'Modvora Admin' : 'Verified Builder'
  
  if (!type) return null
  
  return (
    <span className={`inline-flex items-center justify-center ${className}`} title={tooltip}>
      <svg viewBox="0 0 20 20" className="w-full h-full" fill={color}>
        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    </span>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  return <svg viewBox="0 0 24 24" className={`h-6 w-6 ${filled ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-current'}`} strokeWidth={1.8}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
}
function CommentIcon() {
  return <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth={1.8}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
}
function BookmarkIcon({ filled }: { filled: boolean }) {
  return <svg viewBox="0 0 24 24" className={`h-6 w-6 ${filled ? 'fill-purple-400 stroke-purple-400' : 'fill-none stroke-current'}`} strokeWidth={1.8}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
}
function ShareIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={1.8}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
}
function SmallHeart({ filled }: { filled: boolean }) {
  return <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${filled ? 'fill-red-400 stroke-red-400' : 'fill-none stroke-current'}`} strokeWidth={2}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
}

// ── CommentsSheet ─────────────────────────────────────────────────────────

interface CommentsSheetProps {
  post: CommunityPostWithVehicle
  comments: Comment[]
  defaultAuthor: string
  commentLikedIds: Set<string>
  commentLikeCounts: Record<string, number>
  onAddComment: (text: string, author: string) => void
  onAuthorChange: (name: string) => void
  onLikeComment: (commentId: string, commentAuthor: string, commentText: string) => void
  onReplyToComment: (parentId: string, text: string, author: string, parentAuthor: string) => void
  onClose: () => void
}

function CommentsSheet(props: CommentsSheetProps) {
  const { post, comments, defaultAuthor, commentLikedIds, commentLikeCounts, onAddComment, onAuthorChange, onLikeComment, onReplyToComment, onClose } = props
  const [commentText, setCommentText] = useState('')
  const [commentAuthor, setCommentAuthor] = useState(defaultAuthor || '')
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => { if (defaultAuthor && !commentAuthor) setCommentAuthor(defaultAuthor) }, [defaultAuthor])
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])

  const totalCount = comments.reduce((sum: number, c: Comment) => sum + 1 + (c.replies?.length ?? 0), 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    const author = commentAuthor.trim() || 'anon'
    onAuthorChange(author)
    setCommentAuthor(author)
    onAddComment(commentText.trim(), author)
    setCommentText('')
  }

  function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim() || !replyingTo) return
    const author = commentAuthor.trim() || 'anon'
    onAuthorChange(author)
    onReplyToComment(replyingTo.id, replyText.trim(), author, replyingTo.author)
    setReplyText('')
    setReplyingTo(null)
  }

  const panelContent = (
    <div className="flex h-full flex-col">
      <div className="relative flex items-center justify-between border-b border-[#1e1e25] px-5 py-4">
        <p className="text-sm font-semibold text-white">Comments{totalCount > 0 && <span className="ml-1.5 text-zinc-500 font-normal">({totalCount})</span>}</p>
        <button onClick={onClose} className="rounded-full p-1.5 text-zinc-500 hover:text-white"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2}><path d="M18 6 6 18M6 6l12 12" /></svg></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {comments.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-zinc-500"><div className="mb-3 text-4xl">💬</div><p className="text-sm">No comments yet.<br />Be the first!</p></div>
        ) : (
          <div className="space-y-4">
            {comments.map((c: Comment) => (
              <div key={c.id} className="group">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1e1e28] text-xs font-bold text-zinc-300">{c.author.slice(0, 1).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2"><span className="text-sm font-semibold text-white">{c.author}</span><span className="text-xs text-zinc-600">{timeAgo(c.createdAt)}</span></div>
                      <button onClick={() => onLikeComment(c.id, c.author, c.text)} className={`flex items-center gap-1 text-xs ${commentLikedIds.has(c.id) ? 'text-red-400' : 'text-zinc-600'}`}><SmallHeart filled={commentLikedIds.has(c.id)} />{(commentLikeCounts[c.id] ?? 0) > 0 && <span>{commentLikeCounts[c.id]}</span>}</button>
                    </div>
                    <p className="mt-0.5 text-sm leading-snug text-zinc-300">{c.text}</p>
                    <div className="mt-1 flex items-center gap-3"><button onClick={() => { setReplyingTo({ id: c.id, author: c.author }); setTimeout(() => document.getElementById('reply-input')?.focus(), 50) }} className="text-xs font-medium text-zinc-500 hover:text-white">Reply</button></div>
                    {c.replies && c.replies.length > 0 && (
                      <div className="mt-3 space-y-3 border-l-2 border-[#2a2a35] pl-3">
                        {c.replies.map((r: Reply) => (
                          <div key={r.id} className="flex gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e1e28] text-[10px] font-bold text-zinc-300">{r.author.slice(0, 1).toUpperCase()}</div>
                            <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><span className="text-sm font-semibold text-white">{r.author}</span><span className="text-xs text-zinc-600">{timeAgo(r.createdAt)}</span></div><p className="text-sm text-zinc-300">{r.text}</p></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-[#1e1e25] px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-900 text-[10px] font-bold text-white">{commentAuthor ? commentAuthor.slice(0, 1).toUpperCase() : '?'}</div>
          <input type="text" placeholder="Your name" value={commentAuthor} onChange={(e) => { setCommentAuthor(e.target.value); onAuthorChange(e.target.value) }} className="h-8 w-28 rounded-md border border-[#2a2a35] bg-[#18181f] px-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-zinc-500" />
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} className="flex-1 rounded-xl border border-[#2a2a35] bg-[#18181f] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none" />
          <button type="submit" disabled={!commentText.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white disabled:opacity-40"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9" /></svg></button>
        </div>
      </form>
      <AnimatePresence>
        {replyingTo && (
          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} onSubmit={handleReplySubmit} className="border-t border-[#2a2a35] bg-[#0f0f14] px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-xs"><span className="text-zinc-400">Replying to <span className="text-white font-medium">@{replyingTo.author}</span></span><button type="button" onClick={() => setReplyingTo(null)} className="text-zinc-500 hover:text-white">Cancel</button></div>
            <div className="flex items-center gap-2">
              <input id="reply-input" type="text" placeholder={`Reply to ${replyingTo.author}...`} value={replyText} onChange={(e) => setReplyText(e.target.value)} className="flex-1 rounded-xl border border-[#2a2a35] bg-[#18181f] px-4 py-2 text-sm text-white placeholder-zinc-600 outline-none" />
              <button type="submit" disabled={!replyText.trim()} className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white disabled:opacity-40"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9" /></svg></button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/70 md:hidden" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 h-[85vh] rounded-t-3xl border-t border-[#2a2a35] bg-[#111116] md:hidden">{panelContent}</motion.div>
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed bottom-0 right-0 top-0 z-50 hidden w-[420px] border-l border-[#2a2a35] bg-[#111116] md:block">{panelContent}</motion.div>
    </>
  )
}

// ── PostCard ─────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: CommunityPostWithVehicle
  resolvedImage: string
  liked: boolean
  saved: boolean
  likeCount: number
  commentCount: number
  shareCount: number
  comments: Comment[]
  tagCounts: Record<string, number>
  defaultAuthor: string
  isOwner: boolean
  isVerified?: boolean
  badgeColor?: 'purple' | 'gold' | null
  commentLikedIds: Set<string>
  commentLikeCounts: Record<string, number>
  onLike: () => void
  onSave: () => void
  onShare: () => void
  onAddComment: (text: string, author: string) => void
  onAuthorChange: (name: string) => void
  onLikeComment: (commentId: string, commentAuthor: string, commentText: string) => void
  onReplyToComment: (parentId: string, text: string, author: string, parentAuthor: string) => void
}

function PostCard(props: PostCardProps) {
  const { post, resolvedImage, liked, saved, likeCount, commentCount, shareCount, comments, defaultAuthor, isOwner, isVerified, badgeColor, commentLikedIds, commentLikeCounts, onLike, onSave, onShare, onAddComment, onAuthorChange, onLikeComment, onReplyToComment } = props
  const [showComments, setShowComments] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showHeart, setShowHeart] = useState(false)
  const [heartPos, setHeartPos] = useState({ x: 0, y: 0 })
  const lastTapRef = useRef(0)
  const imageRef = useRef<HTMLDivElement>(null)

  function handleShare() {
    navigator.clipboard.writeText(`${window.location.origin}/community/${post.slug}`).then(() => {
      setCopied(true)
      onShare() // Track the share
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleImageClick(e: React.MouseEvent | React.TouchEvent) {
    const now = Date.now()
    const timeDiff = now - lastTapRef.current
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    if (timeDiff < 300) {
      const rect = imageRef.current?.getBoundingClientRect()
      if (rect) { setHeartPos({ x: clientX - rect.left, y: clientY - rect.top }); setShowHeart(true); if (!liked) onLike(); setTimeout(() => setShowHeart(false), 1000) }
    }
    lastTapRef.current = now
  }

  const authorName = post.vehicle.name || post.vehicleLabel
  const initials = authorName.slice(0, 2).toUpperCase()
  const totalCommentCount = comments.reduce((sum: number, c: Comment) => sum + 1 + (c.replies?.length ?? 0), 0)

  return (
    <>
      <article className="bg-[#111116] rounded-2xl border border-[#1e1e24] overflow-hidden hover:border-[#2a2a35] transition-colors">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e24]/50">
          <Link href={`/community/profile/${getPostAuthorUsername(post)}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-900 text-xs font-semibold text-white hover:opacity-80">{initials}</Link>
          <div className="min-w-0 flex-1">
            <Link href={`/community/profile/${getPostAuthorUsername(post)}`} className="flex items-center gap-1.5 text-sm font-semibold text-white hover:text-purple-400 transition-colors truncate">
              {getPostAuthorHandle(post)}
              {isVerified && <VerifiedBadge className="w-4 h-4 flex-shrink-0" type={badgeColor} />}
            </Link>
            <p className="text-xs text-zinc-600 truncate">{post.vehicleLabel}</p>
          </div>
          <span className="text-xs text-zinc-600 flex-shrink-0">{timeAgo(post.publishedAt ?? post.updatedAt)}</span>
        </div>
        <div ref={imageRef} className="relative w-full bg-[#0a0a0e] cursor-pointer select-none overflow-hidden group" style={{ aspectRatio: '1/1' }} onClick={handleImageClick}>
          {resolvedImage ? (
            <>
              <img src={resolvedImage} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" draggable={false} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Link href={`/community/${post.slug}`} className="bg-white/90 text-black text-sm font-semibold px-4 py-2 rounded-full transform translate-y-2 group-hover:translate-y-0 transition-transform" onClick={(e) => e.stopPropagation()}>View Build</Link>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-700"><svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg></div>
          )}
          <AnimatePresence>
            {showHeart && (
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ left: heartPos.x - 50, top: heartPos.y - 50 }} className="absolute z-20 pointer-events-none">
                <svg viewBox="0 0 24 24" className="h-24 w-24 fill-red-500 stroke-red-500 drop-shadow-lg" strokeWidth={0}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e1e24]/50">
          <div className="flex items-center gap-1">
            <button onClick={onLike} className={`flex items-center gap-1.5 rounded-full px-2.5 py-2 transition-colors ${liked ? 'text-red-500' : 'text-zinc-400 hover:text-white'}`}>
              <HeartIcon filled={liked} />
              <span className="text-sm font-semibold">{likeCount}</span>
            </button>
            <button onClick={() => setShowComments(true)} className={`flex items-center gap-1.5 rounded-full px-2.5 py-2 transition-colors ${commentCount > 0 ? 'text-zinc-300 hover:text-white' : 'text-zinc-400 hover:text-white'}`}>
              <CommentIcon />
              {commentCount > 0 && <span className="text-sm font-semibold">{commentCount}</span>}
            </button>
            <button onClick={handleShare} className={`flex items-center gap-1.5 rounded-full px-2.5 py-2 transition-colors ${copied ? 'text-green-400' : 'text-zinc-400 hover:text-white'}`}>{copied ? <span className="text-xs">Copied!</span> : <ShareIcon />}</button>
          </div>
          <button onClick={onSave} className={`rounded-full p-2 transition-colors ${saved ? 'text-purple-400' : 'text-zinc-400 hover:text-white'}`}><BookmarkIcon filled={saved} /></button>
        </div>
        {post.progressPercent > 0 && (
          <div className="px-4 pt-2.5 pb-1">
            <div className="flex items-center justify-between text-[11px] text-zinc-600 mb-1">
              <span>Build progress</span>
              <span className={post.progressPercent === 100 ? 'text-green-500' : 'text-zinc-500'}>{post.progressPercent}%{post.progressPercent === 100 ? ' ✓' : ''}</span>
            </div>
            <div className="h-1 bg-[#1e1e24] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${post.progressPercent === 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                style={{ width: `${post.progressPercent}%` }}
              />
            </div>
          </div>
        )}
        <div className="px-4 pb-4 space-y-2">
          {/* Stats row */}
          {(likeCount > 0 || commentCount > 0 || shareCount > 0) && (
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              {likeCount > 0 && <span><span className="font-semibold text-white">{likeCount.toLocaleString()}</span> {likeCount === 1 ? 'like' : 'likes'}</span>}
              {commentCount > 0 && (
                <button onClick={() => setShowComments(true)} className="hover:text-zinc-300 transition-colors">
                  <span className="font-semibold text-white">{commentCount.toLocaleString()}</span> {commentCount === 1 ? 'comment' : 'comments'}
                </button>
              )}
              {shareCount > 0 && <span><span className="font-semibold text-white">{shareCount.toLocaleString()}</span> {shareCount === 1 ? 'share' : 'shares'}</span>}
            </div>
          )}
          
          <div>
            <p className="text-sm leading-snug">
              <Link href={`/community/profile/${getPostAuthorUsername(post)}`} className="font-semibold text-white hover:underline">{getPostAuthorHandle(post)}</Link>{' '}<span className="font-medium text-white">{post.title}</span>
              {post.description && <span className="text-zinc-400 line-clamp-2"> {post.description}</span>}
            </p>
          </div>
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 4).map((t: string) => <span key={t} className="text-xs text-blue-400 hover:underline cursor-pointer">#{t}</span>)}
              {post.tags.length > 4 && <span className="text-xs text-zinc-500">+{post.tags.length - 4}</span>}
            </div>
          )}
          {commentCount > 0 && !showComments && (
            <button onClick={() => setShowComments(true)} className="text-left text-sm text-zinc-500 hover:text-zinc-300">
              View all {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      </article>
      <AnimatePresence>
        {showComments && <CommentsSheet post={post} comments={comments} defaultAuthor={defaultAuthor} commentLikedIds={commentLikedIds} commentLikeCounts={commentLikeCounts} onAddComment={onAddComment} onAuthorChange={onAuthorChange} onLikeComment={onLikeComment} onReplyToComment={onReplyToComment} onClose={() => setShowComments(false)} />}
      </AnimatePresence>
    </>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="col-span-full">
      <div className="rounded-[28px] border border-dashed border-[#2a2a30] bg-[#101014] p-12 text-center max-w-lg mx-auto">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-2xl">🏁</div>
        <h3 className="mt-5 text-2xl font-semibold text-white">No community builds yet</h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">Publish one of your saved garage builds to kick off the feed.</p>
        <div className="mt-6"><Link href="/dashboard" className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-500">Go to Garage</Link></div>
      </div>
    </div>
  )
}

// ── BuildOfWeekBanner ─────────────────────────────────────────────────────────

interface BuildOfWeekBannerProps {
  posts: CommunityPostWithVehicle[]
  resolvedImageMap: Record<string, string>
  likeCounts: Record<string, number>
  comments: Record<string, Comment[]>
}

function BuildOfWeekBanner({ posts, resolvedImageMap, likeCounts, comments }: BuildOfWeekBannerProps) {
  const [current, setCurrent] = useState<BuildOfWeek | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setCurrent(getBuildOfWeek())
    setLoading(false)
  }, [])

  if (loading) return (
    <div className="space-y-4">
      <div className="animate-pulse h-48 bg-[#1e1e24] rounded-2xl" />
      <div className="flex gap-4">
        <div className="animate-pulse h-4 w-20 bg-[#2a2a30] rounded" />
        <div className="animate-pulse h-4 w-24 bg-[#2a2a30] rounded" />
        <div className="animate-pulse h-4 w-16 bg-[#2a2a30] rounded" />
      </div>
    </div>
  )
  if (!current) return null

  const post = posts.find(p => p.id === current.buildId)
  if (!post) return null

  const resolvedImage = resolvedImageMap[post.heroImage] || post.heroImage
  const initials = post.vehicle.name?.slice(0, 2).toUpperCase() || '??'
  
  // Calculate LIVE stats (not the saved ones)
  const liveLikes = likeCounts[current.buildId] ?? 0
  const postComments = comments[current.buildId] ?? []
  const liveComments = postComments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0)
  const liveViews = Math.max(liveLikes * 12, 100)

  return (
    <div className="bg-gradient-to-br from-purple-900/20 via-amber-900/10 to-[#111116] rounded-2xl border border-purple-500/30 p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">👑</span>
        <h2 className="text-lg font-semibold text-white">Build of the Week</h2>
        <span className="ml-auto text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full">
          {formatWeekDisplay(current.weekId)}
        </span>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Image */}
        <Link href={`/community/${current.slug}`} className="w-full md:w-48 h-48 rounded-xl bg-[#1e1e24] overflow-hidden flex-shrink-0 group">
          {resolvedImage ? (
            <img 
              src={resolvedImage} 
              alt={current.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}
        </Link>
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-900 text-xs font-semibold text-white">
              {initials}
            </div>
            <span className="text-sm text-zinc-400">by {getPostAuthorHandle(post)}</span>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">{current.title}</h3>
          <p className="text-amber-400/80 text-sm italic mb-4">"{current.reason}"</p>
          
          <div className="flex items-center gap-6 text-sm">
            <span className="text-red-400">❤️ {liveLikes.toLocaleString()} likes</span>
            <span className="text-blue-400">💬 {liveComments} comments</span>
            <span className="text-green-400">👁️ {liveViews.toLocaleString()} views</span>
          </div>
          
          <Link 
            href={`/community/${current.slug}`}
            className="inline-block mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors"
          >
            View Build
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── FollowingFeed ─────────────────────────────────────────────────────────────

interface FollowingFeedProps {
  posts: CommunityPostWithVehicle[]
  likes: Record<string, boolean>
  saves: Record<string, boolean>
  likeCounts: Record<string, number>
  commentCounts: Record<string, number>
  shareCounts: Record<string, number>
  comments: Record<string, Comment[]>
  tagCounts: Record<string, number>
  commenterName: string
  ownedVehicleIds: Set<string>
  ownedPostIds: Set<string>
  commentLikedIds: Set<string>
  commentLikeCounts: Record<string, number>
  resolvedImageMap: Record<string, string>
  verifiedUsers: Set<string>
  loading: boolean
  onLike: (postId: string) => void
  onSave: (postId: string) => void
  onShare: (postId: string) => void
  onAddComment: (postId: string, text: string, author: string) => void
  onNameChange: (name: string) => void
  onLikeComment: (postId: string, commentId: string, commentAuthor: string, commentText: string) => void
  onReplyToComment: (postId: string, parentId: string, text: string, author: string, parentAuthor: string) => void
}

function FollowingFeed(props: FollowingFeedProps) {
  const { posts, likes, saves, likeCounts, commentCounts, shareCounts, comments, tagCounts, commenterName, ownedVehicleIds, ownedPostIds, commentLikedIds, commentLikeCounts, resolvedImageMap, verifiedUsers, loading, onLike, onSave, onShare, onAddComment, onNameChange, onLikeComment, onReplyToComment } = props
  const followedPosts = useMemo(() => {
    const followed = getFollowedUsernames()
    return posts.filter(p => followed.has(getPostAuthorUsername(p)))
  }, [posts])

  if (loading) {
    return <FeedSkeleton count={3} />
  }

  if (followedPosts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">👥</div>
        <h3 className="text-xl font-semibold text-white mb-2">Not following anyone yet</h3>
        <p className="text-zinc-500 mb-6">Follow builders to see their posts here</p>
        <Link href="/community/me" className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-500">Find Builders</Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {followedPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          resolvedImage={resolvedImageMap[post.heroImage] || post.heroImage}
          liked={!!likes[post.id]}
          saved={!!saves[post.id]}
          likeCount={likeCounts[post.id] ?? 0}
          commentCount={commentCounts[post.id] ?? 0}
          shareCount={shareCounts[post.id] ?? 0}
          comments={comments[post.id] ?? []}
          tagCounts={tagCounts}
          defaultAuthor={commenterName}
          isOwner={ownedVehicleIds.has(post.vehicleId) || ownedPostIds.has(post.id) || post.isLocal}
          commentLikedIds={commentLikedIds}
          commentLikeCounts={commentLikeCounts}
          onLike={() => onLike(post.id)}
          onSave={() => onSave(post.id)}
          onShare={() => onShare(post.id)}
          onAddComment={(text, author) => onAddComment(post.id, text, author)}
          onAuthorChange={onNameChange}
          onLikeComment={(commentId, commentAuthor, commentText) => onLikeComment(post.id, commentId, commentAuthor, commentText)}
          onReplyToComment={(parentId, text, author, parentAuthor) => onReplyToComment(post.id, parentId, text, author, parentAuthor)}
        />
      ))}
    </div>
  )
}

// ── CommunityGallery ──────────────────────────────────────────────────────────

export default function CommunityGallery() {
  const [posts, setPosts] = useState<CommunityPostWithVehicle[]>([])
  const [likes, setLikes] = useState<Record<string, boolean>>({})
  const [saves, setSaves] = useState<Record<string, boolean>>({})
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [shareCounts, setShareCounts] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [commenterName, setCommenterName] = useState('')
  const [commentLikedIds, setCommentLikedIds] = useState<Set<string>>(new Set())
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({})
  const [ownedVehicleIds, setOwnedVehicleIds] = useState<Set<string>>(new Set())
  const [ownedPostIds, setOwnedPostIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'liked'>('newest')
  const [filterTag, setFilterTag] = useState('')
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState<'feed' | 'rankings' | 'following'>('feed')
  const [verifiedUsers, setVerifiedUsers] = useState<Set<string>>(new Set())
  const [verifiedProfiles, setVerifiedProfiles] = useState<Map<string, ProfileWithVerification>>(new Map())
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null)
  // userUUID is the hashed UUID version of supabaseUserId — used for ALL Supabase queries
  // so inserts and lookups always use the exact same value
  const [userUUID, setUserUUID] = useState<string | null>(null)

  // Check auth on mount — uses your site's own session cookie, not Supabase auth
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me')
        const { user } = await res.json()
        if (user?.email) {
          setSupabaseUserId(user.email)
          setIsLoggedIn(true)
          // Hash email → UUID once here so every read/write uses the same value
          const uuid = await toUserId(user.email)
          setUserUUID(uuid)
        } else {
          setSupabaseUserId(null)
          setIsLoggedIn(false)
          // Guests get a stable device UUID
          const uuid = await toUserId(getDeviceId())
          setUserUUID(uuid)
        }
      } catch {
        setSupabaseUserId(null)
        setIsLoggedIn(false)
        const uuid = await toUserId(getDeviceId())
        setUserUUID(uuid)
      }
    }
    checkAuth()
  }, [])

  // Load posts and data
  useEffect(() => {
    const loadData = async () => {
      const fetched = await fetchPublishedBuilds()
      setPosts(fetched)
      
      // Load localStorage data as fallback
      setLikes(safeRead(LIKES_KEY, {}))
      setSaves(safeRead(SAVES_KEY, {}))
      // ── FIX: seed like counts from localStorage first so they persist on refresh
      // even when Supabase RPC fails or returns empty
      setLikeCounts(safeRead(LIKE_COUNTS_KEY, {}))
      setCommenterName(safeRead(COMMENTER_NAME_KEY, ''))
      setOwnedVehicleIds(new Set(loadVehicles().map((v) => v.id)))
      setOwnedPostIds(new Set(loadCommunityPosts().map((p) => p.id)))

      // Load all social stats from Supabase (for everyone - counts are public)
      const postIds = fetched.map(p => p.id)
      const allStats = await getAllPostStats(postIds)
      const statsLikeCounts: Record<string, number> = {}
      const statsCommentCounts: Record<string, number> = {}
      const statsShareCounts: Record<string, number> = {}

      for (const [postId, stats] of Object.entries(allStats)) {
        statsLikeCounts[postId] = stats.likes
        statsCommentCounts[postId] = stats.comments
        statsShareCounts[postId] = stats.shares
      }

      // Supabase counts overlay localStorage — localStorage is the floor, DB is truth
      setLikeCounts(prev => ({ ...prev, ...statsLikeCounts }))
      setCommentCounts(prev => ({ ...prev, ...statsCommentCounts }))
      setShareCounts(prev => ({ ...prev, ...statsShareCounts }))
      
      // Load personal likes/saves using the hashed UUID (same ID used on insert)
      const activeUUID = userUUID || await toUserId(getDeviceId())
      const userLikes = await getUserLikes(activeUUID)
      const userSaves = await getUserSaves(activeUUID)

      const likesObj: Record<string, boolean> = {}
      userLikes.forEach(id => { likesObj[id] = true })
      const savesObj: Record<string, boolean> = {}
      userSaves.forEach(id => { savesObj[id] = true })

      // DB wins, but merge with localStorage so nothing is lost
      setLikes(prev => ({ ...prev, ...likesObj }))
      setSaves(prev => ({ ...prev, ...savesObj }))

      // Load comments if logged in
      if (supabaseUserId) {
        const dbComments: Record<string, Comment[]> = {}
        for (const post of fetched) {
          const postComments = await getDbComments(post.id)
          dbComments[post.id] = postComments.map(c => ({
            id: c.id,
            author: c.author,
            text: c.text,
            createdAt: c.created_at,
            replies: c.replies?.map(r => ({
              id: r.id,
              author: r.author,
              text: r.text,
              createdAt: r.created_at
            })) || []
          }))
        }
        const userCommentLikes = await getUserCommentLikes(activeUUID)
        const allCommentIds = Object.values(dbComments).flat().flatMap(c => [c.id, ...(c.replies?.map(r => r.id) || [])])
        const dbCommentLikeCounts = await getCommentLikeCounts(allCommentIds)
        setComments(dbComments)
        setCommentLikedIds(userCommentLikes)
        setCommentLikeCounts(dbCommentLikeCounts)
      }
      
      // Load verified users (works for both logged in and anonymous)
      const verified = await getVerifiedUsers()
      const verifiedSet = new Set<string>()
      const verifiedMap = new Map<string, ProfileWithVerification>()
      verified.forEach(profile => {
        const normalizedHandle = toHandle(profile.handle)
        const normalizedUsername = toHandle(profile.username)
        verifiedSet.add(normalizedHandle)
        verifiedSet.add(normalizedUsername)
        verifiedSet.add(profile.handle)
        verifiedSet.add(profile.username)
        verifiedMap.set(normalizedHandle, profile)
        verifiedMap.set(normalizedUsername, profile)
        verifiedMap.set(profile.handle, profile)
        verifiedMap.set(profile.username, profile)
      })
      
      // Fallback: Direct check for each author if set is empty
      if (verifiedSet.size === 0 && fetched.length > 0) {
        const uniqueAuthors = [...new Set(fetched.map(p => toHandle(p.vehicle.name || 'unknown')))]
        for (const author of uniqueAuthors) {
          const directProfile = await getVerifiedStatusByHandle(author)
          if (directProfile) {
            verifiedSet.add(author)
            verifiedMap.set(author, directProfile)
          }
        }
      }
      
      setVerifiedUsers(verifiedSet)
      setVerifiedProfiles(verifiedMap)
      
      setLoading(false)
    }
    
    // ── FIX: removed `if (posts.length === 0)` guard — that blocked re-runs
    // when supabaseUserId changes (auth resolves), so DB likes never loaded
    loadData()
  }, [supabaseUserId])

  // Realtime subscriptions for likes and comments
  useEffect(() => {
    if (posts.length === 0) return

    // Subscribe to all likes changes
    const likesSubscription = subscribeToAllLikes((postId, count) => {
      setLikeCounts(prev => ({ ...prev, [postId]: count }))
    })

    // Subscribe to all comments changes
    const commentsSubscription = subscribeToAllComments((postId, newComments) => {
      setComments(prev => ({ 
        ...prev, 
        [postId]: newComments.map(c => ({
          id: c.id,
          author: c.author,
          text: c.text,
          createdAt: c.created_at,
          replies: c.replies?.map(r => ({
            id: r.id,
            author: r.author,
            text: r.text,
            createdAt: r.created_at
          })) || []
        }))
      }))
      // Update comment count
      setCommentCounts(prev => ({ ...prev, [postId]: newComments.length }))
    })

    return () => {
      likesSubscription.unsubscribe()
      commentsSubscription.unsubscribe()
    }
  }, [posts.length])

  // Periodic sync - refresh counts every 30 seconds to ensure accuracy
  useEffect(() => {
    if (posts.length === 0) return
    
    const syncInterval = setInterval(async () => {
      // Refresh like counts for all posts
      const postIds = posts.map(p => p.id)
      const freshStats = await getAllPostStats(postIds)
      
      setLikeCounts(prev => {
        const updated = { ...prev }
        let hasChanges = false
        for (const [postId, stats] of Object.entries(freshStats)) {
          if (updated[postId] !== stats.likes) {
            updated[postId] = stats.likes
            hasChanges = true
          }
        }
        return hasChanges ? updated : prev
      })
    }, 30000) // 30 seconds
    
    return () => clearInterval(syncInterval)
  }, [posts])

  // ── Sync DB likes when auth resolves ─────────────────────────────────────
  // Re-runs when supabaseUserId changes so DB likes overlay localStorage after login
  useEffect(() => {
    if (!supabaseUserId) return
    async function syncDbLikes() {
      try {
        const res = await fetch(`/api/community/likes?userId=${encodeURIComponent(supabaseUserId!)}`)
        if (!res.ok) return
        const { likesObj, savesObj } = await res.json() as {
          likesObj: Record<string, boolean>
          savesObj: Record<string, boolean>
        }
        // DB wins but doesn't wipe unsynced localStorage entries
        setLikes(prev => ({ ...prev, ...likesObj }))
        setSaves(prev => ({ ...prev, ...savesObj }))
        // Update persisted storage to reflect merged state
        setLikes(merged => { safeWrite(LIKES_KEY, merged); return merged })
        setSaves(merged => { safeWrite(SAVES_KEY, merged); return merged })
      } catch {
        // Graceful fallback — localStorage data is still intact
      }
    }
    syncDbLikes()
  }, [supabaseUserId])

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const post of posts) for (const tag of post.tags) counts[tag] = (counts[tag] ?? 0) + 1
    return counts
  }, [posts])

  const trendingTags = useMemo(() => Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag]) => tag), [tagCounts])

  const filteredPosts = useMemo(() => {
    let result = [...posts]
    if (filterTag) result = result.filter((p) => p.tags.includes(filterTag))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((p) => p.title.toLowerCase().includes(q) || p.vehicleLabel.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)) || (p.vehicle.name || '').toLowerCase().includes(q))
    }
    if (sortBy === 'liked') {
      // Owner posts get massive boost (100x likes) so they appear at top
      result.sort((a, b) => {
        const aIsOwner = isOwnerHandle(a.vehicle.name || '')
        const bIsOwner = isOwnerHandle(b.vehicle.name || '')
        const aScore = (likeCounts[a.id] ?? 0) * (aIsOwner ? 100 : 1)
        const bScore = (likeCounts[b.id] ?? 0) * (bIsOwner ? 100 : 1)
        return bScore - aScore
      })
    } else {
      // Default sort: owner posts first, then by date
      result.sort((a, b) => {
        const aIsOwner = isOwnerHandle(a.vehicle.name || '')
        const bIsOwner = isOwnerHandle(b.vehicle.name || '')
        if (aIsOwner && !bIsOwner) return -1
        if (!aIsOwner && bIsOwner) return 1
        // Both owner or both not — sort by date (newest first)
        return new Date(b.publishedAt ?? b.updatedAt).getTime() - new Date(a.publishedAt ?? a.updatedAt).getTime()
      })
    }
    return result
  }, [posts, filterTag, search, sortBy, likeCounts])

  const heroImages = useMemo(() => filteredPosts.map((post) => post.heroImage), [filteredPosts])
  const resolvedImageMap = useResolvedImageMap(heroImages)

  async function handleLike(postId: string) {
    const wasLiked = likes[postId]
    
    // IMMEDIATE UI UPDATE - don't wait for DB
    setLikes((prev) => ({ ...prev, [postId]: !wasLiked }))
    setLikeCounts((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + (wasLiked ? -1 : 1) }))
    
    // Also update localStorage immediately for persistence
    safeWrite(LIKES_KEY, { ...likes, [postId]: !wasLiked })
    safeWrite(LIKE_COUNTS_KEY, { ...likeCounts, [postId]: (likeCounts[postId] ?? 0) + (wasLiked ? -1 : 1) })
    
    // Use Supabase user ID if logged in, otherwise use anonymous device ID
    // Use the pre-computed UUID (same one used for all DB reads)
    const userId = userUUID || await toUserId(getDeviceId())

    try {
      if (wasLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('post_id', postId)

        if (error) throw error
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: userId, post_id: postId })

        if (error) {
          if (error.code === '23505') {
            // Already liked (unique constraint) — treat as success
            setLikes((prev) => ({ ...prev, [postId]: true }))
          } else {
            throw error
          }
        }
      }

      // Confirm actual count from DB so everyone sees the same number
      const { count } = await supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('post_id', postId)

      setLikeCounts((prev) => ({ ...prev, [postId]: count || 0 }))
      safeWrite(LIKE_COUNTS_KEY, { ...likeCounts, [postId]: count || 0 })
      
    } catch (err: any) {
      console.error('Like failed:', err)
      
      // Revert UI
      setLikes((prev) => ({ ...prev, [postId]: wasLiked }))
      setLikeCounts((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + (wasLiked ? 1 : -1) }))
      
      // Show error
      alert(`Failed to ${wasLiked ? 'unlike' : 'like'}: ${err.message || 'Unknown error'}`)
    }
    
    if (!wasLiked) {
      // Fallback to localStorage
      safeWrite(LIKES_KEY, { ...likes, [postId]: !wasLiked })
      safeWrite(LIKE_COUNTS_KEY, { ...likeCounts, [postId]: (likeCounts[postId] ?? 0) + (wasLiked ? -1 : 1) })
    }
    
    if (!wasLiked) {
      notifyLike(postId, posts.find(p => p.id === postId)?.title ?? '', ownedPostIds)
    }
  }

  async function handleSave(postId: string) {
    const wasSaved = saves[postId]
    setSaves((prev) => ({ ...prev, [postId]: !wasSaved }))
    
    if (supabaseUserId) {
      await toggleDbSave(supabaseUserId, postId)
    } else {
      safeWrite(SAVES_KEY, { ...saves, [postId]: !wasSaved })
    }
  }

  async function handleShare(postId: string) {
    // Track share in Supabase
    await trackShare(postId, supabaseUserId || undefined)
    
    // Optimistic UI update
    setShareCounts((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }))
  }

  function handleNameChange(name: string) {
    setCommenterName(name)
    safeWrite(COMMENTER_NAME_KEY, name)
  }

  async function handleAddComment(postId: string, text: string, author: string) {
    if (supabaseUserId) {
      const newComment = await addDbComment(supabaseUserId, postId, text, author)
      if (newComment) {
        const comment: Comment = {
          id: newComment.id,
          author: newComment.author,
          text: newComment.text,
          createdAt: newComment.created_at
        }
        setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), comment] }))
      }
    } else {
      const newComment: Comment = { id: `c_${Date.now()}`, author, text, createdAt: new Date().toISOString(), replies: [] }
      const next = { ...comments, [postId]: [...(comments[postId] || []), newComment] }
      safeWrite(COMMENTS_KEY, next)
      setComments(next)
    }
    notifyComment(postId, posts.find(p => p.id === postId)?.title ?? '', author, commenterName, ownedPostIds)
  }

  async function handleLikeComment(postId: string, commentId: string, commentAuthor: string, commentText: string) {
    const wasLiked = commentLikedIds.has(commentId)
    
    setCommentLikedIds((prev) => {
      const next = new Set(prev)
      wasLiked ? next.delete(commentId) : next.add(commentId)
      return next
    })
    setCommentLikeCounts((prev) => ({ ...prev, [commentId]: (prev[commentId] ?? 0) + (wasLiked ? -1 : 1) }))
    
    if (supabaseUserId) {
      await toggleDbCommentLike(supabaseUserId, commentId)
    } else {
      safeWrite(COMMENT_LIKES_KEY, Array.from(commentLikedIds))
    }
    
    if (!wasLiked) {
      notifyCommentLike(postId, posts.find(p => p.id === postId)?.title ?? '', commentText, commentAuthor, commenterName)
    }
  }

  function handleReplyToComment(postId: string, parentId: string, text: string, author: string, parentAuthor: string) {
    const reply: Reply = { id: `r_${Date.now()}`, author, text, createdAt: new Date().toISOString() }
    setComments((prev) => {
      const postComments = (prev[postId] || []).map((c) =>
        c.id === parentId ? { ...c, replies: [...(c.replies || []), reply] } : c
      )
      const next = { ...prev, [postId]: postComments }
      safeWrite(COMMENTS_KEY, next)
      return next
    })
    notifyCommentReply(postId, posts.find(p => p.id === postId)?.title ?? '', author, text, parentAuthor, commenterName)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] px-4 pb-16 pt-24 sm:px-6">
      {/* Header - Clean & Simple */}
      <div className="sticky top-0 z-20 bg-[#0a0a0b]/95 backdrop-blur-md border-b border-[#1e1e24]/50 px-4 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-white">Community Builds</h1>
            <span className="hidden sm:inline text-xs text-zinc-600">•</span>
            <p className="hidden sm:block text-sm text-zinc-500">Real builds from the garage</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            {isLoggedIn ? (
              <Link href="/dashboard/publish" className="flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2}>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="hidden sm:inline">Share Build</span>
              </Link>
            ) : (
              <Link href="/signin" className="rounded-full border border-[#2a2a35] px-4 py-2 text-sm font-medium text-white hover:border-purple-500/40 transition-colors">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 py-2 max-w-7xl mx-auto border-b border-[#1e1e24]/50">
        <div className="flex items-center gap-1">
          {(['feed', 'rankings', 'following'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {tab === 'feed' && '📰 Feed'}
              {tab === 'rankings' && '🏆 Rankings'}
              {tab === 'following' && '👥 Following'}
              {activeTab === tab && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters - Only on Feed */}
      {activeTab === 'feed' && <div className="px-4 py-4 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-zinc-500" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search builds, cars, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#1e1e24] bg-[#18181f] py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSortBy('newest')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${sortBy === 'newest' ? 'bg-white text-black' : 'bg-[#18181f] text-zinc-400 hover:text-white border border-[#2a2a35]'}`}
            >
              Newest
            </button>
            <button
              onClick={() => setSortBy('liked')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${sortBy === 'liked' ? 'bg-white text-black' : 'bg-[#18181f] text-zinc-400 hover:text-white border border-[#2a2a35]'}`}
            >
              Popular
            </button>
            {trendingTags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filterTag === tag ? 'bg-purple-500 text-white' : 'bg-[#18181f] text-zinc-400 hover:text-white border border-[#2a2a35]'}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>}

      {/* Trending tags strip */}
      {activeTab === 'feed' && trendingTags.length > 0 && (
        <div className="px-4 pb-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-1">
            <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider whitespace-nowrap flex-shrink-0">Trending</span>
            <div className="w-px h-4 bg-[#2a2a35] flex-shrink-0" />
            {trendingTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterTag === tag
                    ? 'bg-purple-500 text-white'
                    : 'bg-[#18181f] text-zinc-400 hover:text-white border border-[#2a2a35] hover:border-zinc-600'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="px-4 pb-8 max-w-7xl mx-auto">
        {/* Feed Tab */}
        {activeTab === 'feed' && (
          <div>
            {/* Build of the Week at top of feed */}
            {!loading && posts.length > 0 && (
              <BuildOfWeekBanner posts={posts} resolvedImageMap={resolvedImageMap} likeCounts={likeCounts} comments={comments} />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <FeedSkeleton count={6} />
              ) : filteredPosts.length === 0 && posts.length === 0 ? (
                <EmptyState />
              ) : filteredPosts.length === 0 ? (
                <div className="col-span-full p-10 text-center">
                  <p className="text-sm text-zinc-500">No posts match your search.</p>
                </div>
              ) : (
                filteredPosts.map((post) => {
                  const authorName = post.vehicle.name || 'unknown'
                  const authorKey = toHandle(authorName)
                  const isOwner = isOwnerHandle(authorName) || isOwnerHandle(authorKey)
                  const badgeColor = isOwner ? 'gold' : 'purple'
                  return (
                    <PostCard
                      key={post.id}
                      post={post}
                      resolvedImage={resolvedImageMap[post.heroImage] || post.heroImage}
                      liked={!!likes[post.id]}
                      saved={!!saves[post.id]}
                      likeCount={likeCounts[post.id] ?? 0}
                      commentCount={commentCounts[post.id] ?? 0}
                      shareCount={shareCounts[post.id] ?? 0}
                      comments={comments[post.id] ?? []}
                      tagCounts={tagCounts}
                      defaultAuthor={commenterName}
                      isOwner={ownedVehicleIds.has(post.vehicleId) || ownedPostIds.has(post.id) || post.isLocal}
                      isVerified={true}
                      badgeColor={badgeColor}
                      commentLikedIds={commentLikedIds}
                      commentLikeCounts={commentLikeCounts}
                      onLike={() => handleLike(post.id)}
                      onSave={() => handleSave(post.id)}
                      onShare={() => handleShare(post.id)}
                      onAddComment={(text, author) => handleAddComment(post.id, text, author)}
                      onAuthorChange={handleNameChange}
                      onLikeComment={(commentId, commentAuthor, commentText) => handleLikeComment(post.id, commentId, commentAuthor, commentText)}
                      onReplyToComment={(parentId, text, author, parentAuthor) => handleReplyToComment(post.id, parentId, text, author, parentAuthor)}
                    />
                  )
                })
              )}
              {/* CTA at bottom */}
              {!loading && filteredPosts.length > 0 && (
                <div className="col-span-full mt-2">
                  <div className="rounded-2xl border border-dashed border-[#2a2a35] bg-[#0e0e12] p-8 text-center">
                    <div className="text-3xl mb-3">🔧</div>
                    <h3 className="text-lg font-semibold text-white mb-2">Building something?</h3>
                    <p className="text-sm text-zinc-500 mb-4 max-w-sm mx-auto">Track every mod, expense, and milestone. Free forever.</p>
                    <Link href="/intake" className="inline-block rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition-colors">Start Your Build →</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rankings Tab */}
        {activeTab === 'rankings' && (
          <div>
            <BuildOfWeekBanner posts={posts} resolvedImageMap={resolvedImageMap} likeCounts={likeCounts} comments={comments} />
            
            <div className="text-center py-12 border border-dashed border-[#2a2a35] rounded-2xl">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-white mb-2">More Rankings Coming Soon</h3>
              <p className="text-zinc-500">Build Battles and Leaderboards</p>
            </div>
          </div>
        )}

        {/* Following Tab */}
        {activeTab === 'following' && (
          <FollowingFeed 
            posts={posts}
            likes={likes}
            saves={saves}
            likeCounts={likeCounts}
            commentCounts={commentCounts}
            shareCounts={shareCounts}
            comments={comments}
            tagCounts={tagCounts}
            commenterName={commenterName}
            ownedVehicleIds={ownedVehicleIds}
            ownedPostIds={ownedPostIds}
            commentLikedIds={commentLikedIds}
            commentLikeCounts={commentLikeCounts}
            resolvedImageMap={resolvedImageMap}
            loading={loading}
            onLike={handleLike}
            onSave={handleSave}
            onShare={handleShare}
            onAddComment={handleAddComment}
            onNameChange={handleNameChange}
            onLikeComment={handleLikeComment}
            onReplyToComment={handleReplyToComment}
          />
        )}


      </div>
    </div>
  )
}