'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { fetchPublishedBuilds, CommunityPostWithVehicle, loadCommunityPosts } from '@/lib/community'
import { getPostAuthorUsername, getPostAuthorHandle, isFollowing, toggleFollow, getFollowedUsernames } from '@/lib/profiles'
import NotificationBell from '@/components/NotificationBell'
import HPBadge, { getStoredHP } from '@/components/HPBadge'
import { notifyComment, notifyLike, notifyCommentLike, notifyCommentReply } from '@/lib/notifications'
import { useResolvedImageMap } from '@/lib/local-images'
import { loadVehicles } from '@/lib/garage'
import { motion, AnimatePresence } from 'framer-motion'
import { getBuilderXP, getLevel, getProgressToNextLevel, getLevelColorClasses, BuilderLevel } from '@/lib/builder-levels'
import { getBuildOfWeek, isBuildOfWeek, getBotWBadge, BuildOfWeek } from '@/lib/build-of-week'
import SmartSearchSidebar, { FilterState } from '@/components/SmartSearchSidebar'
import LeaderboardsPanel from '@/components/LeaderboardsPanel'
import BuildBattle from '@/components/BuildBattle'

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

// ── Social storage ────────────────────────────────────────────────────────────

const LIKES_KEY = 'modvora_likes'
const SAVES_KEY = 'modvora_saves'
const LIKE_COUNTS_KEY = 'modvora_like_counts'
const COMMENTS_KEY = 'modvora_comments'
const COMMENTER_NAME_KEY = 'modvora_commenter_name'
const COMMENT_LIKES_KEY = 'modvora_comment_likes'
const COMMENT_LIKE_COUNTS_KEY = 'modvora_comment_like_counts'

const SEED_LIKE_COUNTS: Record<string, number> = {
  'post-gr86-midnight': 47,
  'post-m2-voltage': 83,
}

