// Gamification system - achievements, streaks, leaderboards, contests
// Makes building cars and sharing builds more addictive and rewarding

import { supabase } from './supabase'

// ===== ACHIEVEMENTS =====
export interface Achievement {
  id: string
  icon: string
  name: string
  description: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  points: number
  category: 'social' | 'creator' | 'engagement' | 'mastery' | 'special'
  requirement: {
    type: 'posts' | 'likes' | 'comments' | 'followers' | 'saves' | 'shares' | 'streak' | 'featured'
    count: number
  }
  unlockedAt?: string
  progress: number
  maxProgress: number
}

export const ACHIEVEMENTS: Achievement[] = [
  // Social achievements
  { id: 'first_post', icon: '🚗', name: 'First Build', description: 'Share your first car build', tier: 'bronze', points: 10, category: 'creator', requirement: { type: 'posts', count: 1 }, progress: 0, maxProgress: 1 },
  { id: 'rising_star', icon: '⭐', name: 'Rising Star', description: 'Get 100 likes on your builds', tier: 'silver', points: 50, category: 'social', requirement: { type: 'likes', count: 100 }, progress: 0, maxProgress: 100 },
  { id: 'influencer', icon: '💫', name: 'Influencer', description: 'Reach 1,000 followers', tier: 'gold', points: 200, category: 'social', requirement: { type: 'followers', count: 1000 }, progress: 0, maxProgress: 1000 },
  { id: 'celebrity', icon: '🏆', name: 'Car Celebrity', description: 'Reach 10,000 followers', tier: 'platinum', points: 500, category: 'social', requirement: { type: 'followers', count: 10000 }, progress: 0, maxProgress: 10000 },
  { id: 'legend', icon: '👑', name: 'Legend', description: 'Reach 100,000 followers', tier: 'diamond', points: 2000, category: 'social', requirement: { type: 'followers', count: 100000 }, progress: 0, maxProgress: 100000 },
  
  // Creator achievements
  { id: 'pro_builder', icon: '🔧', name: 'Pro Builder', description: 'Publish 10 builds', tier: 'silver', points: 75, category: 'creator', requirement: { type: 'posts', count: 10 }, progress: 0, maxProgress: 10 },
  { id: 'master_builder', icon: '🏎️', name: 'Master Builder', description: 'Publish 50 builds', tier: 'gold', points: 250, category: 'creator', requirement: { type: 'posts', count: 50 }, progress: 0, maxProgress: 50 },
  { id: 'serial_builder', icon: '🏭', name: 'Serial Builder', description: 'Publish 100 builds', tier: 'platinum', points: 500, category: 'creator', requirement: { type: 'posts', count: 100 }, progress: 0, maxProgress: 100 },
  
  // Engagement achievements
  { id: 'helpful', icon: '💬', name: 'Helpful', description: 'Leave 50 comments', tier: 'bronze', points: 25, category: 'engagement', requirement: { type: 'comments', count: 50 }, progress: 0, maxProgress: 50 },
  { id: 'supporter', icon: '❤️', name: 'Supporter', description: 'Like 500 builds', tier: 'silver', points: 75, category: 'engagement', requirement: { type: 'likes', count: 500 }, progress: 0, maxProgress: 500 },
  { id: 'curator', icon: '📌', name: 'Curator', description: 'Save 100 builds to your collection', tier: 'silver', points: 75, category: 'engagement', requirement: { type: 'saves', count: 100 }, progress: 0, maxProgress: 100 },
  { id: 'spreader', icon: '📢', name: 'Spreader', description: 'Share 50 builds', tier: 'silver', points: 75, category: 'engagement', requirement: { type: 'shares', count: 50 }, progress: 0, maxProgress: 50 },
  
  // Streak achievements
  { id: 'week_warrior', icon: '🔥', name: 'Week Warrior', description: '7-day streak', tier: 'bronze', points: 50, category: 'mastery', requirement: { type: 'streak', count: 7 }, progress: 0, maxProgress: 7 },
  { id: 'month_master', icon: '📅', name: 'Month Master', description: '30-day streak', tier: 'gold', points: 300, category: 'mastery', requirement: { type: 'streak', count: 30 }, progress: 0, maxProgress: 30 },
  { id: 'dedication', icon: '💎', name: 'Dedication', description: '100-day streak', tier: 'diamond', points: 1000, category: 'mastery', requirement: { type: 'streak', count: 100 }, progress: 0, maxProgress: 100 },
  
  // Special achievements
  { id: 'botw_winner', icon: '🏅', name: 'Build of the Week', description: 'Win Build of the Week', tier: 'gold', points: 500, category: 'special', requirement: { type: 'featured', count: 1 }, progress: 0, maxProgress: 1 },
  { id: 'viral', icon: '🚀', name: 'Viral', description: 'Get 10,000 views on a single build', tier: 'platinum', points: 750, category: 'special', requirement: { type: 'featured', count: 1 }, progress: 0, maxProgress: 1 },
  { id: 'pioneer', icon: '🌟', name: 'Pioneer', description: 'One of the first 100 users', tier: 'platinum', points: 1000, category: 'special', requirement: { type: 'featured', count: 1 }, progress: 0, maxProgress: 1 },
]

