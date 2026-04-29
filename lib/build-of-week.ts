// Build of the Week System — Weekly featured builds

import { CommunityPostWithVehicle } from './community'
import { awardXP } from './builder-levels'

export interface BuildOfWeek {
  weekId: string        // YYYY-W## format
  buildId: string
  slug: string
  title: string
  author: string
  handle: string
  featuredAt: string
  reason: string        // Why it was featured
  stats: {
    likes: number
    comments: number
    views: number
  }
}

const BOTW_KEY = 'modvora_botw_history'
const CURRENT_BOTW_KEY = 'modvora_botw_current'

// Sample featured builds for demo
const SEED_BOTW: BuildOfWeek[] = [
  {
    weekId: '2026-W17',
    buildId: 'post-gr86-midnight',
    slug: 'gr86-midnight-street-build',
    title: 'GR86 Midnight Street Build',
    author: 'Alex Mitchell',
    handle: 'alex_mitchell',
    featuredAt: '2026-04-21T00:00:00Z',
    reason: 'Perfect balance of daily drivability and weekend track capability',
    stats: { likes: 247, comments: 42, views: 3200 },
  },
  {
    weekId: '2026-W16',
    buildId: 'post-m2-voltage',
    slug: 'm2-voltage-track-weapon',
    title: 'M2 Voltage — The Track Weapon',
    author: 'Jordan Chen',
    handle: 'jordan_chen',
    featuredAt: '2026-04-14T00:00:00Z',
    reason: 'Incredible power gains and attention to suspension geometry',
    stats: { likes: 189, comments: 31, views: 2100 },
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

export function getCurrentWeekId(): string {
  const now = new Date()
  const year = now.getFullYear()
  
  // Get week number (ISO week date)
  const start = new Date(year, 0, 1)
  const diff = now.getTime() - start.getTime()
  const oneWeek = 1000 * 60 * 60 * 24 * 7
  const week = Math.floor(diff / oneWeek) + 1
  
  return `${year}-W${week.toString().padStart(2, '0')}`
}

export function getBuildOfWeek(): BuildOfWeek | null {
  const current = safeRead<BuildOfWeek | null>(CURRENT_BOTW_KEY, null)
  const weekId = getCurrentWeekId()
  
  if (current?.weekId === weekId) return current
  
  // Return seed data if no current selection
  return SEED_BOTW[0] || null
}

export function getBuildOfWeekHistory(): BuildOfWeek[] {
  const stored = safeRead<BuildOfWeek[]>(BOTW_KEY, [])
  return [...SEED_BOTW, ...stored]
}

export function selectBuildOfWeek(
  post: CommunityPostWithVehicle,
  reason: string,
  moderator: string
): BuildOfWeek {
  const weekId = getCurrentWeekId()
  
  const botw: BuildOfWeek = {
    weekId,
    buildId: post.id,
    slug: post.slug,
    title: post.title,
    author: post.vehicle.name || 'Unknown',
    handle: post.vehicle.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
    featuredAt: new Date().toISOString(),
    reason,
    stats: {
      likes: Math.floor(Math.random() * 50) + 150,  // Mock stats
      comments: Math.floor(Math.random() * 20) + 10,
      views: Math.floor(Math.random() * 1000) + 2000,
    },
  }
  
  // Save as current
  safeWrite(CURRENT_BOTW_KEY, botw)
  
  // Add to history
  const history = getBuildOfWeekHistory()
  history.unshift(botw)
  safeWrite(BOTW_KEY, history.slice(0, 20))  // Keep last 20
  
  // Award XP to builder
  awardXP(botw.handle, 'features', 100)
  
  return botw
}

export function isBuildOfWeek(buildId: string): boolean {
  const current = getBuildOfWeek()
  return current?.buildId === buildId
}

export function formatWeekDisplay(weekId: string): string {
  const [year, week] = weekId.split('-W')
  const weekNum = parseInt(week, 10)
  
  // Get the Monday of that week
  const date = new Date(parseInt(year, 10), 0, 1 + (weekNum - 1) * 7)
  while (date.getDay() !== 1) date.setDate(date.getDate() - 1)
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getBotWBadge(): string {
  return '🏆'
}
