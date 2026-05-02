// Leaderboards System — Rankings across multiple categories

import { CommunityPostWithVehicle } from './community'
import { getBuilderXP } from './builder-levels'

export type LeaderboardCategory = 
  | 'most_liked_builds'
  | 'top_builders'
  | 'highest_hp'
  | 'biggest_budget'
  | 'most_commented'
  | 'rising_stars'
  | 'battle_winners'

export interface LeaderboardEntry {
  rank: number
  id: string
  name: string
  handle: string
  avatar?: string
  value: number
  valueLabel: string
  secondaryValue?: string
  change?: 'up' | 'down' | 'same'
  trend?: number // Position change from last week
}

export interface Leaderboard {
  category: LeaderboardCategory
  title: string
  description: string
  updatedAt: string
  entries: LeaderboardEntry[]
}

// Mock data for demonstration
const MOCK_LEADERBOARDS: Record<LeaderboardCategory, LeaderboardEntry[]> = {
  most_liked_builds: [
    { rank: 1, id: 'post-m2-voltage', name: 'M2 Voltage — The Track Weapon', handle: 'jordan_chen', value: 847, valueLabel: 'likes', secondaryValue: 'S55 Swapped M2', change: 'same' },
    { rank: 2, id: 'post-gr86-midnight', name: 'GR86 Midnight Street Build', handle: 'alex_mitchell', value: 623, valueLabel: 'likes', secondaryValue: 'Toyota GR86', change: 'up', trend: 2 },
    { rank: 3, id: 'build-3', name: 'Boosted BRZ Daily', handle: 'sam_rodriguez', value: 412, valueLabel: 'likes', secondaryValue: 'Subaru BRZ', change: 'down', trend: 1 },
    { rank: 4, id: 'build-4', name: 'Civic Type R Track Setup', handle: 'honda_fanatic', value: 389, valueLabel: 'likes', secondaryValue: 'FK8 Civic', change: 'up', trend: 3 },
    { rank: 5, id: 'build-5', name: '370Z Twin Turbo Build', handle: 'z_nation', value: 356, valueLabel: 'likes', secondaryValue: 'Nissan 370Z', change: 'same' },
  ],
  top_builders: [
    { rank: 1, id: 'user-jordan', name: 'Jordan Chen', handle: 'jordan_chen', value: 2840, valueLabel: 'XP', secondaryValue: 'Dyno King', avatar: 'JC', change: 'same' },
    { rank: 2, id: 'user-alex', name: 'Alex Mitchell', handle: 'alex_mitchell', value: 2150, valueLabel: 'XP', secondaryValue: 'Build Legend', avatar: 'AM', change: 'up', trend: 1 },
    { rank: 3, id: 'user-sam', name: 'Sam Rodriguez', handle: 'sam_rodriguez', value: 1890, valueLabel: 'XP', secondaryValue: 'Track Day Hero', avatar: 'SR', change: 'down', trend: 1 },
    { rank: 4, id: 'user-taylor', name: 'Taylor Wong', handle: 'taylor_wong', value: 1560, valueLabel: 'XP', secondaryValue: 'Speed Demon', avatar: 'TW', change: 'same' },
    { rank: 5, id: 'user-casey', name: 'Casey Kim', handle: 'casey_kim', value: 1240, valueLabel: 'XP', secondaryValue: 'Build Veteran', avatar: 'CK', change: 'up', trend: 2 },
  ],
  highest_hp: [
    { rank: 1, id: 'build-6', name: 'GTR Alpha 9 Build', handle: 'boosted_gtr', value: 985, valueLabel: 'WHP', secondaryValue: 'Nissan GTR R35', change: 'same' },
    { rank: 2, id: 'post-m2-voltage', name: 'M2 Voltage — The Track Weapon', handle: 'jordan_chen', value: 642, valueLabel: 'WHP', secondaryValue: 'BMW M2', change: 'same' },
    { rank: 3, id: 'build-7', name: 'Supra A90 800HP', handle: 'supra_king', value: 812, valueLabel: 'WHP', secondaryValue: 'Toyota Supra', change: 'up', trend: 1 },
    { rank: 4, id: 'build-8', name: 'Mustang GT Supercharged', handle: 'american_muscle', value: 756, valueLabel: 'WHP', secondaryValue: 'Ford Mustang', change: 'down', trend: 1 },
    { rank: 5, id: 'build-9', name: 'Camaro SS Procharged', handle: 'camaro_zl1', value: 698, valueLabel: 'WHP', secondaryValue: 'Chevy Camaro', change: 'same' },
  ],
  biggest_budget: [
    { rank: 1, id: 'build-10', name: 'GTR Money Pit', handle: 'boosted_gtr', value: 85000, valueLabel: 'spent', secondaryValue: '$85k invested', change: 'same' },
    { rank: 2, id: 'build-11', name: 'R8 V10 Plus Build', handle: 'audi_enthusiast', value: 72000, valueLabel: 'spent', secondaryValue: '$72k invested', change: 'up', trend: 1 },
    { rank: 3, id: 'build-12', name: '911 Turbo S Project', handle: 'porsche_fan', value: 65000, valueLabel: 'spent', secondaryValue: '$65k invested', change: 'same' },
    { rank: 4, id: 'post-m2-voltage', name: 'M2 Voltage — The Track Weapon', handle: 'jordan_chen', value: 45000, valueLabel: 'spent', secondaryValue: '$45k invested', change: 'down', trend: 1 },
    { rank: 5, id: 'build-13', name: 'C63 AMG Widebody', handle: 'benz_lover', value: 38000, valueLabel: 'spent', secondaryValue: '$38k invested', change: 'up', trend: 2 },
  ],
  most_commented: [
    { rank: 1, id: 'post-gr86-midnight', name: 'GR86 Midnight Street Build', handle: 'alex_mitchell', value: 142, valueLabel: 'comments', secondaryValue: 'High engagement', change: 'up', trend: 1 },
    { rank: 2, id: 'build-14', name: 'Budget Turbo Miata', handle: 'miata_mike', value: 128, valueLabel: 'comments', secondaryValue: 'Hot debate', change: 'same' },
    { rank: 3, id: 'post-m2-voltage', name: 'M2 Voltage — The Track Weapon', handle: 'jordan_chen', value: 98, valueLabel: 'comments', secondaryValue: 'Track discussions', change: 'down', trend: 1 },
    { rank: 4, id: 'build-15', name: 'E30 M3 Restoration', handle: 'classic_bmw', value: 87, valueLabel: 'comments', secondaryValue: 'Advice requests', change: 'up', trend: 3 },
    { rank: 5, id: 'build-16', name: '240Z V8 Swap', handle: 'datsun_dave', value: 76, valueLabel: 'comments', secondaryValue: 'Swapping talk', change: 'same' },
  ],
  rising_stars: [
    { rank: 1, id: 'user-new-1', name: 'Mia Johnson', handle: 'mia_j', value: 340, valueLabel: 'XP gained', secondaryValue: '+340 this week', avatar: 'MJ', change: 'up', trend: 5 },
    { rank: 2, id: 'user-new-2', name: 'Ryan Park', handle: 'ryan_park', value: 290, valueLabel: 'XP gained', secondaryValue: '+290 this week', avatar: 'RP', change: 'up', trend: 4 },
    { rank: 3, id: 'user-new-3', name: 'Chris Lee', handle: 'chris_lee', value: 245, valueLabel: 'XP gained', secondaryValue: '+245 this week', avatar: 'CL', change: 'up', trend: 3 },
    { rank: 4, id: 'user-new-4', name: 'Avery Smith', handle: 'avery_s', value: 198, valueLabel: 'XP gained', secondaryValue: '+198 this week', avatar: 'AS', change: 'up', trend: 2 },
    { rank: 5, id: 'user-new-5', name: 'Jordan Kim', handle: 'jordan_k', value: 165, valueLabel: 'XP gained', secondaryValue: '+165 this week', avatar: 'JK', change: 'up', trend: 1 },
  ],
  battle_winners: [
    { rank: 1, id: 'user-jordan', name: 'Jordan Chen', handle: 'jordan_chen', value: 47, valueLabel: 'wins', secondaryValue: '87% win rate', avatar: 'JC', change: 'same' },
    { rank: 2, id: 'user-alex', name: 'Alex Mitchell', handle: 'alex_mitchell', value: 38, valueLabel: 'wins', secondaryValue: '82% win rate', avatar: 'AM', change: 'same' },
    { rank: 3, id: 'user-sam', name: 'Sam Rodriguez', handle: 'sam_rodriguez', value: 31, valueLabel: 'wins', secondaryValue: '79% win rate', avatar: 'SR', change: 'up', trend: 1 },
    { rank: 4, id: 'user-taylor', name: 'Taylor Wong', handle: 'taylor_wong', value: 24, valueLabel: 'wins', secondaryValue: '71% win rate', avatar: 'TW', change: 'down', trend: 1 },
    { rank: 5, id: 'user-casey', name: 'Casey Kim', handle: 'casey_kim', value: 19, valueLabel: 'wins', secondaryValue: '68% win rate', avatar: 'CK', change: 'same' },
  ],
}

