// Build Battles — Head-to-head voting between builds

import { CommunityPostWithVehicle } from './community'
import { awardXP } from './builder-levels'

export interface Battle {
  id: string
  buildA: BattleBuild
  buildB: BattleBuild
  theme: string
  startedAt: string
  endsAt: string
  totalVotes: number
  status: 'active' | 'ended'
  winner?: string // build id of winner
}

export interface BattleBuild {
  id: string
  slug: string
  title: string
  image: string
  author: string
  handle: string
  vehicleLabel: string
  hp: number
  tags: string[]
  votes: number
  votePercentage: number
}

export interface UserBattleVote {
  battleId: string
  buildId: string // which build they voted for
  votedAt: string
}

const BATTLES_KEY = 'modvora_battles'
const USER_VOTES_KEY = 'modvora_battle_votes'

// Active battle mock
const MOCK_ACTIVE_BATTLE: Battle = {
  id: 'battle-2026-w17',
  theme: 'Best Daily Driver Track Car',
  startedAt: '2026-04-21T00:00:00Z',
  endsAt: '2026-04-28T23:59:59Z',
  totalVotes: 2847,
  status: 'active',
  buildA: {
    id: 'post-gr86-midnight',
    slug: 'gr86-midnight-street-build',
    title: 'GR86 Midnight Street Build',
    image: '', // Will be filled from post
    author: 'Alex Mitchell',
    handle: 'alex_mitchell',
    vehicleLabel: '2023 Toyota GR86',
    hp: 245,
    tags: ['street', 'daily', 'coilovers', 'wheels'],
    votes: 1534,
    votePercentage: 54,
  },
  buildB: {
    id: 'post-m2-voltage',
    slug: 'm2-voltage-track-weapon',
    title: 'M2 Voltage — The Track Weapon',
    image: '',
    author: 'Jordan Chen',
    handle: 'jordan_chen',
    vehicleLabel: '2020 BMW M2',
    hp: 642,
    tags: ['track', 's55-swap', 'racing', 'aggressive'],
    votes: 1313,
    votePercentage: 46,
  },
}

// Recent battles history
const MOCK_BATTLE_HISTORY: Battle[] = [
  {
    id: 'battle-2026-w16',
    theme: 'Best Budget Turbo Build (Under $10k)',
    startedAt: '2026-04-14T00:00:00Z',
    endsAt: '2026-04-21T00:00:00Z',
    totalVotes: 3156,
    status: 'ended',
    winner: 'build-boosted-brz',
    buildA: {
      id: 'build-boosted-brz',
      slug: 'boosted-brz-budget',
      title: 'Boosted BRZ on a Budget',
      image: '',
      author: 'Sam Rodriguez',
      handle: 'sam_rodriguez',
      vehicleLabel: '2017 Subaru BRZ',
      hp: 320,
      tags: ['turbo', 'budget', 'daily', 'fun'],
      votes: 1872,
      votePercentage: 59,
    },
    buildB: {
      id: 'build-civic-si-turbo',
      slug: 'civic-si-boosted',
      title: 'Civic Si Sleeper Build',
      image: '',
      author: 'Honda Fan',
      handle: 'honda_fanatic',
      vehicleLabel: '2019 Honda Civic Si',
      hp: 310,
      tags: ['sleeper', 'turbo', 'street'],
      votes: 1284,
      votePercentage: 41,
    },
  },
  {
    id: 'battle-2026-w15',
    theme: 'Most Aggressive Stance',
    startedAt: '2026-04-07T00:00:00Z',
    endsAt: '2026-04-14T00:00:00Z',
    totalVotes: 4521,
    status: 'ended',
    winner: 'build-gti-stance',
    buildA: {
      id: 'build-240z-stanced',
      slug: '240z-aggressive-fitment',
      title: '240Z On The Ground',
      image: '',
      author: 'Datsun Dave',
      handle: 'datsun_dave',
      vehicleLabel: '1972 Datsun 240Z',
      hp: 180,
      tags: ['stance', 'classic', 'static'],
      votes: 1987,
      votePercentage: 44,
    },
    buildB: {
      id: 'build-gti-stance',
      slug: 'gti-bagged-static',
      title: 'GTI Air & Static Combo',
      image: '',
      author: 'VW Life',
      handle: 'vw_life',
      vehicleLabel: '2018 VW GTI',
      hp: 290,
      tags: ['stance', 'bagged', 'vw', 'aggressive'],
      votes: 2534,
      votePercentage: 56,
    },
  },
]

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function safeWrite(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function getActiveBattle(): Battle | null {
  // In production, this would check dates and rotate battles
  return MOCK_ACTIVE_BATTLE
}

export function getBattleHistory(): Battle[] {
  const stored = safeRead<Battle[]>(`${BATTLES_KEY}_history`, [])
  return [...MOCK_BATTLE_HISTORY, ...stored].slice(0, 10)
}

export function getUserVotes(): UserBattleVote[] {
  return safeRead<UserBattleVote[]>(USER_VOTES_KEY, [])
}

export function hasVotedInBattle(battleId: string): boolean {
  const votes = getUserVotes()
  return votes.some(v => v.battleId === battleId)
}

export function getUserVoteForBattle(battleId: string): UserBattleVote | null {
  const votes = getUserVotes()
  return votes.find(v => v.battleId === battleId) || null
}

export function voteInBattle(battleId: string, buildId: string): boolean {
  if (hasVotedInBattle(battleId)) return false
  
  const vote: UserBattleVote = {
    battleId,
    buildId,
    votedAt: new Date().toISOString(),
  }
  
  const votes = getUserVotes()
  votes.push(vote)
  safeWrite(USER_VOTES_KEY, votes)
  
  // Award XP to the builder (small amount for participation)
  // In real implementation, this would look up the builder from the build
  
  return true
}

export function getBattleThemes(): string[] {
  return [
    'Best Daily Driver Track Car',
    'Best Budget Turbo Build (Under $10k)',
    'Most Aggressive Stance',
    'Highest HP Per Dollar',
    'Cleanest Engine Bay',
    'Best Track Day Setup',
    'Most Unique Build',
    'Best Restomod',
    'Ultimate Sleeper',
    'Best Interior Mods',
  ]
}

export function getTimeRemaining(endDate: string): { days: number; hours: number; minutes: number } {
  const end = new Date(endDate).getTime()
  const now = Date.now()
  const diff = Math.max(0, end - now)
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return { days, hours, minutes }
}

export function formatTimeRemaining(endDate: string): string {
  const { days, hours, minutes } = getTimeRemaining(endDate)
  
  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}
