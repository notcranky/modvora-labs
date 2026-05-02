'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { motion, useAnimation, PanInfo } from 'framer-motion'

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  pullDistance?: number
}

export default function PullToRefresh({ 
  children, 
  onRefresh, 
  pullDistance = 100 
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullProgress, setPullProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  const startY = useRef(0)
  const currentY = useRef(0)

  const handleDragStart = (event: any) => {
    // Only trigger if at top of scroll
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = event.touches ? event.touches[0].clientY : event.clientY
    }
  }

  const handleDrag = (event: any, info: PanInfo) => {
    if (!containerRef.current) return
    if (containerRef.current.scrollTop > 0) return
    
    currentY.current = info.offset.y
    const progress = Math.min(currentY.current / pullDistance, 1)
    setPullProgress(progress)
    
    if (progress >= 1 && !isRefreshing) {
      setIsRefreshing(true)
      controls.start({ y: pullDistance })
      onRefresh().finally(() => {
        setIsRefreshing(false)
        setPullProgress(0)
        controls.start({ y: 0 })
      })
    }
  }

  const handleDragEnd = () => {
    if (!isRefreshing) {
      setPullProgress(0)
      controls.start({ y: 0 })
    }
  }

  return (
    <div 
      ref={containerRef}
      className="relative overflow-y-auto h-full"
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-0 flex items-center justify-center overflow-hidden pointer-events-none z-10"
        animate={{ height: Math.max(0, currentY.current) }}
        style={{ willChange: 'height' }}
      >
        <div className="flex flex-col items-center gap-2">
          <motion.div
            animate={{ 
              rotate: pullProgress * 360,
              scale: isRefreshing ? [1, 0.8, 1] : 1
            }}
            transition={{ 
              rotate: { duration: 0 },
              scale: isRefreshing ? { repeat: Infinity, duration: 1 } : { duration: 0.2 }
            }}
          >
            <svg 
              className={`w-8 h-8 ${pullProgress >= 1 ? 'text-purple-500' : 'text-zinc-500'}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
          <span className="text-xs text-zinc-400">
            {isRefreshing ? 'Updating...' : pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </motion.div>

      {/* Main content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ y: 0 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
