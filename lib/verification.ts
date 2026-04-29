// Verification system - followers, verified badges, tier management

import { supabase, supabaseEnabled } from './supabase'

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

export async function getVerifiedUsers(): Promise<ProfileWithVerification[]> {
  if (!supabaseEnabled) {
    console.log('[verification] Supabase not enabled')
    return []
  }
  
  console.log('[verification] Fetching verified users from profiles table')
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('verified', true)
    .order('follower_count', { ascending: false })
  
  if (error) {
    console.error('[verification] Error fetching verified users:', error)
    return []
  }
  
  console.log('[verification] Found verified users:', data?.length || 0)
  if (data && data.length > 0) {
    console.log('[verification] Users:', data.map(p => ({ id: p.id?.slice(0,8), handle: p.handle, username: p.username, verified: p.verified, type: p.verified_type })))
  }
  
  return (data as ProfileWithVerification[]) ?? []
}

// ===== DIRECT VERIFICATION CHECK =====

export async function getVerifiedStatusByHandle(handle: string): Promise<ProfileWithVerification | null> {
  if (!supabaseEnabled) return null
  
  // Normalize handle for comparison
  const normalizedHandle = handle.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')
  
  console.log('[verification] Checking handle:', handle, 'normalized:', normalizedHandle)
  
  // Get all verified profiles
  const { data: allVerified, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('verified', true)
  
  if (error) {
    console.error('[verification] Error fetching verified:', error)
    return null
  }
  
  // Manual match
  const match = allVerified?.find(p => {
    const pHandle = p.handle?.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')
    const pUsername = p.username?.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')
    return pHandle === normalizedHandle || pUsername === normalizedHandle
  })
  
  console.log('[verification] Manual match found:', match ? match.handle : 'no')
  return match as ProfileWithVerification | null
}

// ===== VERIFICATION TIERS =====

export function getVerificationStatus(profile: ProfileWithVerification): {
  isVerified: boolean
  badgeColor: string
  tooltip: string
  canExpire: boolean
} {
  if (!profile.verified) {
    return { isVerified: false, badgeColor: '', tooltip: '', canExpire: false }
  }
  
  // Check if paid verification expired
  if (profile.verified_type === 'paid' && profile.verified_expires_at) {
    const expired = new Date(profile.verified_expires_at) < new Date()
    if (expired) {
      return { 
        isVerified: false, 
        badgeColor: 'gray', 
        tooltip: 'Verification expired', 
        canExpire: true 
      }
    }
  }
  
  const isEarlySupporter = profile.early_supporter
  
  switch (profile.verified_type) {
    case 'admin':
      return { 
        isVerified: true, 
        badgeColor: 'gold', 
        tooltip: 'Modvora Admin', 
        canExpire: false 
      }
    case 'paid':
      return { 
        isVerified: true, 
        badgeColor: 'purple', 
        tooltip: isEarlySupporter ? 'Early Supporter' : 'Verified Builder (Premium)', 
        canExpire: true 
      }
    case 'free':
    default:
      return { 
        isVerified: true, 
        badgeColor: 'blue', 
        tooltip: 'Verified Builder (1K+ followers)', 
        canExpire: false 
      }
  }
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
