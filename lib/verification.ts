// Verification system - followers, verified badges, tier management

import { supabase, supabaseEnabled } from './supabase'

// Helper function to normalize handles (imported from profiles)
function toHandle(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]+/g, '')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 30) || 'user'
}

export interface ProfileWithVerification {
  id: string
  username: string
  handle: string
  avatar_url?: string
  verified: boolean
  verified_at?: string
  verified_type?: 'free' | 'paid' | 'admin' | null
  verified_expires_at?: string
  follower_count: number
  following_count: number
  early_supporter: boolean
  created_at: string
}

// ===== FOLLOWERS =====

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  if (!supabaseEnabled) return false

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })

  if (error) {
    console.error('Error following user:', error)
    return false
  }
  return true
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  if (!supabaseEnabled) return false

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) {
    console.error('Error unfollowing user:', error)
    return false
  }
  return true
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (!supabaseEnabled) return false

  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single()

  if (error) return false
  return !!data
}

export async function getFollowerCount(userId: string): Promise<number> {
  if (!supabaseEnabled) return 0

  const { data, error } = await supabase
    .from('profiles')
    .select('follower_count')
    .eq('id', userId)
    .single()

  if (error) return 0
  return data?.follower_count ?? 0
}

export async function getFollowingCount(userId: string): Promise<number> {
  if (!supabaseEnabled) return 0

  const { data, error } = await supabase
    .from('profiles')
    .select('following_count')
    .eq('id', userId)
    .single()

  if (error) return 0
  return data?.following_count ?? 0
}

// ===== VERIFICATION =====

export async function getProfileWithVerification(userId: string): Promise<ProfileWithVerification | null> {
  if (!supabaseEnabled) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  return data as ProfileWithVerification
}

export async function isVerified(userId: string): Promise<boolean> {
  if (!supabaseEnabled) return false

  const profile = await getProfileWithVerification(userId)
  if (!profile?.verified) return false
  if (profile.verified_type === 'paid' && profile.verified_expires_at) {
    return new Date(profile.verified_expires_at) > new Date()
  }
  return true
}

// Owner account - always verified (hardcoded since owner uses custom auth, not Supabase)
const OWNER_HANDLES = ['jackson', 'jackson_fontes', 'Jackson Fontes', 'Jackson', 'jacksonjfontes']

export async function getVerifiedUsers(): Promise<ProfileWithVerification[]> {
  if (!supabaseEnabled) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('verified', true)
    .order('follower_count', { ascending: false })

  if (error) {
    console.error('Error fetching verified users:', error)
    return []
  }

  return (data as ProfileWithVerification[]) ?? []
}

export function isOwnerHandle(handle: string): boolean {
  const normalized = handle.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')
  return OWNER_HANDLES.some(h =>
    toHandle(h) === normalized ||
    h.toLowerCase() === handle.toLowerCase().trim()
  )
}

// ===== DIRECT VERIFICATION CHECK =====

export async function getVerifiedStatusByHandle(handle: string): Promise<ProfileWithVerification | null> {
  if (!supabaseEnabled) return null

  const normalizedHandle = handle.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')

  const { data: allVerified, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('verified', true)

  if (error) return null

  // Manual match
  const match = allVerified?.find(p => {
    const pHandle = p.handle?.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')
    const pUsername = p.username?.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')
    return pHandle === normalizedHandle || pUsername === normalizedHandle
  })

  return match as ProfileWithVerification | null
}

// ===== VERIFICATION TIERS =====

export function getVerificationStatus(profile: ProfileWithVerification): {
  isVerified: boolean
  badgeColor: 'purple' | 'gold' | null
  tooltip: string
  canExpire: boolean
} {
  if (!profile.verified) {
    return { isVerified: false, badgeColor: null, tooltip: '', canExpire: false }
  }
  
  // Check if paid verification expired
  if (profile.verified_type === 'paid' && profile.verified_expires_at) {
    const expired = new Date(profile.verified_expires_at) < new Date()
    if (expired) {
      return { 
        isVerified: false, 
        badgeColor: null, 
        tooltip: 'Verification expired — resubscribe or reach 1K followers', 
        canExpire: true 
      }
    }
  }
  
  // Admin/Owner — gold badge
  if (profile.verified_type === 'admin') {
    return { 
      isVerified: true, 
      badgeColor: 'gold', 
      tooltip: 'Modvora Admin', 
      canExpire: false 
    }
  }
  
  // Both paid ($10/mo) and free (1K+ followers) get purple badge
  // Under 1K = $10/mo, Over 1K = FREE
  const isPaid = profile.verified_type === 'paid'
  const hitFollowerGoal = profile.follower_count >= 1000
  const isFree = profile.verified_type === 'free' || hitFollowerGoal
  
  if (isPaid || isFree) {
    return { 
      isVerified: true, 
      badgeColor: 'purple', 
      tooltip: hitFollowerGoal 
        ? 'Verified Builder (Free — 1K+ followers)' 
        : 'Verified Builder (Premium — $10/mo)', 
      canExpire: isPaid && !hitFollowerGoal // Paid expires unless you hit 1K
    }
  }
  
  return { isVerified: false, badgeColor: null, tooltip: '', canExpire: false }
}

export function shouldAutoVerify(followerCount: number): boolean {
  return followerCount >= 1000
}

// ===== ADMIN FUNCTIONS =====

export async function verifyUserManually(
  adminId: string,
  userId: string,
  type: 'free' | 'paid' | 'admin' = 'admin'
): Promise<boolean> {
  if (!supabaseEnabled) return false

  // Check if admin is verified
  const adminProfile = await getProfileWithVerification(adminId)
  if (!adminProfile?.verified || adminProfile.verified_type !== 'admin') {
    console.error('Not authorized to verify users')
    return false
  }

  const updates: Record<string, any> = {
    verified: true,
    verified_at: new Date().toISOString(),
    verified_type: type,
    verified_by: adminId
  }

  if (type === 'paid') {
    // Set expiration to 30 days from now (or based on payment)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    updates.verified_expires_at = expiresAt.toISOString()
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (error) {
    console.error('Error verifying user:', error)
    return false
  }
  return true
}

export async function revokeVerification(adminId: string, userId: string): Promise<boolean> {
  if (!supabaseEnabled) return false

  // Check if admin is verified
  const adminProfile = await getProfileWithVerification(adminId)
  if (!adminProfile?.verified || adminProfile.verified_type !== 'admin') {
    console.error('Not authorized to revoke verification')
    return false
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      verified: false,
      verified_at: null,
      verified_type: null,
      verified_expires_at: null,
      verified_by: null
    })
    .eq('id', userId)

  if (error) {
    console.error('Error revoking verification:', error)
    return false
  }
  return true
}
