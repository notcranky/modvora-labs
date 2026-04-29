// Builder Level System — XP from engagement

export const LEVELS = [
  { level: 1, name: 'Garage Newbie', minXP: 0, badge: '🆕', color: 'zinc' },
  { level: 2, name: 'Wrench Turner', minXP: 50, badge: '🔧', color: 'blue' },
  { level: 3, name: 'Mod Enthusiast', minXP: 150, badge: '⚡', color: 'cyan' },
  { level: 4, name: 'Tuning Apprentice', minXP: 300, badge: '📈', color: 'teal' },
  { level: 5, name: 'Build Veteran', minXP: 500, badge: '🏆', color: 'green' },
  { level: 6, name: 'Speed Demon', minXP: 800, badge: '🔥', color: 'orange' },
  { level: 7, name: 'Track Day Hero', minXP: 1200, badge: '🏁', color: 'amber' },
  { level: 8, name: 'Dyno King', minXP: 1800, badge: '👑', color: 'yellow' },
  { level: 9, name: 'Build Legend', minXP: 2500, badge: '⭐', color: 'purple' },
  { level: 10, name: 'Modvora Master', minXP: 4000, badge: '🎯', color: 'pink' },
] as const

export type BuilderLevel = typeof LEVELS[number]

const XP_KEY = 'modvora_builder_xp'
const LEVEL_NOTIF_KEY = 'modvora_level_notified'

export interface BuilderXP {
  total: number
  breakdown: {
    likes: number      // 5 XP per like received
    comments: number   // 10 XP per comment received
    shares: number     // 20 XP per external share
    battles: number    // 15 XP per battle won
    features: number   // 100 XP for Build of Week
  }
}

// Seed data for sample users
const SEED_XP: Record<string, number> = {
  'Alex_Mitchell': 340,
  'Jordan_Chen': 180,
  'Sam_Rodriguez': 520,
}

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

export function getBuilderXP(username: string): BuilderXP {
  const stored = safeRead<Record<string, BuilderXP>>(XP_KEY, {})
  const seedXP = SEED_XP[username] ?? 0
  
  return stored[username] || {
    total: seedXP,
    breakdown: {
      likes: Math.floor(seedXP * 0.5),
      comments: Math.floor(seedXP * 0.3),
      shares: Math.floor(seedXP * 0.1),
      battles: 0,
      features: 0,
    }
  }
}

export function getLevel(xp: number): BuilderLevel {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i]
  }
  return LEVELS[0]
}

export function getNextLevel(currentLevel: number): BuilderLevel | null {
  return LEVELS.find(l => l.level === currentLevel + 1) || null
}

export function getProgressToNextLevel(xp: number): { percent: number; needed: number } {
  const currentLevel = getLevel(xp)
  const nextLevel = getNextLevel(currentLevel.level)
  
  if (!nextLevel) return { percent: 100, needed: 0 }
  
  const range = nextLevel.minXP - currentLevel.minXP
  const progress = xp - currentLevel.minXP
  const percent = Math.min(100, Math.floor((progress / range) * 100))
  
  return { percent, needed: nextLevel.minXP - xp }
}

// Award XP for various actions
export function awardXP(username: string, action: keyof BuilderXP['breakdown'], amount?: number): void {
  const xp = getBuilderXP(username)
  const oldLevel = getLevel(xp.total)
  
  const defaultAmounts: Record<keyof BuilderXP['breakdown'], number> = {
    likes: 5,
    comments: 10,
    shares: 20,
    battles: 15,
    features: 100,
  }
  
  const earned = amount ?? defaultAmounts[action]
  xp.total += earned
  xp.breakdown[action] += earned
  
  const allXP = safeRead<Record<string, BuilderXP>>(XP_KEY, {})
  allXP[username] = xp
  safeWrite(XP_KEY, allXP)
  
  // Check for level up
  const newLevel = getLevel(xp.total)
  if (newLevel.level > oldLevel.level) {
    const notified = safeRead<Set<string>>(LEVEL_NOTIF_KEY, new Set())
    if (!notified.has(username)) {
      notified.add(username)
      safeWrite(LEVEL_NOTIF_KEY, Array.from(notified))
      // In real app, this would trigger a toast/notification
    }
  }
}

export function getLevelColorClasses(color: string): string {
  const colors: Record<string, string> = {
    zinc: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    teal: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  }
  return colors[color] || colors.zinc
}

export function formatXP(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`
  return xp.toString()
}
