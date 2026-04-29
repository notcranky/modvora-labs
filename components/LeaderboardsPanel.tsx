'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LeaderboardCategory, 
  getLeaderboard, 
  getAllLeaderboards,
  formatLeaderboardValue,
  getRankBadge,
  getRankColor,
} from '@/lib/leaderboards'

interface LeaderboardsPanelProps {
  className?: string
}

export default function LeaderboardsPanel({ className = '' }: LeaderboardsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>('most_liked_builds')
  const [isExpanded, setIsExpanded] = useState(false)
  
  const allBoards = getAllLeaderboards()
  const currentBoard = allBoards.find(b => b.category === selectedCategory) || allBoards[0]
  
  const categoryLabels: Record<LeaderboardCategory, string> = {
    most_liked_builds: '❤️ Most Liked',
    top_builders: '⭐ Top Builders',
    highest_hp: '🔥 Highest HP',
    biggest_budget: '💰 Biggest Budget',
    most_commented: '💬 Most Active',
    rising_stars: '🚀 Rising Stars',
    battle_winners: '⚔️ Battle Champs',
  }
  
  return (
    <div className={`bg-[#111116] rounded-2xl border border-[#1e1e24] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e1e24]/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span>🏆</span> Leaderboards
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
      
      {/* Category Tabs */}
      <div className="flex gap-1 p-2 overflow-x-auto scrollbar-hide">
        {Object.entries(categoryLabels).map(([cat, label]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat as LeaderboardCategory)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white'
                : 'bg-[#18181f] text-zinc-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      
      {/* Leaderboard Content */}
      <div className="px-3 pb-3">
        <p className="text-xs text-zinc-500 mb-3 px-1">{currentBoard.description}</p>
        
        <div className="space-y-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentBoard.entries.slice(0, isExpanded ? 10 : 5).map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#18181f] transition-colors group"
                >
                  {/* Rank */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${getRankColor(entry.rank)}`}>
                    {getRankBadge(entry.rank)}
                  </div>
                  
                  {/* Avatar (for user leaderboards) */}
                  {entry.avatar && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-xs font-bold text-white">
                      {entry.avatar}
                    </div>
                  )}
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={entry.id.startsWith('user') 
                        ? `/community/profile/${entry.handle}` 
                        : `/community/${entry.id.startsWith('post') ? entry.id.replace('post-', '') : entry.id}`
                      }
                      className="text-sm font-medium text-white hover:text-purple-400 transition-colors truncate block"
                    >
                      {entry.name}
                    </Link>
                    {entry.secondaryValue && (
                      <p className="text-xs text-zinc-500 truncate">{entry.secondaryValue}</p>
                    )}
                  </div>
                  
                  {/* Value */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-white">
                      {formatLeaderboardValue(entry.value, entry.valueLabel)}
                    </p>
                    <p className="text-xs text-zinc-500">{entry.valueLabel}</p>
                  </div>
                  
                  {/* Trend */}
                  {entry.change && entry.change !== 'same' && (
                    <div className={`text-xs ${entry.change === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.change === 'up' ? '↑' : '↓'}
                      {entry.trend && entry.trend > 0 && entry.trend}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* View All Link */}
        <Link 
          href="/community/leaderboards"
          className="flex items-center justify-center gap-1 mt-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors border-t border-[#1e1e24]/50"
        >
          View All Rankings
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth={2}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
