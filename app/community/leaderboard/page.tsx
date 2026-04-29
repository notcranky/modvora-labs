'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { RankBadge, LevelBadge, AchievementBadge } from '@/components/GamificationBadge'
import { StreakBadge } from '@/components/GamificationBadge'
import { FeedSkeleton } from '@/components/ui/Skeleton'
import { calculateLevel, ACHIEVEMENTS, getTierGradient } from '@/lib/gamification'
import type { LeaderboardEntry } from '@/lib/gamification'

// Icons
const TrophyIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 11c2.21 0 4-1.79 4-4V5H8v2c0 2.21 1.79 4 4 4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 7h4M3 7h4" /></svg>
const TrendingUpIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
const UsersIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
const HeartIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>

const categories = [
  { id: 'overall', label: 'Overall', icon: TrophyIcon, description: 'Top builders by total influence' },
  { id: 'creators', label: 'Creators', icon: TrendingUpIcon, description: 'Most published builds' },
  { id: 'influencers', label: 'Influencers', icon: UsersIcon, description: 'Most followers' },
  { id: 'engagers', label: 'Engagers', icon: HeartIcon, description: 'Most engagement given' },
]

const timeframes = [
  { id: 'all', label: 'All Time' },
  { id: 'month', label: 'This Month' },
  { id: 'week', label: 'This Week' },
]

