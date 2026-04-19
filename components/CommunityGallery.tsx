'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { fetchPublishedBuilds, CommunityPostWithVehicle, loadCommunityPosts } from '@/lib/community'
import { getPostAuthorUsername, getPostAuthorHandle } from '@/lib/profiles'
import NotificationBell from '@/components/NotificationBell'
import { notifyComment, notifyLike, notifyCommentLike, notifyCommentReply } from '@/lib/notifications'
import { useResolvedImageMap } from '@/lib/local-images'
import { loadVehicles } from '@/lib/garage'

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

  function handleShare() {
    const url = `${window.location.origin}/community/${post.slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const authorName = post.vehicle.name || post.vehicleLabel
  const initials = authorName.slice(0, 2).toUpperCase()
  const previewComments = comments.slice(-2)
  const totalCommentCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0)

  return (
    <>
      <article className="overflow-hidden rounded-[24px] border border-[#1e1e24] bg-[#0e0e12]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href={`/community/profile/${getPostAuthorUsername(post)}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-900 text-xs font-bold text-white hover:opacity-80 transition-opacity">
            {initials}
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Link href={`/community/profile/${getPostAuthorUsername(post)}`} className="truncate text-sm font-semibold text-white hover:text-purple-400 transition-colors">{authorName}</Link>
              <span className="shrink-0 text-xs text-zinc-600">@{getPostAuthorHandle(post)}</span>
            </div>
            <p className="truncate text-xs text-zinc-500">{post.vehicleLabel} · {timeAgo(post.publishedAt ?? post.updatedAt)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`text-[10px] font-medium uppercase tracking-widest ${post.status === 'completed' ? 'text-green-500/70' : 'text-zinc-600'}`}>
              {post.status === 'completed' ? 'Done' : 'Building'}
            </span>
            {isOwner && (
              <Link href={`/dashboard/publish?edit=${post.slug}`} className="rounded-full border border-[#2a2a35] bg-[#18181f] px-2.5 py-1 text-[10px] font-medium text-zinc-400 transition-colors hover:border-purple-500/40 hover:text-white">
                Edit
              </Link>
            )}
          </div>
        </div>

        {/* Photo */}
        <Link href={`/community/${post.slug}`} className="block">
          <div className="relative w-full overflow-hidden bg-[#0a0a0e]" style={{ aspectRatio: '4/3' }}>
            {resolvedImage ? (
              <img
                src={resolvedImage}
                alt={post.title}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-700">
                <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
            )}
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-0.5 px-3 pt-3">
          <button
            onClick={onLike}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm transition-colors ${liked ? 'text-red-500' : 'text-zinc-400 hover:text-white'}`}
            aria-label="Like"
          >
            <HeartIcon filled={liked} />
          </button>
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
            aria-label="Comment"
          >
            <CommentIcon />
          </button>
          <div className="flex-1" />
          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm transition-colors ${copied ? 'text-green-400' : 'text-zinc-400 hover:text-white'}`}
            aria-label="Share"
          >
            {copied ? <span className="text-xs font-medium">Copied!</span> : <ShareIcon />}
          </button>
          <button
            onClick={onSave}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm transition-colors ${saved ? 'text-purple-400' : 'text-zinc-400 hover:text-white'}`}
            aria-label="Save"
          >
            <BookmarkIcon filled={saved} />
          </button>
        </div>

        {/* Likes count */}
        {likeCount > 0 && (
          <p className="px-4 pb-1 text-sm font-semibold text-white">
            {likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}
          </p>
        )}

        {/* Caption */}
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed">
            <span className="font-semibold text-white">{post.vehicleLabel} </span>
            <span className="font-medium text-white">{post.title}</span>
            {post.description && (
              <span className="text-zinc-400"> — {post.description}</span>
            )}
          </p>
          {post.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-2.5">
              {post.tags.slice(0, 5).map((t) => (
                <span key={t} className="text-xs text-zinc-600">#{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Comment preview */}
        <button
          onClick={() => setShowComments(true)}
          className="w-full border-t border-[#1e1e25] px-4 py-2.5 text-left transition-colors hover:bg-[#13131a]"
        >
          {comments.length > 0 ? (
            <div className="space-y-1">
              {totalCommentCount > 2 && (
                <p className="text-xs text-zinc-500">View all {totalCommentCount} comments</p>
              )}
              {previewComments.map((c) => (
                <p key={c.id} className="truncate text-sm leading-snug">
                  <span className="font-semibold text-white">{c.author} </span>
                  <span className="text-zinc-400">{c.text}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">Add a comment…</p>
          )}
        </button>
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
    <div className="rounded-[28px] border border-dashed border-[#2a2a30] bg-[#101014] p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-2xl">🏁</div>
      <h3 className="mt-5 text-2xl font-semibold text-white">No community builds yet</h3>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">Publish one of your saved garage builds to kick off the feed.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-purple-500">Go to Garage</Link>
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
  const [filterTag, setFilterTag] = useState('')
  const [loading, setLoading] = useState(true)

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
  }, [posts, filterTag, search, sortBy, likeCounts])

  const heroImages = useMemo(() => filteredPosts.map((post) => post.heroImage), [filteredPosts])
  const resolvedImageMap = useResolvedImageMap(heroImages)

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
      {/* Header */}
      <div className="mx-auto mb-8 max-w-[600px]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Community</h1>
            <p className="mt-1 text-sm text-zinc-500">Real builds, straight from the garage.</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link href="/dashboard/publish" className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500">
              Publish
            </Link>
          </div>
        </div>
      </div>

      {/* Search + Sort + Tag filter */}
      <div className="mx-auto mb-5 max-w-[600px] space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg viewBox="0 0 24 24" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-zinc-500" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search builds, tags, or people…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#1e1e24] bg-[#0e0e12] py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
          <button
            onClick={() => setSortBy('newest')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${sortBy === 'newest' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Newest
          </button>
          <button
            onClick={() => setSortBy('liked')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${sortBy === 'liked' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Top
          </button>
        </div>

        {/* Trending tags */}
        {trendingTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {filterTag && (
              <button
                onClick={() => setFilterTag('')}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                #{filterTag} ✕
              </button>
            )}
            {trendingTags.filter((t) => t !== filterTag).map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="mx-auto max-w-[600px] space-y-6">
        {loading ? (
          // Skeleton loaders while posts fetch
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[24px] border border-[#1e1e24] bg-[#111116] overflow-hidden">
              {/* Image skeleton */}
              <div className="skeleton h-52 w-full" />
              <div className="p-5 space-y-3">
                {/* Author row */}
                <div className="flex items-center gap-2">
                  <div className="skeleton h-8 w-8 rounded-full" />
                  <div className="space-y-1.5">
                    <div className="skeleton h-3 w-28 rounded-full" />
                    <div className="skeleton h-2.5 w-20 rounded-full" />
                  </div>
                </div>
                {/* Title */}
                <div className="skeleton h-4 w-3/4 rounded-full" />
                {/* Description lines */}
                <div className="skeleton h-3 w-full rounded-full" />
                <div className="skeleton h-3 w-5/6 rounded-full" />
                {/* Tags */}
                <div className="flex gap-2 pt-1">
                  <div className="skeleton h-5 w-14 rounded-full" />
                  <div className="skeleton h-5 w-16 rounded-full" />
                  <div className="skeleton h-5 w-12 rounded-full" />
                </div>
              </div>
            </div>
          ))
        ) : filteredPosts.length === 0 && posts.length === 0 ? (
          <EmptyState />
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#2a2a30] bg-[#101014] p-10 text-center">
            <p className="text-sm text-zinc-500">No posts match your search.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
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
  )
}