export function getTierColor(tier: Achievement['tier']) {
  const colors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF'
  }
  return colors[tier]
}

export function getTierGradient(tier: Achievement['tier']) {
  const gradients = {
    bronze: 'from-orange-700 to-orange-500',
    silver: 'from-gray-400 to-gray-300',
    gold: 'from-yellow-600 to-yellow-400',
    platinum: 'from-slate-300 to-slate-100',
    diamond: 'from-cyan-400 to-cyan-200'
  }
  return gradients[tier]
}

// ===== STREAK SYSTEM =====
export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string
  totalDaysActive: number
}

export async function updateStreak(userId: string): Promise<StreakData | null> {
  const today = new Date().toISOString().split('T')[0]
  
  const { data: existing } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (!existing) {
    // First time user
    const { data, error } = await supabase
      .from('user_streaks')
      .insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_active_date: today,
        total_days_active: 1
      })
      .select()
      .single()
    
    if (error) return null
    return {
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
      totalDaysActive: 1
    }
  }
  
  const lastActive = new Date(existing.last_active_date)
  const todayDate = new Date(today)
  const diffDays = Math.floor((todayDate.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    // Already active today
    return {
      currentStreak: existing.current_streak,
      longestStreak: existing.longest_streak,
      lastActiveDate: existing.last_active_date,
      totalDaysActive: existing.total_days_active
    }
  }
  
  if (diffDays === 1) {
    // Continuing streak
    const newStreak = existing.current_streak + 1
    const { data } = await supabase
      .from('user_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, existing.longest_streak),
        last_active_date: today,
        total_days_active: existing.total_days_active + 1
      })
      .eq('user_id', userId)
      .select()
      .single()
    
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, existing.longest_streak),
      lastActiveDate: today,
      totalDaysActive: existing.total_days_active + 1
    }
  }
  
  // Streak broken
  const { data } = await supabase
    .from('user_streaks')
    .update({
      current_streak: 1,
      last_active_date: today,
      total_days_active: existing.total_days_active + 1
    })
    .eq('user_id', userId)
    .select()
    .single()
  
  return {
    currentStreak: 1,
    longestStreak: existing.longest_streak,
    lastActiveDate: today,
    totalDaysActive: existing.total_days_active + 1
  }
}

// ===== LEADERBOARDS =====
export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  handle: string
  avatarUrl?: string
  score: number
  stats: {
    posts: number
    followers: number
    likes: number
    achievements: number
  }
  isVerified: boolean
}