function TopThree({ entries }: { entries: LeaderboardEntry[] }) {
  const top3 = entries.slice(0, 3)
  
  const positions = [
    { rank: 2, offset: 'translate-y-8', size: 'w-24 h-24', label: '2nd', color: 'from-gray-400 to-gray-300' },
    { rank: 1, offset: 'translate-y-0', size: 'w-32 h-32', label: '1st', color: 'from-yellow-400 to-yellow-500' },
    { rank: 3, offset: 'translate-y-12', size: 'w-20 h-20', label: '3rd', color: 'from-orange-600 to-orange-500' },
  ]

  return (
    <div className="flex items-end justify-center gap-4 md:gap-8 py-8 px-4">
      {[1, 0, 2].map((idx) => {
        const entry = top3[idx]
        if (!entry) return null
        
        const pos = positions[idx]
        const level = calculateLevel(entry.score * 10) // Approximate XP from score
        
        return (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`flex flex-col items-center ${pos.offset}`}
          >
            {/* Avatar */}
            <div className="relative">
              <div className={`${pos.size} rounded-full bg-gradient-to-br ${pos.color} p-1`}>
                <div className="w-full h-full rounded-full bg-[#16161a] p-1">
                  <img
                    src={entry.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${entry.username}`}
                    alt={entry.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              
              {/* Rank badge */}
              <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r ${pos.color} text-white font-bold text-sm shadow-lg`}>
                {pos.label}
              </div>
              
              {/* Crown for #1 */}
              {pos.rank === 1 && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
                  👑
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="mt-4 text-center">
              <Link 
                href={`/community/profile/${entry.handle}`}
                className="font-bold text-white hover:text-purple-400 transition-colors block"
              >
                {entry.username}
              </Link>
              <p className="text-sm text-zinc-500">@{entry.handle}</p>
              
              <div className="flex items-center justify-center gap-2 mt-2">
                <LevelBadge level={level.level} size="sm" />
                {entry.isVerified && (
                  <span className="text-yellow-500 text-xs">✓ Verified</span>
                )}
              </div>
              
              <div className="mt-3 bg-[#1a1a20] rounded-xl px-4 py-2">
                <p className="text-2xl font-bold text-white">
                  {entry.score.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500">points</p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const level = calculateLevel(entry.score * 10)
  const isTop3 = index < 3
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        flex items-center gap-4 p-4 rounded-xl transition-all
        ${isTop3 ? 'bg-gradient-to-r from-purple-600/20 to-transparent border border-purple-500/30' : 'hover:bg-[#1a1a20]'}
      `}
    >
      {/* Rank */}
      <div className="w-12 text-center">
        <RankBadge rank={index + 1} size="sm" />
      </div>
      
      {/* Avatar */}
      <Link href={`/community/profile/${entry.handle}`}>
        <img
          src={entry.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${entry.username}`}
          alt={entry.username}
          className="w-12 h-12 rounded-full bg-zinc-800 object-cover hover:ring-2 hover:ring-purple-500/50 transition-all"
        />
      </Link>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link 
            href={`/community/profile/${entry.handle}`}
            className="font-semibold text-white hover:text-purple-400 transition-colors truncate"
          >
            {entry.username}
          </Link>
          {entry.isVerified && (
            <span className="text-yellow-500 text-xs">✓</span>
          )}
          <LevelBadge level={level.level} size="sm" />
        </div>
        <p className="text-sm text-zinc-500 truncate">@{entry.handle}</p>
      </div>
      
      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="font-semibold text-white">{entry.stats.posts}</p>
          <p className="text-xs text-zinc-500">builds</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-white">{entry.stats.followers}</p>
          <p className="text-xs text-zinc-500">followers</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-white">{entry.stats.likes.toLocaleString()}</p>
          <p className="text-xs text-zinc-500">likes</p>
        </div>
      </div>
      
      {/* Score */}
      <div className="text-right min-w-[80px]">
        <p className="text-lg font-bold text-white">{entry.score.toLocaleString()}</p>
        <p className="text-xs text-zinc-500">pts</p>
      </div>
    </motion.div>
  )
}

function UserStatsCard({ userId }: { userId: string }) {
  const [stats, setStats] = useState<any>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  
  useEffect(() => {
    if (!userId) return
    
    // Load user stats
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (data) {
          setStats(data)
        }
      })
    
    // Load achievements
    supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (data) {
          const userAchievements = data.map(a => {
            const achievement = ACHIEVEMENTS.find(ach => ach.id === a.achievement_id)
            if (achievement) {
              return { ...achievement, unlockedAt: a.unlocked_at, progress: achievement.maxProgress }
            }
            return null
          }).filter(Boolean)
          setAchievements(userAchievements)
        }
      })
  }, [userId])
  
  if (!stats) return null
  
  const level = calculateLevel(stats.total_xp || 0)
  
  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-[#16161a] border border-purple-500/30 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <img
          src={stats.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${stats.username}`}
          alt={stats.username}
          className="w-16 h-16 rounded-full bg-zinc-800 object-cover"
        />
        <div className="flex-1">
          <h3 className="font-bold text-white text-lg">Your Stats</h3>
          <p className="text-zinc-400">@{stats.handle || stats.username}</p>
          
          <div className="flex items-center gap-3 mt-3">
            <LevelBadge level={level.level} size="md" />
            <StreakBadge streak={stats.current_streak || 0} size="sm" />
          </div>
        </div>
      </div>
      
      {/* XP Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-zinc-400">Level {level.level} - {level.title}</span>
          <span className="text-zinc-400">{level.xpToNext - level.currentXP} to next</span>
        </div>
        <div className="h-2 bg-[#2a2a30] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
            initial={{ width: 0 }}
            animate={{ width: `${(level.currentXP / level.xpToNext) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-1">{stats.total_xp?.toLocaleString() || 0} total XP</p>
      </div>
      
      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-zinc-400 mb-2">Recent Achievements</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {achievements.slice(0, 5).map(a => (
              <AchievementBadge key={a.id} achievement={a} size="sm" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [category, setCategory] = useState('overall')
  const [timeframe, setTimeframe] = useState('all')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userRank, setUserRank] = useState<number | null>(null)
  
  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null)
    })
  }, [])
  
  useEffect(() => {
    loadLeaderboard()
  }, [category, timeframe])
  
  const loadLeaderboard = async () => {
    setLoading(true)
    
    // Build query based on category
    let orderField = 'engagement_score'
    if (category === 'creators') orderField = 'posts_count'
    if (category === 'influencers') orderField = 'followers_count'
    
    // Get timeframe filter
    let timeFilter = ''
    if (timeframe === 'week') {
      timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    } else if (timeframe === 'month') {
      timeFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
    
    let query = supabase
      .from('profiles')
      .select('*')
      .order(orderField, { ascending: false })
      .limit(100)
    
    if (timeFilter) {
      query = query.gt('updated_at', timeFilter)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error loading leaderboard:', error)
      setLoading(false)
      return
    }
    
    const leaderboardData: LeaderboardEntry[] = (data || []).map((profile: any, index: number) => {
      // Calculate score based on category
      let score = 0
      if (category === 'overall') {
        score = (profile.posts_count || 0) * 100 + 
                (profile.followers_count || 0) * 10 + 
                (profile.total_likes_received || 0)
      } else if (category === 'creators') {
        score = (profile.posts_count || 0) * 100
      } else if (category === 'influencers') {
        score = (profile.followers_count || 0) * 10
      } else if (category === 'engagers') {
        score = profile.engagement_score || 0
      }
      
      return {
        rank: index + 1,
        userId: profile.id,
        username: profile.username || 'Unknown',
        handle: profile.handle || profile.username || 'unknown',
        avatarUrl: profile.avatar_url,
        score,
        stats: {
          posts: profile.posts_count || 0,
          followers: profile.followers_count || 0,
          likes: profile.total_likes_received || 0,
          achievements: profile.total_achievements || 0
        },
        isVerified: profile.verified
      }
    })
    
    // Re-sort by calculated score
    leaderboardData.sort((a, b) => b.score - a.score)
    
    // Update ranks after sorting
    leaderboardData.forEach((entry, idx) => {
      entry.rank = idx + 1
    })
    
    setEntries(leaderboardData)
    
    // Find user's rank
    if (userId) {
      const userEntry = leaderboardData.find(e => e.userId === userId)
      setUserRank(userEntry?.rank || null)
    }
    
    setLoading(false)
  }
  
  const activeCategory = categories.find(c => c.id === category)
  const ActiveIcon = activeCategory?.icon || TrophyIcon
  
  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0b]/95 backdrop-blur-xl border-b border-[#1e1e24]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
              <TrophyIcon />
            </div>
            <div>
              <h1 className="font-bold text-white text-2xl">Leaderboard</h1>
              <p className="text-zinc-400 text-sm">Top builders in the community</p>
            </div>
          </div>
          
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {categories.map(cat => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                    ${category === cat.id 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                      : 'bg-[#1a1a20] text-zinc-400 hover:text-white hover:bg-[#252530]'
                    }
                  `}
                >
                  <Icon />
                  {cat.label}
                </button>
              )
            })}
          </div>
          
          {/* Timeframe tabs */}
          <div className="flex gap-2 mt-3">
            {timeframes.map(tf => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${timeframe === tf.id 
                    ? 'bg-[#2a2a30] text-white' 
                    : 'text-zinc-500 hover:text-zinc-300'
                  }
                `}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      
      {/* User stats card (if logged in) */}
      {userId && (
        <div className="max-w-4xl mx-auto px-4 py-4">
          <UserStatsCard userId={userId} />
          
          {userRank && (
            <div className="mt-4 text-center">
              <p className="text-zinc-400">
                You are ranked <span className="text-white font-bold">#{userRank}</span> in {activeCategory?.label}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-[#16161a] rounded-xl">
                <div className="w-12 h-8 bg-[#2a2a30] rounded" />
                <div className="w-12 h-12 bg-[#2a2a30] rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 bg-[#2a2a30] rounded" />
                  <div className="w-24 h-3 bg-[#2a2a30] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-white mb-2">No entries yet</h3>
            <p className="text-zinc-400">Be the first to climb the leaderboard!</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="bg-gradient-to-b from-[#16161a] to-[#0a0a0b] rounded-2xl border border-[#2a2a30] p-4 mb-6">
              <TopThree entries={entries} />
            </div>
            
            {/* Category description */}
            <p className="text-center text-zinc-500 text-sm mb-6">
              {activeCategory?.description}
            </p>
            
            {/* Full list */}
            <div className="bg-[#16161a] rounded-2xl border border-[#2a2a30] overflow-hidden">
              <div className="p-4 border-b border-[#2a2a30]">
                <h3 className="font-semibold text-white">All Rankings</h3>
              </div>
              <div className="divide-y divide-[#2a2a30]">
                <AnimatePresence>
                  {entries.map((entry, index) => (
                    <LeaderboardRow 
                      key={entry.userId} 
                      entry={entry} 
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
