import { JournalEntry } from './garage'

export const SHARED_BUILDS_KEY = 'modvora_shared_builds'

export interface SharedBuildPart {
  id: string
  name: string
  category: string
  cost?: number
  vendor?: string
  status: 'planned' | 'purchased' | 'installed'
}

export interface SharedBuild {
  id: string
  vehicleId: string
  year: string
  make: string
  model: string
  trim?: string
  heroPhoto?: string       // base64 compressed car photo
  contactLink?: string     // IG handle, email, etc.
  parts: SharedBuildPart[]
  totalCost: number
  startDate?: string       // ISO date — first journal entry or createdAt
  journalEntries: JournalEntry[]
  createdAt: string
  updatedAt: string
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function loadAllSharedBuilds(): Record<string, SharedBuild> {
  return readJson<Record<string, SharedBuild>>(SHARED_BUILDS_KEY, {})
}

export function loadSharedBuild(id: string): SharedBuild | null {
  return loadAllSharedBuilds()[id] ?? null
}

export function saveSharedBuild(build: SharedBuild): void {
  const all = loadAllSharedBuilds()
  all[build.id] = build
  localStorage.setItem(SHARED_BUILDS_KEY, JSON.stringify(all))
}

export function deleteSharedBuild(id: string): void {
  const all = loadAllSharedBuilds()
  delete all[id]
  localStorage.setItem(SHARED_BUILDS_KEY, JSON.stringify(all))
}

export function createBuildId(year: string, make: string, model: string): string {
  const slug = `${year}-${make}-${model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${slug}-${suffix}`
}

export function calcBuildDuration(startDate?: string): string {
  if (!startDate) return '—'
  const start = new Date(startDate)
  const now = new Date()
  const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 mo' : `${months} mo`
}
