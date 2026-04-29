'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface LikeButtonProps {
  postId: string
  userId: string | null
  initialCount: number
  initiallyLiked: boolean
  onError?: (error: string) => void
  size?: 'sm' | 'md' | 'lg'
}

export default function LikeButton({ 
  postId, 
  userId, 
  initialCount, 
  initiallyLiked,
  onError,
  size = 'md'
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initiallyLiked)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)

  // Sync with props when they change (e.g., from parent re-fetch)
  useEffect(() => {
    setIsLiked(initiallyLiked)
    setCount(initialCount)
  }, [initiallyLiked, initialCount])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!postId) return

    const channel = supabase
      .channel(`likes:${postId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'likes',
        filter: `post_id=eq.${postId}`
      }, async () => {
        // Re-fetch count when any like changes
        const { count: newCount } = await supabase
          .from('likes')
          .select('id', { count: 'exact' })
          .eq('post_id', postId)
        
        setCount(newCount || 0)
        
        // Update user's like status
        if (userId) {
          const { data } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', userId)
            .eq('post_id', postId)
            .maybeSingle()
          
          setIsLiked(!!data)
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [postId, userId])

  const handleClick = useCallback(async () => {
    if (!userId) {
      onError?.('Please sign in to like posts')
      return
    }
    
    if (isLoading) return
    
    const wasLiked = isLiked
    
    // Optimistic update
    setIsLiked(!wasLiked)
    setCount(prev => wasLiked ? prev - 1 : prev + 1)
    setIsLoading(true)
    
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
        // Like - use upsert with conflict handling
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: userId, post_id: postId })
          .select()
        
        if (error) {
          // Check if it's a unique constraint violation (already liked)
          if (error.code === '23505') {
            // Already liked, that's fine
            setIsLiked(true)
          } else {
            throw error
          }
        }
      }
      
      // Verify the change by fetching current count
      const { count: verifiedCount } = await supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('post_id', postId)
      
      setCount(verifiedCount || 0)
      
    } catch (err: any) {
      console.error('Like error:', err)
      
      // Revert optimistic update
      setIsLiked(wasLiked)
      setCount(prev => wasLiked ? prev + 1 : prev - 1)
      
      onError?.(err.message || 'Failed to like post')
      
      // Re-fetch actual state
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle()
      
      setIsLiked(!!data)
      
      const { count: actualCount } = await supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('post_id', postId)
      
      setCount(actualCount || 0)
    } finally {
      setIsLoading(false)
    }
  }, [isLiked, isLoading, postId, userId, onError])

  const sizeClasses = {
    sm: { button: 'p-1.5', icon: 18, count: 'text-xs' },
    md: { button: 'p-2', icon: 24, count: 'text-sm' },
    lg: { button: 'p-3', icon: 32, count: 'text-base' }
  }
  const s = sizeClasses[size]

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        flex items-center gap-1.5 ${s.button} rounded-full transition-all
        ${isLiked 
          ? 'text-red-500 bg-red-500/10' 
          : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
      `}
    >
      <motion.svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        fill={isLiked ? "#ef4444" : "none"}
        stroke={isLiked ? "#ef4444" : "currentColor"}
        strokeWidth={isLiked ? 0 : 2}
        animate={isLiked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </motion.svg>
      
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`${s.count} font-semibold ${isLiked ? 'text-red-500' : 'text-white'}`}
        >
          {count.toLocaleString()}
        </motion.span>
      )}
    </button>
  )
}
