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
export function toHandle(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30) || 'user'
}

export function getPostAuthorHandle(post: CommunityPostWithVehicle): string {
  return toHandle(post.vehicle.name || 'user')
}
