'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Story {
  id: string
  userId: string
  userName: string
  userHandle: string
  userAvatar?: string
  imageUrl: string
  caption?: string
  createdAt: string
  hasUnviewed: boolean
}

interface StoriesBarProps {
  stories: Story[]
  currentUserId?: string
  onViewStory: (story: Story) => void
  onCreateStory: () => void
}

function StoryAvatar({ story, isCurrentUser, onClick, hasUnviewed }: { 
  story?: Story
  isCurrentUser?: boolean
  onClick: () => void
  hasUnviewed?: boolean 
}) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 min-w-[72px] group"
    >
      <div className={`
        relative rounded-full p-[3px] 
        ${hasUnviewed || isCurrentUser 
          ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400' 
          : 'bg-zinc-700'
        }
        ${isCurrentUser ? 'bg-zinc-600' : ''}
        transition-transform active:scale-95
      `}>
        <div className="rounded-full bg-[#0a0a0b] p-[2px]">
          {isCurrentUser ? (
            <div className="w-14 h-14 rounded-full bg-[#1a1a20] flex items-center justify-center border-2 border-dashed border-zinc-600 group-hover:border-purple-500 transition-colors">
              <svg className="w-6 h-6 text-zinc-400 group-hover:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          ) : (
            <img
              src={story?.userAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${story?.userHandle}`}
              alt={story?.userName || 'Add story'}
              className="w-14 h-14 rounded-full object-cover bg-zinc-800"
            />
          )}
        </div>
        {isCurrentUser && (
          <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#0a0a0b]">
            +
          </div>
        )}
      </div>
      <span className="text-xs text-zinc-400 group-hover:text-white transition-colors truncate max-w-[72px]">
        {isCurrentUser ? 'Your Story' : story?.userHandle || 'unknown'}
      </span>
    </button>
  )
}

export default function StoriesBar({ stories, currentUserId, onViewStory, onCreateStory }: StoriesBarPropsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setShowLeftArrow(el.scrollLeft > 0)
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll)
      return () => el.removeEventListener('scroll', checkScroll)
    }
  }, [stories])

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' })
  }

  // Group stories by user
  const userStories = stories.reduce((acc, story) => {
    if (!acc[story.userId]) {
      acc[story.userId] = []
    }
    acc[story.userId].push(story)
    return acc
  }, {} as Record<string, Story[]>)

  const uniqueUsers = Object.entries(userStories).map(([userId, userStories]) => ({
    userId,
    story: userStories[0], // Show first story
    hasUnviewed: userStories.some(s => s.hasUnviewed)
  }))

  return (
    <div className="relative bg-[#0a0a0b] border-b border-[#1e1e24]">
      <div className="flex items-center py-4 px-4">
        {/* Current user story - add button */}
        <StoryAvatar 
          isCurrentUser 
          onClick={onCreateStory}
          hasUnviewed={false}
        />
        
        {/* Divider */}
        <div className="w-px h-12 bg-[#1e1e24] mx-4" />
        
        {/* Stories list */}
        <div className="relative flex-1 overflow-hidden">
          {showLeftArrow && (
            <button 
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#0a0a0b]/80 backdrop-blur-sm p-1 rounded-full text-white hover:bg-[#1a1a20]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {uniqueUsers.map(({ userId, story, hasUnviewed }) => (
              <StoryAvatar
                key={userId}
                story={story}
                hasUnviewed={hasUnviewed}
                onClick={() => onViewStory(story)}
              />
            ))}
          </div>
          
          {showRightArrow && (
            <button 
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#0a0a0b]/80 backdrop-blur-sm p-1 rounded-full text-white hover:bg-[#1a1a20]"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