export async function getLeaderboard(
  category: 'overall' | 'creators' | 'influencers' | 'engagers' = 'overall',
  limit: number = 50
): Promise<LeaderboardEntry[]> {
  // Calculate scores based on category
  let query = supabase
    .from('profiles')
    .select(`
      id,
      username,
      handle,
      avatar_url,
      verified,
      followers_count,
      posts_count,
      total_likes_received,
      total_achievements,
      engagement_score
    `)
    .order(category === 'creators' ? 'posts_count' : 
           category === 'influencers' ? 'followers_count' : 
           category === 'engagers' ? 'engagement_score' : 'engagement_score', 
           { ascending: false })
    .limit(limit)
  
  const { data, error } = await query
  
  if (error || !data) return []
  
  return data.map((profile: any, index: number) => {
    // Calculate weighted score
    let score = 0
    if (category === 'overall') {
      score = (profile.posts_count * 10) + 
              (profile.followers_count * 5) + 
              (profile.total_likes_received * 2) + 
              (profile.total_achievements * 100)
    } else if (category === 'creators') {
      score = profile.posts_count * 50 + profile.total_likes_received
    } else if (category === 'influencers') {
      score = profile.followers_count * 10 + profile.total_likes_received * 2
    } else if (category === 'engagers') {
      score = profile.engagement_score || 0
    }
    
    return {
      rank: index + 1,
      userId: profile.id,
      username: profile.username,
      handle: profile.handle,
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
}

// ===== CONTESTS =====
export interface Contest {
  id: string
  title: string
  description: string
  theme: string
  startDate: string
  endDate: string
  prizes: Prize[]
  rules: string[]
  entries: number
  isActive: boolean
  featuredImage?: string
}

export interface Prize {
  rank: number
  title: string
  description: string
  value: string
  icon: string
}

export const ACTIVE_CONTESTS: Contest[] = [
  {
    id: 'jdm-legends-2024',
    title: 'JDM Legends 2024',
    description: 'Show us your best Japanese Domestic Market builds. From classic RX-7s to modern Supras, we want to see them all!',
    theme: 'JDM',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    prizes: [
      { rank: 1, title: 'Grand Champion', description: 'Featured on homepage for 30 days + $500 gift card', value: '$500', icon: '🏆' },
      { rank: 2, title: 'Runner Up', description: 'Featured on homepage for 14 days + $250 gift card', value: '$250', icon: '🥈' },
      { rank: 3, title: 'Third Place', description: 'Featured on homepage for 7 days + $100 gift card', value: '$100', icon: '🥉' }
    ],
    rules: [
      'Must be a JDM vehicle',
      'Build must be published during contest period',
      'Only one entry per user',
      'Must include at least 3 photos'
    ],
    entries: 247,
    isActive: true,
    featuredImage: '/contests/jdm-2024.jpg'
  },
  {
    id: 'stance-wars-2024',
    title: 'Stance Wars',
    description: 'Fitment is everything. Bring your lowest, widest, most aggressive stance setups.',
    theme: 'Stance',
    startDate: '2024-02-01',
    endDate: '2024-02-29',
    prizes: [
      { rank: 1, title: 'Stance King', description: 'Sponsored coilover set + feature', value: '$1200', icon: '👑' },
      { rank: 2, title: 'Fitment Master', description: 'Wheel set sponsorship', value: '$800', icon: '🔧' },
      { rank: 3, title: 'Aggressive', description: 'Tire sponsorship', value: '$400', icon: '🛞' }
    ],
    rules: [
      'Must demonstrate extreme fitment',
      'Photos must show wheel/tire setup clearly',
      'Build specs must be listed'
    ],
    entries: 156,
    isActive: true
  }
]

// ===== XP & LEVELING =====
export function calculateLevel(totalXP: number): { level: number; currentXP: number; xpToNext: number; title: string } {
  // Level formula: each level requires 20% more XP than previous
  // Level 1: 0-100
  // Level 2: 100-240 (100 * 1.2 + 100)
  // Level 3: 240-420 (140 * 1.2 + 100)
  
  let level = 1
  let xpNeeded = 100
  let accumulatedXP = 0
  
  while (totalXP >= accumulatedXP + xpNeeded) {
    accumulatedXP += xpNeeded
    level++
    xpNeeded = Math.floor(xpNeeded * 1.2)
  }
  
  const titles = [
    'Rookie', 'Novice', 'Enthusiast', 'Tuner', 'Mechanic',
    'Builder', 'Specialist', 'Expert', 'Master', 'Legend',
    'Icon', 'Pioneer', 'Visionary', 'Prodigy', 'Immortal'
  ]
  
  return {
    level,
    currentXP: totalXP - accumulatedXP,
    xpToNext: xpNeeded,
    title: titles[Math.min(level - 1, titles.length - 1)]
  }
}

// XP rewards
export const XP_REWARDS = {
  POST_CREATED: 50,
  POST_LIKED: 5,
  COMMENT_POSTED: 10,
  PROFILE_FOLLOWED: 20,
  BUILD_SAVED: 5,
  BUILD_SHARED: 15,
  STORY_POSTED: 25,
  ACHIEVEMENT_UNLOCKED: 100,
  STREAK_DAY: 10, // Multiplied by streak length
  DAILY_LOGIN: 20
}

export async function awardXP(userId: string, action: keyof typeof XP_REWARDS, multiplier: number = 1): Promise<number> {
  const baseXP = XP_REWARDS[action]
  const xpAwarded = Math.floor(baseXP * multiplier)
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', userId)
    .single()
  
  const newXP = (profile?.total_xp || 0) + xpAwarded
  
  await supabase
    .from('profiles')
    .update({ total_xp: newXP })
    .eq('id', userId)
  
  // Log XP gain
  await supabase
    .from('xp_history')
    .insert({
      user_id: userId,
      action,
      xp_gained: xpAwarded,
      multiplier
    })
  
  return newXP
}
