'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, useAnimation, PanInfo } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import EnhancedLikeButton from './EnhancedLikeButton'
// Icons (inline SVG to avoid lucide-react dependency)
const MessageCircle = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
const Share2 = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8m-4-6l-4-4m0 0L8 6m4-4v13" /></svg>
const Bookmark = ({ filled }: { filled?: boolean }) => <svg className="w-6 h-6" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
const MoreHorizontal = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>

interface Liker {
  userId: string
  userName: string
  userAvatar?: string
  isVerified?: boolean
}

interface Comment {
  id: string
  author: string
  text: string
  createdAt: string
  likes?: number
  replies?: Comment[]
}

interface PostCardProps {
  id: string
  title: string
  subtitle: string
  image: string
  tags: string[]
  author: string
  authorHandle: string
  authorAvatar?: string
  isVerified?: boolean
  verifiedType?: 'verified' | 'admin' | null
  isOwner?: boolean
  likeCount: number
  isLiked: boolean
  likers: Liker[]
  commentCount: number
  comments?: Comment[]
  shareCount: number
  createdAt: string
  onLike: () => void
  onSave: () => void
  onShare: () => void
  onOpenComments: () => void
  isSaved: boolean
  viewCount?: number
}

function DoubleTapHeart({ show, x, y }: { show: boolean; x: number; y: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none z-20"
      initial={{ scale: 0, opacity: 0 }}
      animate={show ? { 
        scale: [0, 1.5, 1],
        opacity: [0, 1, 0]
      } : {}}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ left: x - 50, top: y - 50 }}
    >
      <svg width="100" height="100" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    </motion.div>
  )
}

function SpecBadge({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1a1a20] rounded-full text-xs">
      <span className="text-zinc-400">{icon}</span>
      <span className="text-white font-medium">{value}</span>
      <span className="text-zinc-500">{label}</span>
    </div>
  )
}

export default function PostCard({
  id,
  title,
  subtitle,
  image,
  tags,
  author,
  authorHandle,
  authorAvatar,
  isVerified,
  verifiedType,
  isOwner,
  likeCount,
  isLiked,
  likers,
  commentCount,
  comments,
  shareCount,
  createdAt,
  onLike,
  onSave,
  onShare,
  onOpenComments,
  isSaved,
  viewCount
}: PostCardProps) {
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false)
  const [heartPos, setHeartPos] = useState({ x: 0, y: 0 })
  const [lastTap, setLastTap] = useState(0)
  const imageRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()

  // Double-tap detection
  const handleImageClick = (e: React.MouseEvent) => {
    const now = Date.now()
    const timeDiff = now - lastTap
    
    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected
      const rect = imageRef.current?.getBoundingClientRect()
      if (rect) {
        setHeartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        setShowDoubleTapHeart(true)
        setTimeout(() => setShowDoubleTapHeart(false), 800)
        
        // Trigger like if not already liked
        if (!isLiked) {
          onLike()
        }
      }
    }
    
    setLastTap(now)
  }

  const verifiedBadge = isVerified && (
    <span className={`
      inline-flex items-center justify-center w-4 h-4 rounded-full ml-1
      ${verifiedType === 'admin' ? 'bg-yellow-500' : 'bg-purple-600'}
    `}>
      <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
      </svg>
    </span>
  )

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#16161a] rounded-2xl overflow-hidden border border-[#2a2a30] hover:border-[#3a3a45] transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Link href={`/community/profile/${authorHandle}`}>
            <img
              src={authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${author}`}
              alt={author}
              className="w-10 h-10 rounded-full bg-zinc-800 object-cover hover:ring-2 hover:ring-purple-500/50 transition-all"
            />
          </Link>
          <div>
            <Link 
              href={`/community/profile/${authorHandle}`}
              className="flex items-center text-white font-medium hover:text-purple-400 transition-colors"
            >
              {author}
              {verifiedBadge}
            </Link>
            <p className="text-xs text-zinc-500">{subtitle} · {formattedDate}</p>
          </div>
        </div>
        
        <button className="p-2 text-zinc-400 hover:text-white hover:bg-[#1a1a20] rounded-full transition-colors">
          <MoreHorizontal />
        </button>
      </div>

      {/* Image with double-tap like */}
      <div 
        ref={imageRef}
        className="relative aspect-[4/3] bg-zinc-900 cursor-pointer overflow-hidden group"
        onClick={handleImageClick}
      >
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Double-tap heart */}
        <DoubleTapHeart show={showDoubleTapHeart} x={heartPos.x} y={heartPos.y} />
        
        {/* Tap hint */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          initial={false}
        >
          <span className="text-white/80 text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
            Double-tap to like
          </span>
        </motion.div>
        
        {/* Tags overlay */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-2 py-1 bg-black/60 backdrop-blur-sm text-zinc-300 rounded-full">
              #{tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs px-2 py-1 bg-black/60 backdrop-blur-sm text-zinc-400 rounded-full">
              +{tags.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <EnhancedLikeButton
              postId={id}
              likeCount={likeCount}
              isLiked={isLiked}
              likers={likers}
              onLike={onLike}
              size="md"
            />
            
            <button
              onClick={onOpenComments}
              className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-full transition-colors flex items-center gap-1.5"
            >
              <MessageCircle className="w-6 h-6" />
              {commentCount > 0 && (
                <span className="text-sm font-medium">{commentCount}</span>
              )}
            </button>
            
            <button
              onClick={onShare}
              className="p-2 text-zinc-400 hover:text-green-400 hover:bg-green-500/10 rounded-full transition-colors flex items-center gap-1.5"
            >
              <Share2 className="w-6 h-6" />
              {shareCount > 0 && (
                <span className="text-sm font-medium">{shareCount}</span>
              )}
            </button>
          </div>
          
          <button
            onClick={onSave}
            className={`p-2 rounded-full transition-colors ${
              isSaved 
                ? 'text-yellow-400 bg-yellow-500/10' 
                : 'text-zinc-400 hover:text-yellow-400 hover:bg-yellow-500/10'
            }`}
          >
            <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Comments preview */}
        {comments && comments.length > 0 && (
          <div className="mt-3 space-y-2">
            {comments.slice(0, 2).map(comment => (
              <div key={comment.id} className="flex gap-2 text-sm">
                <span className="font-medium text-white">{comment.author}</span>
                <span className="text-zinc-400 line-clamp-2">{comment.text}</span>
              </div>
            ))}
            {comments.length > 2 && (
              <button
                onClick={onOpenComments}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                View all {comments.length} comments
              </button>
            )}
          </div>
        )}
      </div>
    </motion.article>
  )
}
