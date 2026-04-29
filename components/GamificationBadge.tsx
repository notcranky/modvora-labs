'use client'

import { motion } from 'framer-motion'
import { Achievement, getTierColor, getTierGradient } from '@/lib/gamification'

interface GamificationBadgeProps {
  achievement?: Achievement
  level?: number
  streak?: number
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export function AchievementBadge({ 
  achievement, 
  size = 'md',
  showTooltip = true 
}: { achievement: Achievement } & Omit<GamificationBadgeProps, 'achievement'>) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-2xl'
  }

  const progress = achievement.progress / achievement.maxProgress
  const isComplete = progress >= 1

  return (
    <div className="relative group">
      <motion.div
        className={`
          ${sizeClasses[size]}
          rounded-full flex items-center justify-center
          ${isComplete 
            ? `bg-gradient-to-br ${getTierGradient(achievement.tier)}` 
            : 'bg-[#2a2a30]'
          }
          ${isComplete ? 'shadow-lg shadow-purple-500/20' : ''}
          cursor-help
        `}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className={isComplete ? '' : 'grayscale opacity-50'}>
          {achievement.icon}
        </span>
        
        {/* Progress ring for incomplete */}
        {!isComplete && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="#3a3a45"
              strokeWidth="8%"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke={getTierColor(achievement.tier)}
              strokeWidth="8%"
              strokeDasharray={`${progress * 283} 283`}
              className="transition-all duration-500"
            />
          </svg>
        )}
      </motion.div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-[#16161a] border border-[#2a2a30] rounded-xl p-3 whitespace-nowrap shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{achievement.icon}</span>
              <span className="font-semibold text-white">{achievement.name}</span>
              <span 
                className="text-xs px-1.5 py-0.5 rounded-full uppercase font-bold"
                style={{ 
                  backgroundColor: `${getTierColor(achievement.tier)}33`,
                  color: getTierColor(achievement.tier)
                }}
              >
                {achievement.tier}
              </span>
            </div>
            <p className="text-sm text-zinc-400">{achievement.description}</p>
            {!isComplete && (
              <div className="mt-2 text-xs text-zinc-500">
                {achievement.progress} / {achievement.maxProgress}
              </div>
            )}
            {isComplete && (
              <div className="mt-1 text-xs text-green-400 font-medium">
                ✓ Unlocked! +{achievement.points} XP
              </div>
            )}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-[#16161a] border-r border-b border-[#2a2a30] rotate-45" />
          </div>
        </div>
      )}
    </div>
  )
}

export function LevelBadge({ level, size = 'md' }: { level: number } & GamificationBadgeProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg'
  }

  // Color based on level
  const getLevelColor = (level: number) => {
    if (level >= 50) return 'from-pink-500 to-purple-600'
    if (level >= 40) return 'from-purple-500 to-indigo-600'
    if (level >= 30) return 'from-blue-500 to-purple-500'
    if (level >= 20) return 'from-cyan-500 to-blue-500'
    if (level >= 10) return 'from-green-500 to-cyan-500'
    return 'from-zinc-600 to-zinc-500'
  }

  return (
    <div className="relative group">
      <div className={`
        ${sizeClasses[size]}
        rounded-lg flex items-center justify-center
        bg-gradient-to-br ${getLevelColor(level)}
        text-white font-bold shadow-lg
      `}>
        {level}
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-[#16161a] border border-[#2a2a30] rounded-lg px-2 py-1 text-xs text-white whitespace-nowrap">
          Level {level}
        </div>
      </div>
    </div>
  )
}

export function StreakBadge({ streak, size = 'md' }: { streak: number } & GamificationBadgeProps) {
  const sizeClasses = {
    sm: 'text-sm gap-1',
    md: 'text-base gap-1.5',
    lg: 'text-lg gap-2'
  }

  const getFireColor = (streak: number) => {
    if (streak >= 100) return '🔥🔥🔥'
    if (streak >= 30) return '🔥🔥'
    if (streak >= 7) return '🔥'
    return '⚡'
  }

  return (
    <div className={`flex items-center ${sizeClasses[size]} text-orange-400`}>
      <span>{getFireColor(streak)}</span>
      <span className="font-semibold">{streak}</span>
      <span className="text-zinc-500 text-xs">day streak</span>
    </div>
  )
}

export function XPBar({ current, toNext, total }: { current: number; toNext: number; total: number }) {
  const progress = current / toNext

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-zinc-400">
        <span>{total.toLocaleString()} XP total</span>
        <span>{toNext - current} to next level</span>
      </div>
      <div className="h-2 bg-[#2a2a30] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

export function RankBadge({ rank, size = 'md' }: { rank: number } & GamificationBadgeProps) {
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { bg: 'from-yellow-400 to-orange-500', text: '#FFD700', label: '🥇' }
    if (rank === 2) return { bg: 'from-gray-300 to-gray-400', text: '#C0C0C0', label: '🥈' }
    if (rank === 3) return { bg: 'from-orange-600 to-orange-400', text: '#CD7F32', label: '🥉' }
    if (rank <= 10) return { bg: 'from-purple-600 to-purple-400', text: '#a855f7', label: '💎' }
    if (rank <= 50) return { bg: 'from-blue-600 to-blue-400', text: '#3b82f6', label: '🏆' }
    return { bg: 'from-zinc-600 to-zinc-500', text: '#71717a', label: '🎯' }
  }

  const style = getRankStyle(rank)
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <div className={`
      inline-flex items-center gap-1.5 rounded-full font-bold
      ${sizeClasses[size]}
      bg-gradient-to-r ${style.bg}
      text-white
    `}>
      <span>{style.label}</span>
      <span>#{rank}</span>
    </div>
  )
}