const SEED_COMMENTS: Record<string, Comment[]> = {
  'post-gr86-midnight': [
    { id: 's1', author: 'stanceworks_', text: 'That stance is perfect 🔥 what coilovers are you running?', createdAt: '2026-03-19T10:00:00Z' },
    { id: 's2', author: 'daily_canyon', text: 'OEM+ done right. This is the standard.', createdAt: '2026-03-20T08:30:00Z' },
  ],
  'post-m2-voltage': [
    { id: 's1', author: 'trackday_j', text: 'S55 is an absolute weapon, respect the build.', createdAt: '2026-03-16T14:00:00Z' },
    { id: 's2', author: 'grip_or_rip', text: 'What wheel setup? Those look so clean', createdAt: '2026-03-17T09:15:00Z' },
    { id: 's3', author: 'bimmerlife', text: "The M2 build I've been waiting to see posted", createdAt: '2026-03-18T16:45:00Z' },
  ],
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

function initLikeCounts(posts: CommunityPostWithVehicle[]): Record<string, number> {
  const stored = safeRead<Record<string, number>>(LIKE_COUNTS_KEY, {})
  const result = { ...stored }
  for (const post of posts) {
    if (!(post.id in result)) result[post.id] = SEED_LIKE_COUNTS[post.id] ?? 0
  }
  return result
}

function initComments(posts: CommunityPostWithVehicle[]): Record<string, Comment[]> {
  const stored = safeRead<Record<string, Comment[]>>(COMMENTS_KEY, {})
  const result = { ...stored }
  for (const post of posts) {
    if (!(post.id in result)) result[post.id] = SEED_COMMENTS[post.id] ?? []
  }
  return result
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

// ── Build Progress Ring ─────────────────────────────────────────────────────

function BuildProgressRing({ progress, size = 36 }: { progress: number; size?: number }) {
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference
  
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#2a2a35" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="url(#gradient)" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease' }} />
        <defs><linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#ec4899" /></linearGradient></defs>
      </svg>
      <span className="absolute text-[10px] font-bold text-white">{Math.round(progress)}%</span>
    </div>
  )
}

// ── Stat Badge ──────────────────────────────────────────────────────────────

function StatBadge({ icon, value, label, color = 'zinc' }: { icon: string; value: string; label: string; color?: 'purple' | 'orange' | 'green' | 'zinc' }) {
  const colors = { purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20', orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20', green: 'bg-green-500/10 text-green-400 border-green-500/20', zinc: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' }
  return (<div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${colors[color]} text-xs`}><span>{icon}</span><span className="font-semibold">{value}</span><span className="opacity-60">{label}</span></div>)
}

// ── Double Tap Heart Animation ───────────────────────────────────────────────

function DoubleTapHeart({ show, x, y }: { show: boolean; x: number; y: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ left: x - 50, top: y - 50 }}
          className="absolute z-20 pointer-events-none"
        >
          <svg viewBox="0 0 24 24" className="h-24 w-24 fill-red-500 stroke-red-500 drop-shadow-lg" strokeWidth={0}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Build of the Week Banner ─────────────────────────────────────────────────

function BuildOfWeekBanner({ posts, resolvedImageMap, likeCounts }: { 
  posts: CommunityPostWithVehicle[]; 
  resolvedImageMap: Record<string, string>;
  likeCounts: Record<string, number>;
}) {
  const current = getBuildOfWeek()
  if (!current) return null
  
  const post = posts.find(p => p.id === current.buildId)
  if (!post) return null
  
  const resolvedImage = resolvedImageMap[post.heroImage] || post.heroImage
  const initials = post.vehicle.name?.slice(0, 2).toUpperCase() || '??'
  const authorHandle = getPostAuthorHandle(post)
  const authorUsername = getPostAuthorUsername(post)
  
  return (
    <div className="max-w-7xl mx-auto px-4 pb-6">
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 rounded-2xl border border-amber-500/30 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-2/5 relative">
            <div className="aspect-video md:aspect-auto md:h-full">
              {resolvedImage ? (
                <img src={resolvedImage} alt={post.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[#0a0a0e] flex items-center justify-center">
                  <span className="text-4xl">🏎️</span>
                </div>
              )}
            </div>
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold">
                👑 Build of the Week
              </span>
            </div>
          </div>
          
          {/* Info */}
          <div className="md:w-3/5 p-5 md:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-xs font-bold text-black">
                  {initials}
                </div>
                <div>
                  <Link href={`/community/profile/${authorUsername}`} className="text-sm font-semibold text-white hover:text-amber-400 transition-colors">
                    {authorHandle}
                  </Link>
                </div>
                <span className="text-xs text-amber-500/80">🏆 +100 XP</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{post.title}</h3>
              <p className="text-zinc-400 text-sm mb-4">{current.reason}</p>
              
              <div className="flex items-center gap-4 text-sm text-zinc-500 mb-4">
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-red-500" strokeWidth={0}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {likeCounts[post.id] ?? current.stats.likes}
                </span>
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {current.stats.comments}
                </span>
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  {current.stats.views.toLocaleString()}
                </span>
              </div>
            </div>
            
            <Link 
              href={`/community/${post.slug}`}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-semibold py-2.5 px-6 rounded-xl transition-all"
            >
              View Build
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-6 w-6 transition-transform active:scale-90 ${filled ? 'fill-red-500 stroke-red-500' : 'fill-none stroke-current'}`} strokeWidth={1.8}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth={1.8}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-6 w-6 transition-transform active:scale-90 ${filled ? 'fill-purple-400 stroke-purple-400' : 'fill-none stroke-current'}`} strokeWidth={1.8}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={1.8}>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

// ── CommentsSheet ─────────────────────────────────────────────────────────────

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

function SmallHeart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition-transform active:scale-90 ${filled ? 'fill-red-400 stroke-red-400' : 'fill-none stroke-current'}`} strokeWidth={2}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

// ── Featured Build Hero ─────────────────────────────────────────────────────

function FeaturedBuild({ post, resolvedImage, likeCount, commentCount }: { post: CommunityPostWithVehicle; resolvedImage: string; likeCount: number; commentCount: number }) {
  const authorName = post.vehicle.name || post.vehicleLabel
  const initials = authorName.slice(0, 2).toUpperCase()
  const buildProgress = post.status === 'completed' ? 100 : Math.floor(Math.random() * 40) + 60
  const horsepower = Math.floor(Math.random() * 200) + 300
  const totalSpent = Math.floor(Math.random() * 15000) + 5000
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-gradient-to-br from-[#18181f] to-[#111116] rounded-3xl border border-[#2a2a35] overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-3/5 relative">
            <div className="aspect-[16/10] lg:aspect-auto lg:h-full">
              {resolvedImage ? (<img src={resolvedImage} alt={post.title} className="h-full w-full object-cover" />) : (<div className="h-full w-full bg-[#0a0a0e] flex items-center justify-center"><span className="text-4xl">🏎️</span></div>)}
            </div>
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/10">⭐ Featured Build</span>
              {post.status === 'completed' && <span className="px-3 py-1.5 rounded-full bg-green-500/80 backdrop-blur-md text-white text-xs font-semibold">Complete</span>}
            </div>
          </div>
          <div className="lg:w-2/5 p-6 lg:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-sm font-bold text-white">{initials}</div>
                <div>
                  <Link href={`/community/profile/${getPostAuthorUsername(post)}`} className="font-semibold text-white hover:text-purple-400 transition-colors">{getPostAuthorHandle(post)}</Link>
                  <p className="text-xs text-zinc-500">{post.vehicleLabel}</p>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{post.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-3">{post.description || 'No description provided for this build yet.'}</p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-[#0a0a0e] rounded-xl p-3 text-center border border-[#2a2a35]"><BuildProgressRing progress={buildProgress} size={40} /><p className="text-xs text-zinc-500 mt-1">Progress</p></div>
                <div className="bg-[#0a0a0e] rounded-xl p-3 text-center border border-[#2a2a35]"><p className="text-xl font-bold text-orange-400">{horsepower}</p><p className="text-xs text-zinc-500">HP</p></div>
                <div className="bg-[#0a0a0e] rounded-xl p-3 text-center border border-[#2a2a35]"><p className="text-xl font-bold text-green-400">${(totalSpent / 1000).toFixed(1)}k</p><p className="text-xs text-zinc-500">Invested</p></div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.slice(0, 4).map(tag => (<span key={tag} className="px-2.5 py-1 rounded-full bg-[#2a2a35] text-zinc-400 text-xs">#{tag}</span>))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href={`/community/${post.slug}`} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl text-center transition-colors">View Build</Link>
              <div className="flex items-center gap-3 text-zinc-500 text-sm">
                <span className="flex items-center gap-1"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-red-500" strokeWidth={0}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>{likeCount}</span>
                <span className="flex items-center gap-1"><svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>{commentCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CommentsSheet({ post, comments, defaultAuthor, commentLikedIds, commentLikeCounts, onAddComment, onAuthorChange, onLikeComment, onReplyToComment, onClose }: CommentsSheetProps) {
  const [commentText, setCommentText] = useState('')
  const [commentAuthor, setCommentAuthor] = useState(defaultAuthor || '')
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null)
  const [replyText, setReplyText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (defaultAuthor && !commentAuthor) setCommentAuthor(defaultAuthor)
  }, [defaultAuthor]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    const author = commentAuthor.trim() || 'anon'
    onAuthorChange(author)
    setCommentAuthor(author)
    onAddComment(commentText.trim(), author)
    setCommentText('')
    inputRef.current?.focus()
  }

  function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim() || !replyingTo) return
    const author = commentAuthor.trim() || 'anon'
    onAuthorChange(author)
    setCommentAuthor(author)
    onReplyToComment(replyingTo.id, replyText.trim(), author, replyingTo.author)
    setReplyText('')
    setReplyingTo(null)
  }

  const panelContent = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-[#1e1e25] px-5 py-4">
        <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-[#2a2a35] md:hidden" />
        <p className="text-sm font-semibold text-white">
          Comments{totalCount > 0 && <span className="ml-1.5 text-zinc-500 font-normal">({totalCount})</span>}
        </p>
        <button onClick={onClose} className="rounded-full p-1.5 text-zinc-500 transition-colors hover:text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth={2}>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {comments.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-600">No comments yet. Be the first!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id}>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1e1e28] text-xs font-bold text-zinc-300">
                  {c.author.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <Link href={`/community/profile/${c.author.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'user'}`} className="font-semibold text-white hover:text-purple-400 transition-colors">{c.author}</Link>
                    {' '}<span className="text-zinc-400">{c.text}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-[11px] text-zinc-600">{timeAgo(c.createdAt)}</span>
                    <button
                      onClick={() => onLikeComment(c.id, c.author, c.text)}
                      className={`flex items-center gap-1 text-xs transition-colors ${commentLikedIds.has(c.id) ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'}`}
                    >
                      <SmallHeart filled={commentLikedIds.has(c.id)} />
                      {(commentLikeCounts[c.id] ?? 0) > 0 && <span>{commentLikeCounts[c.id]}</span>}
                    </button>
                    <button
                      onClick={() => setReplyingTo(replyingTo?.id === c.id ? null : { id: c.id, author: c.author })}
                      className="text-xs text-zinc-500 transition-colors hover:text-white"
                    >
                      Reply
                    </button>
                  </div>

                  {/* Replies */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="mt-3 space-y-3 border-l-2 border-[#2a2a35] pl-3">
                      {c.replies.map((r) => (
                        <div key={r.id} className="flex gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e1e28] text-[10px] font-bold text-zinc-300">
                            {r.author.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <Link href={`/community/profile/${r.author.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'user'}`} className="font-semibold text-white hover:text-purple-400 transition-colors">{r.author}</Link>
                              {' '}<span className="text-zinc-400">{r.text}</span>
                            </p>
                            <div className="mt-1 flex items-center gap-3">
                              <span className="text-[11px] text-zinc-600">{timeAgo(r.createdAt)}</span>
                              <button
                                onClick={() => onLikeComment(r.id, r.author, r.text)}
                                className={`flex items-center gap-1 text-xs transition-colors ${commentLikedIds.has(r.id) ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'}`}
                              >
                                <SmallHeart filled={commentLikedIds.has(r.id)} />
                                {(commentLikeCounts[r.id] ?? 0) > 0 && <span>{commentLikeCounts[r.id]}</span>}
                              </button>
                              <button
                                onClick={() => setReplyingTo(replyingTo?.id === c.id ? null : { id: c.id, author: c.author })}
                                className="text-xs text-zinc-500 transition-colors hover:text-white"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline reply form */}
                  {replyingTo?.id === c.id && (
                    <form onSubmit={handleReplySubmit} className="mt-3 flex gap-2">
                      <input
                        type="text"
                        placeholder={`Reply to ${replyingTo.author}…`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        autoFocus
                        className="flex-1 rounded-xl bg-[#18181f] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none border border-[#2a2a35] focus:border-purple-500/50 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className="rounded-xl bg-purple-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Post
                      </button>
                      <button
                        type="button"
                        onClick={() => { setReplyingTo(null); setReplyText('') }}
                        className="rounded-xl border border-[#2a2a35] px-3 py-2 text-xs text-zinc-500 transition-colors hover:text-white"
                      >
                        ✕
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main comment input */}
      <form onSubmit={handleSubmit} className="border-t border-[#1e1e25] px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-900 text-[10px] font-bold text-white">
            {commentAuthor ? commentAuthor.slice(0, 1).toUpperCase() : '?'}
          </div>
          <input
            type="text"
            placeholder="Your name"
            value={commentAuthor}
            onChange={(e) => setCommentAuthor(e.target.value)}
            onBlur={(e) => { if (e.target.value.trim()) onAuthorChange(e.target.value.trim()) }}
            className="flex-1 rounded-lg bg-[#18181f] px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none border border-[#2a2a35] focus:border-purple-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Add a comment…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 rounded-xl bg-[#18181f] px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none border border-[#2a2a35] focus:border-purple-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Post
          </button>
        </div>
      </form>
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] rounded-t-[28px] border-t border-[#2a2a35] bg-[#101014] md:hidden flex flex-col">
        {panelContent}
      </div>
      <div className="fixed inset-0 z-50 hidden md:flex items-center justify-center p-6">
        <div className="relative flex w-full max-w-lg flex-col rounded-[24px] border border-[#2a2a35] bg-[#101014] shadow-2xl" style={{ maxHeight: '70vh' }}>
          {panelContent}
        </div>
      </div>
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
  comments: Comment[]
  tagCounts: Record<string, number>
  defaultAuthor: string
  isOwner: boolean
  commentLikedIds: Set<string>
  commentLikeCounts: Record<string, number>
  onLike: () => void
  onSave: () => void
  onAddComment: (text: string, author: string) => void
  onAuthorChange: (name: string) => void
  onLikeComment: (commentId: string, commentAuthor: string, commentText: string) => void
  onReplyToComment: (parentId: string, text: string, author: string, parentAuthor: string) => void
}

function PostCard({ post, resolvedImage, liked, saved, likeCount, comments, tagCounts, defaultAuthor, isOwner, commentLikedIds, commentLikeCounts, onLike, onSave, onAddComment, onAuthorChange, onLikeComment, onReplyToComment }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showHeart, setShowHeart] = useState(false)
  const [heartPos, setHeartPos] = useState({ x: 0, y: 0 })
  const [following, setFollowing] = useState(false)
  const lastTapRef = useRef(0)
  const imageRef = useRef<HTMLDivElement>(null)

  const authorUsername = getPostAuthorUsername(post)
  const authorHandle = getPostAuthorHandle(post)
  
  // Get builder level
  const builderXP = getBuilderXP(authorHandle)
  const builderLevel = getLevel(builderXP.total)
  const botw = isBuildOfWeek(post.id)

  useEffect(() => {
    setFollowing(isFollowing(authorUsername))
  }, [authorUsername])

  function handleFollow() {
    const nowFollowing = toggleFollow(authorUsername)
    setFollowing(nowFollowing)
  }

  function handleShare() {
    const url = `${window.location.origin}/community/${post.slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Double-tap/click to like (Instagram style)
  function handleImageClick(e: React.MouseEvent | React.TouchEvent) {
    const now = Date.now()
    const timeDiff = now - lastTapRef.current
    
    // Get click position
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    
    if (timeDiff < 300) {
      // Double tap detected
      const rect = imageRef.current?.getBoundingClientRect()
      if (rect) {
        setHeartPos({ x: clientX - rect.left, y: clientY - rect.top })
        setShowHeart(true)
        if (!liked) onLike()
        setTimeout(() => setShowHeart(false), 1000)
      }
    }
    lastTapRef.current = now
  }

  const authorName = post.vehicle.name || post.vehicleLabel
  const initials = authorName.slice(0, 2).toUpperCase()
  const previewComments = comments.slice(-2)
  const totalCommentCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0)

  return (
    <>
      <article className="bg-[#111116] rounded-2xl border border-[#1e1e24] overflow-hidden hover:border-[#2a2a35] transition-colors">
        {/* Card Header with Builder Level */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e24]/50">
          <Link 
            href={`/community/profile/${authorUsername}`} 
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-900 text-xs font-semibold text-white hover:opacity-80 transition-opacity"
          >
            {initials}
            {/* Build of the Week crown */}
            {botw && (
              <span className="absolute -top-0.5 -right-0.5 text-[10px]" title="Build of the Week">👑</span>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/community/profile/${authorUsername}`} className="text-sm font-semibold text-white hover:text-purple-400 transition-colors truncate">
                {authorHandle}
              </Link>
              {/* Builder Level Badge */}
              <span 
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getLevelColorClasses(builderLevel.color)}`}
                title={`${builderLevel.name} • Level ${builderLevel.level} • ${builderXP.total} XP`}
              >
                {builderLevel.badge} L{builderLevel.level}
              </span>
            </div>
            <p className="text-xs text-zinc-600 truncate">{post.vehicleLabel}</p>
          </div>
          {/* Follow Button */}
          <button
            onClick={handleFollow}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              following 
                ? 'bg-[#2a2a35] text-white hover:bg-[#3a3a45]' 
                : 'bg-purple-600 text-white hover:bg-purple-500'
            }`}
          >
            {following ? 'Following' : '+ Follow'}
          </button>
        </div>

        {/* Photo Container - Auto-scales to fit */}
        <div 
          ref={imageRef}
          className="relative w-full bg-[#0a0a0e] cursor-pointer select-none overflow-hidden group"
          style={{ aspectRatio: '1/1' }} // Square aspect ratio for grid
          onClick={handleImageClick}
        >
          {resolvedImage ? (
            <>
              <img
                src={resolvedImage}
                alt={post.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                draggable={false}
                style={{ objectPosition: 'center center' }}
              />
              {/* Hover overlay with view button */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Link 
                  href={`/community/${post.slug}`}
                  className="bg-white/90 text-black text-sm font-semibold px-4 py-2 rounded-full transform translate-y-2 group-hover:translate-y-0 transition-transform"
                  onClick={(e) => e.stopPropagation()}
                >
                  View Build
                </Link>
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-700">
              <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}
          
          {/* Double-tap heart animation */}
          <DoubleTapHeart show={showHeart} x={heartPos.x} y={heartPos.y} />
          
          {/* Status badge */}
          {post.status === 'completed' && (
            <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
              COMPLETE
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1">
            <button
              onClick={onLike}
              className={`p-2 -ml-2 rounded-full transition-all active:scale-90 ${liked ? 'text-red-500' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              aria-label="Like"
            >
              <svg viewBox="0 0 24 24" className={`h-6 w-6 ${liked ? 'fill-current' : 'fill-none'} stroke-current`} strokeWidth={liked ? 0 : 2}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <button
              onClick={() => setShowComments(true)}
              className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
              aria-label="Comment"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth={2}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <button
              onClick={handleShare}
              className={`p-2 rounded-full transition-all ${copied ? 'text-green-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              aria-label="Share"
            >
              {copied ? (
                <span className="text-xs font-medium px-1">Copied!</span>
              ) : (
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth={2}>
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
          <button
            onClick={onSave}
            className={`p-2 -mr-2 rounded-full transition-all active:scale-90 ${saved ? 'text-purple-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
            aria-label="Save"
          >
            <svg viewBox="0 0 24 24" className={`h-6 w-6 ${saved ? 'fill-current' : 'fill-none'} stroke-current`} strokeWidth={saved ? 0 : 2}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>

        {/* Likes & Caption */}
        <div className="px-4 pb-4 space-y-2">
          {likeCount > 0 && (
            <p className="text-sm font-semibold text-white">
              {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
            </p>
          )}
          
          <div>
            <p className="text-sm leading-snug">
              <Link href={`/community/profile/${getPostAuthorUsername(post)}`} className="font-semibold text-white hover:underline">
                {getPostAuthorHandle(post)}
              </Link>
              {' '}
              <span className="font-medium text-white">{post.title}</span>
              {post.description && (
                <span className="text-zinc-400 line-clamp-2"> {post.description}</span>
              )}
            </p>
          </div>
          
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 4).map((t) => (
                <span key={t} className="text-xs text-blue-400 hover:underline cursor-pointer">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Comments preview */}
        <div className="px-4 pb-3">
          {totalCommentCount > 0 ? (
            <button 
              onClick={() => setShowComments(true)}
              className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
            >
              View all {totalCommentCount} comments
            </button>
          ) : (
            <button 
              onClick={() => setShowComments(true)}
              className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Be the first to comment
            </button>
          )}
        </div>
      </article>

      {/* Comments sheet */}
      {showComments && (
        <CommentsSheet
          post={post}
          comments={comments}
          defaultAuthor={defaultAuthor}
          commentLikedIds={commentLikedIds}
          commentLikeCounts={commentLikeCounts}
          onAddComment={onAddComment}
          onAuthorChange={onAuthorChange}
          onLikeComment={onLikeComment}
          onReplyToComment={onReplyToComment}
          onClose={() => setShowComments(false)}
        />
      )}
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
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-purple-500">Go to Garage</Link>
        </div>
      </div>
    </div>
  )
}

// ── CommunityGallery ──────────────────────────────────────────────────────────

export default function CommunityGallery() {
  const [posts, setPosts] = useState<CommunityPostWithVehicle[]>([])
  const [likes, setLikes] = useState<Record<string, boolean>>({})
  const [saves, setSaves] = useState<Record<string, boolean>>({})
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [commenterName, setCommenterName] = useState('')
  const [commentLikedIds, setCommentLikedIds] = useState<Set<string>>(new Set())
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({})
  const [ownedVehicleIds, setOwnedVehicleIds] = useState<Set<string>>(new Set())
  const [ownedPostIds, setOwnedPostIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'liked'>('newest')
  const [feedFilter, setFeedFilter] = useState<'all' | 'following'>('all')
  const [filterTag, setFilterTag] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Smart Filter State
  const [smartFilters, setSmartFilters] = useState<FilterState>({
    search: '',
    make: '',
    model: '',
    minHp: null,
    maxHp: null,
    minBudget: null,
    maxBudget: null,
    tags: [],
    status: 'all',
    sort: 'newest',
  })
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check if user is logged in by looking for auth cookie
    const hasAuth = document.cookie.includes('modvora_session')
    setIsLoggedIn(hasAuth)
  }, [])

  useEffect(() => {
    fetchPublishedBuilds().then((fetched) => {
      setPosts(fetched)
      setLikes(safeRead(LIKES_KEY, {}))
      setSaves(safeRead(SAVES_KEY, {}))
      setLikeCounts(initLikeCounts(fetched))
      setComments(initComments(fetched))
      setCommenterName(safeRead(COMMENTER_NAME_KEY, ''))
      setCommentLikedIds(new Set(safeRead<string[]>(COMMENT_LIKES_KEY, [])))
      setCommentLikeCounts(safeRead(COMMENT_LIKE_COUNTS_KEY, {}))
      setOwnedVehicleIds(new Set(loadVehicles().map((v) => v.id)))
      setOwnedPostIds(new Set(loadCommunityPosts().map((p) => p.id)))
      setLoading(false)
    })
  }, [])

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const post of posts) {
      for (const tag of post.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1
      }
    }
    return counts
  }, [posts])

  const trendingTags = useMemo(() => {
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag)
  }, [tagCounts])

  const filteredPosts = useMemo(() => {
    let result = [...posts]
    
    // Following filter
    if (feedFilter === 'following') {
      const followed = getFollowedUsernames()
      result = result.filter((p) => followed.has(getPostAuthorUsername(p)))
    }
    
    if (filterTag) result = result.filter((p) => p.tags.includes(filterTag))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.vehicleLabel.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        (p.vehicle.name || '').toLowerCase().includes(q),
      )
    }
    if (sortBy === 'liked') result.sort((a, b) => (likeCounts[b.id] ?? 0) - (likeCounts[a.id] ?? 0))
    return result
  }, [posts, filterTag, search, sortBy, likeCounts, feedFilter])
  
  // Smart Filter Posts
  const smartFilteredPosts = useMemo(() => {
    let result = [...filteredPosts]
    
    // Smart search filters
    if (smartFilters.search) {
      const q = smartFilters.search.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.vehicleLabel.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    
    // Make filter (from vehicleLabel)
    if (smartFilters.make) {
      result = result.filter(p => 
        p.vehicleLabel.toLowerCase().includes(smartFilters.make!.toLowerCase())
      )
    }
    
    // Tag filters
    if (smartFilters.tags.length > 0) {
      result = result.filter(p => 
        smartFilters.tags.some(tag => p.tags.includes(tag))
      )
    }
    
    // Status filter
    if (smartFilters.status !== 'all') {
      result = result.filter(p => p.status === smartFilters.status)
    }
    
    // Sorting
    switch (smartFilters.sort) {
      case 'popular':
        result.sort((a, b) => (likeCounts[b.id] ?? 0) - (likeCounts[a.id] ?? 0))
        break
      case 'hp-high':
        result.sort((a, b) => (b.vehicle.hp ?? 0) - (a.vehicle.hp ?? 0))
        break
      case 'hp-low':
        result.sort((a, b) => (a.vehicle.hp ?? 0) - (b.vehicle.hp ?? 0))
        break
      // budget sorting would need budget data
    }
    
    return result
  }, [posts, filterTag, search, sortBy, likeCounts, feedFilter])

  const heroImages = useMemo(() => smartFilteredPosts.map((post) => post.heroImage), [smartFilteredPosts])
  const resolvedImageMap = useResolvedImageMap(heroImages)
  
  // Smart Filter Actions
  function applySmartFilters() {
    // Filters are applied automatically via useMemo
    // This function can be used to trigger analytics, URL updates, etc.
    console.log('Applying smart filters:', smartFilters)
  }
  
  function resetSmartFilters() {
    setSmartFilters({
      search: '',
      make: '',
      model: '',
      minHp: null,
      maxHp: null,
      minBudget: null,
      maxBudget: null,
      tags: [],
      status: 'all',
      sort: 'newest',
    })
  }

  function handleLike(postId: string) {
    const wasLiked = likes[postId]
    setLikes((prev) => {
      const next = { ...prev, [postId]: !wasLiked }
      safeWrite(LIKES_KEY, next)
      return next
    })
    setLikeCounts((prev) => {
      const next = { ...prev, [postId]: (prev[postId] ?? 0) + (wasLiked ? -1 : 1) }
      safeWrite(LIKE_COUNTS_KEY, next)
      return next
    })
    // Only notify on like (not un-like) - wasLiked is false when we're liking
    if (!wasLiked) {
      notifyLike(postId, posts.find(p => p.id === postId)?.title ?? '', ownedPostIds)
    }
  }

  function handleSave(postId: string) {
    setSaves((prev) => {
      const next = { ...prev, [postId]: !prev[postId] }
      safeWrite(SAVES_KEY, next)
      return next
    })
  }

  function handleNameChange(name: string) {
    setCommenterName(name)
    safeWrite(COMMENTER_NAME_KEY, name)
  }

  function handleAddComment(postId: string, text: string, author: string) {
    const newComment: Comment = {
      id: `c_${Date.now()}`,
      author,
      text,
      createdAt: new Date().toISOString(),
    }
    setComments((prev) => {
      const next = { ...prev, [postId]: [...(prev[postId] ?? []), newComment] }
      safeWrite(COMMENTS_KEY, next)
      return next
    })
    notifyComment(postId, posts.find(p => p.id === postId)?.title ?? '', author, commenterName, ownedPostIds)
  }

  function handleLikeComment(postId: string, commentId: string, commentAuthor: string, commentText: string) {
    const wasLiked = commentLikedIds.has(commentId)
    setCommentLikedIds((prev) => {
      const next = new Set(prev)
      wasLiked ? next.delete(commentId) : next.add(commentId)
      safeWrite(COMMENT_LIKES_KEY, Array.from(next))
      return next
    })
    setCommentLikeCounts((prev) => {
      const next = { ...prev, [commentId]: Math.max(0, (prev[commentId] ?? 0) + (wasLiked ? -1 : 1)) }
      safeWrite(COMMENT_LIKE_COUNTS_KEY, next)
      return next
    })
    if (!wasLiked) {
      notifyCommentLike(postId, posts.find(p => p.id === postId)?.title ?? '', commentText, commentAuthor, commenterName)
    }
  }

  function handleReplyToComment(postId: string, parentId: string, text: string, author: string, parentAuthor: string) {
    const reply: Reply = {
      id: `r_${Date.now()}`,
      author,
      text,
      createdAt: new Date().toISOString(),
    }
    setComments((prev) => {
      const postComments = (prev[postId] ?? []).map((c) =>
        c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c,
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

      {/* Search & Filters */}
      <div className="px-4 py-4 max-w-7xl mx-auto">
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
              onClick={() => setFeedFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${feedFilter === 'all' ? 'bg-white text-black' : 'bg-[#18181f] text-zinc-400 hover:text-white border border-[#2a2a35]'}`}
            >
              All Builds
            </button>
            <button
              onClick={() => setFeedFilter('following')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${feedFilter === 'following' ? 'bg-purple-600 text-white border-purple-500' : 'bg-[#18181f] text-zinc-400 hover:text-white border border-[#2a2a35]'}`}
            >
              Following
            </button>
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
      </div>

      {/* Build of the Week Banner */}
      {!loading && !search && !filterTag && feedFilter === 'all' && <BuildOfWeekBanner posts={posts} resolvedImageMap={resolvedImageMap} likeCounts={likeCounts} />}

      {/* 3-Column Layout: Sidebar | Feed | Sidebar */}
      <div className="px-4 pb-8 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Smart Search */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              <SmartSearchSidebar
                filters={smartFilters}
                onChange={setSmartFilters}
                onApply={() => applySmartFilters()}
                onReset={resetSmartFilters}
                resultCount={smartFilteredPosts.length}
              />
            </div>
          </div>
          
          {/* Main Feed */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          // Grid skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#111116] rounded-2xl border border-[#1e1e24] overflow-hidden">
              {/* Header skeleton */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e24]/50">
                <div className="skeleton h-8 w-8 rounded-full" />
                <div className="skeleton h-3 w-24 rounded-full" />
              </div>
              {/* Image skeleton - Square aspect for grid */}
              <div className="skeleton aspect-square w-full" />
              {/* Actions skeleton */}
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex gap-1">
                  <div className="skeleton h-6 w-6 rounded-full" />
                  <div className="skeleton h-6 w-6 rounded-full" />
                  <div className="skeleton h-6 w-6 rounded-full" />
                </div>
                <div className="skeleton h-6 w-6 rounded-full" />
              </div>
              {/* Caption skeleton */}
              <div className="px-4 pb-4 space-y-2">
                <div className="skeleton h-3 w-20 rounded-full" />
                <div className="skeleton h-3 w-32 rounded-full" />
                <div className="skeleton h-3 w-48 rounded-full" />
              </div>
            </div>
          ))
        ) : smartFilteredPosts.length === 0 && posts.length === 0 ? (
          <EmptyState />
        ) : smartFilteredPosts.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-zinc-500">No posts match your search.</p>
          </div>
        ) : (
          smartFilteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              resolvedImage={resolvedImageMap[post.heroImage] || post.heroImage}
              liked={!!likes[post.id]}
              saved={!!saves[post.id]}
              likeCount={likeCounts[post.id] ?? 0}
              comments={comments[post.id] ?? []}
              tagCounts={tagCounts}
              defaultAuthor={commenterName}
              isOwner={ownedVehicleIds.has(post.vehicleId) || ownedPostIds.has(post.id) || post.isLocal}
              commentLikedIds={commentLikedIds}
              commentLikeCounts={commentLikeCounts}
              onLike={() => handleLike(post.id)}
              onSave={() => handleSave(post.id)}
              onAddComment={(text, author) => handleAddComment(post.id, text, author)}
              onAuthorChange={handleNameChange}
              onLikeComment={(commentId, commentAuthor, commentText) => handleLikeComment(post.id, commentId, commentAuthor, commentText)}
              onReplyToComment={(parentId, text, author, parentAuthor) => handleReplyToComment(post.id, parentId, text, author, parentAuthor)}
            />
          ))
        )}
            </div>
          </div>
          
          {/* Right Sidebar - Leaderboards & Battles */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              <BuildBattle />
              <LeaderboardsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
