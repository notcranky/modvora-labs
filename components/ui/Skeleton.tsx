'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animate?: boolean
}

export function Skeleton({ 
  className = '', 
  variant = 'text',
  width,
  height,
  animate = true 
}: SkeletonProps) {
  const baseClasses = 'bg-[#2a2a30] overflow-hidden'
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  }
  
  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined)
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    >
      {animate && (
        <motion.div
          className="w-full h-full bg-gradient-to-r from-transparent via-[#3a3a45] to-transparent"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear'
          }}
        />
      )}
    </div>
  )
}

export function PostCardSkeleton() {
  return (
    <div className="bg-[#16161a] rounded-2xl overflow-hidden border border-[#2a2a30]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="40%" height={16} />
          <Skeleton width="60%" height={12} />
        </div>
      </div>
      
      {/* Image */}
      <Skeleton variant="rectangular" height={300} animate={false} />
      
      {/* Action bar */}
      <div className="p-4 space-y-3">
        <div className="flex gap-4">
          <Skeleton width={80} height={32} variant="rounded" />
          <Skeleton width={80} height={32} variant="rounded" />
          <Skeleton width={80} height={32} variant="rounded" />
        </div>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={14} />
      </div>
    </div>
  )
}

export function StoriesSkeleton() {
  return (
    <div className="flex gap-4 py-4 px-4 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 min-w-[72px]">
          <Skeleton variant="circular" width={56} height={56} />
          <Skeleton width={60} height={12} />
        </div>
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Cover */}
      <Skeleton variant="rectangular" height={200} animate={false} />
      
      {/* Avatar + Stats */}
      <div className="px-4 -mt-12 flex items-end gap-4">
        <Skeleton variant="circular" width={96} height={96} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={16} />
        </div>
      </div>
      
      {/* Stats row */}
      <div className="flex justify-around px-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center space-y-1">
            <Skeleton width={40} height={24} className="mx-auto" />
            <Skeleton width={60} height={14} className="mx-auto" />
          </div>
        ))}
      </div>
      
      {/* Bio */}
      <div className="px-4 space-y-2">
        <Skeleton width="100%" height={16} />
        <Skeleton width="80%" height={16} />
      </div>
    </div>
  )
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6 px-4 py-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}