const LEADERBOARD_META: Record<LeaderboardCategory, { title: string; description: string }> = {
  most_liked_builds: { 
    title: 'Most Liked Builds', 
    description: 'Community favorites with the most hearts' 
  },
  top_builders: { 
    title: 'Top Builders', 
    description: 'Builders ranked by total XP earned' 
  },
  highest_hp: { 
    title: 'Highest Horsepower', 
    description: 'Pushing engines to the limit' 
  },
  biggest_budget: { 
    title: 'Biggest Budgets', 
    description: 'Most invested in their builds' 
  },
  most_commented: { 
    title: 'Most Discussed', 
    description: 'Builds sparking the most conversation' 
  },
  rising_stars: { 
    title: 'Rising Stars', 
    description: 'Builders gaining XP fastest this week' 
  },
  battle_winners: { 
    title: 'Battle Champions', 
    description: 'Winners of head-to-head build battles' 
  },
}

export function getLeaderboard(category: LeaderboardCategory): Leaderboard {
  const meta = LEADERBOARD_META[category]
  return {
    category,
    title: meta.title,
    description: meta.description,
    updatedAt: new Date().toISOString(),
    entries: MOCK_LEADERBOARDS[category],
  }
}

export function getAllLeaderboards(): Leaderboard[] {
  return Object.keys(LEADERBOARD_META).map((cat) => 
    getLeaderboard(cat as LeaderboardCategory)
  )
}

export function formatLeaderboardValue(value: number, label: string): string {
  if (label === 'spent' || label === 'invested') {
    return `$${(value / 1000).toFixed(1)}k`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }
  return value.toString()
}

export function getRankBadge(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return rank.toString()
}

export function getRankColor(rank: number): string {
  if (rank === 1) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
  if (rank === 2) return 'text-zinc-300 bg-zinc-400/10 border-zinc-400/20'
  if (rank === 3) return 'text-amber-600 bg-amber-600/10 border-amber-600/20'
  return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20'
}
