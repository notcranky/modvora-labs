'use client'

import { slugify, CommunityPostWithVehicle } from './community'

export const FOLLOWS_KEY = 'modvora_follows'
const FOLLOWER_COUNTS_KEY = 'modvora_follower_counts'

// Seed follower counts for sample community users
const SEED_FOLLOWER_COUNTS: Record<string, number> = {
  alex: 142,
  jordan: 89,
}

function safeReadObj<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function getFollowedUsernames(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(FOLLOWS_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function isFollowing(username: string): boolean {
  return getFollowedUsernames().has(username)
}

export function getFollowerCount(username: string): number {
  const stored = safeReadObj<Record<string, number>>(FOLLOWER_COUNTS_KEY, {})
  return stored[username] ?? SEED_FOLLOWER_COUNTS[username] ?? 0
}

export function toggleFollow(username: string): boolean {
  const followed = getFollowedUsernames()
  const wasFollowing = followed.has(username)
  if (wasFollowing) {
    followed.delete(username)
  } else {
    followed.add(username)
  }
  try {
    localStorage.setItem(FOLLOWS_KEY, JSON.stringify(Array.from(followed)))
    // Update follower count
    const counts = safeReadObj<Record<string, number>>(FOLLOWER_COUNTS_KEY, {})
    const current = counts[username] ?? SEED_FOLLOWER_COUNTS[username] ?? 0
    counts[username] = Math.max(0, current + (wasFollowing ? -1 : 1))
    localStorage.setItem(FOLLOWER_COUNTS_KEY, JSON.stringify(counts))
  } catch {}
  return followed.has(username)
}

export function getPostAuthorUsername(post: CommunityPostWithVehicle): string {
  return slugify(post.vehicle.name || 'unknown')
}

export function getPostAuthorDisplayName(post: CommunityPostWithVehicle): string {
  return post.vehicle.name || 'Unknown'
}

// Generates an @handle from a display name (e.g. "Jackson Fontas" → "jackson_fontas")
// NO SPACES allowed — handles must be taggable like @handle (not @handle text)
export function toHandle(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')           // Spaces → underscores
    .replace(/[^a-z0-9_]+/g, '')   // Remove all other special chars
    .replace(/^_+|_+$/g, '')        // Trim leading/trailing underscores
    .replace(/_+/g, '_')            // Collapse multiple underscores
    .slice(0, 30) || 'user'
}

// Validates a handle for input (stricter than toHandle)
export function validateHandle(handle: string): { valid: boolean; error?: string } {
  const h = handle.toLowerCase().trim().replace(/^@/, '')
  
  if (!h) {
    return { valid: false, error: 'Handle is required' }
  }
  
  if (h.length < 3) {
    return { valid: false, error: 'Handle must be at least 3 characters' }
  }
  
  if (h.length > 30) {
    return { valid: false, error: 'Handle must be 30 characters or less' }
  }
  
  // NO SPACES allowed — this is critical for tagging (@handle vs @handle text)
  if (h.includes(' ')) {
    return { valid: false, error: 'Handle cannot contain spaces (use underscores instead)' }
  }
  
  if (!/^[a-z0-9_]+$/.test(h)) {
    return { valid: false, error: 'Handle can only contain letters, numbers, and underscores' }
  }
  
  if (/^[0-9]+$/.test(h)) {
    return { valid: false, error: 'Handle cannot be only numbers' }
  }
  
  return { valid: true }
}

export function getPostAuthorHandle(post: CommunityPostWithVehicle): string {
  return toHandle(post.vehicle.name || 'user')
}
