'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Liker {
  userId: string
  userName: string
  userAvatar?: string
  isVerified?: boolean
}

interface EnhancedLikeButtonProps {
  postId: string
  likeCount: number
  isLiked: boolean
  likers: Liker[]
  onLike: () => void
  size?: 'sm' | 'md' | 'lg'
}

function HeartIcon({ filled, size = 24 }: { filled: boolean; size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={filled ? "#ef4444" : "none"}
      stroke={filled ? "#ef4444" : "currentColor"}
      strokeWidth={filled ? 0 : 2}
    >
      <motion.path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        initial={false}
        animate={filled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      />
    </svg>
  )
}

function LikeBurst({ x, y }: { x: number; y: number }) {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i * 60) * (Math.PI / 180),
    distance: 20 + Math.random() * 20
  }))

  return (
    <div className="absolute pointer-events-none" style={{ left: x - 12, top: y - 12 }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 rounded-full bg-red-500"
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
    </div>
  )
}

function FloatingHeart({ x, y }: { x: number; y: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      initial={{ x, y, scale: 0.5, opacity: 1 }}
      animate={{ 
        y: y - 80, 
        scale: 1.5, 
        opacity: 0 
      }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <HeartIcon filled size={24} />
    </motion.div>
  )
}

export default function EnhancedLikeButton({ 
  postId, 
  likeCount, 
  isLiked, 
  likers,
  onLike,
  size = 'md'
}: EnhancedLikeButtonProps) {
  const [showBurst, setShowBurst] = useState(false)
  const [clickPos, setClickPos] = useState({ x: 0, y: 0 })
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (isLiked) {
      // Unlike - no animation
      onLike()
      return
    }

    // Like with animation
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setClickPos({ x, y })
    setShowBurst(true)
    setTimeout(() => setShowBurst(false), 600)

    // Add floating heart
    const id = Date.now()
    setFloatingHearts(prev => [...prev, { id, x, y }])
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id))
    }, 800)

    // Trigger like
    setIsAnimating(true)
    onLike()
    setTimeout(() => setIsAnimating(false), 300)
  }

  const sizeClasses = {
    sm: { button: 'p-1.5', icon: 18, count: 'text-xs' },
    md: { button: 'p-2', icon: 24, count: 'text-sm' },
    lg: { button: 'p-3', icon: 32, count: 'text-base' }
  }
  const s = sizeClasses[size]

  // Format likers text
  const likersText = likers.length === 0 
    ? (likeCount === 0 ? 'Be first to like' : `${likeCount} likes`)
    : likers.length === 1 
      ? `Liked by ${likers[0].userName}`
      : likers.length === 2
        ? `Liked by ${likers[0].userName} and ${likers[1].userName}`
        : `Liked by ${likers[0].userName} and ${likeCount - 1} others`

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          onClick={handleClick}
          className={`
            relative ${s.button} rounded-full transition-all
            ${isLiked 
              ? 'text-red-500 bg-red-500/10' 
              : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10'
            }
            ${isAnimating ? 'scale-110' : ''}
            active:scale-95
          `}
        >
          <HeartIcon filled={isLiked} size={s.icon} />
          
          {/* Burst animation on like */}
          <AnimatePresence>
            {showBurst && (
              <LikeBurst x={clickPos.x} y={clickPos.y} />
            )}
          </AnimatePresence>
          
          {/* Floating hearts */}
          {floatingHearts.map(heart => (
            <FloatingHeart key={heart.id} x={heart.x} y={heart.y} />
          ))}
        </button>
        
        {/* Like count - always show */}
        <motion.span 
          key={likeCount}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`${s.count} font-semibold ${isLiked ? 'text-red-500' : 'text-white'}`}
        >
          {likeCount.toLocaleString()}
        </motion.span>
      </div>
      
      {/* Likers avatars */}
      {likers.length > 0 && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className="flex -space-x-2">
            {likers.slice(0, 3).map((liker, i) => (
              <img
                key={liker.userId}
                src={liker.userAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${liker.userName}`}
                alt={liker.userName}
                className="w-5 h-5 rounded-full border-2 border-[#0a0a0b] bg-zinc-800"
                title={liker.userName + (liker.isVerified ? ' ✓' : '')}
              />
            ))}
          </div>
          <span className="text-xs text-zinc-500">
            {likersText}
          </span>
        </div>
      )}
    </div>
  )
}
