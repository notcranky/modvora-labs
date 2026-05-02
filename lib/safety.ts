// Safety, moderation, AI content filtering, and privacy controls
// Comprehensive trust & safety system for car social platform

import { supabase } from './supabase'

// ===== CONTENT MODERATION =====
export interface ModerationResult {
  isSafe: boolean
  confidence: number
  flaggedCategories: string[]
  reason?: string
  action: 'allow' | 'flag' | 'block' | 'review'
}

// AI-powered content analysis (client-side patterns)
export function analyzeContent(content: string): ModerationResult {
  const patterns = {
    spam: /\b(buy now|click here|free money|earn \$\d+|work from home|make money fast)\b/gi,
    harassment: /\b(stupid|idiot|kill yourself|kys|hate you|die|worthless)\b/gi,
    explicit: /\b(nude|naked|porn|sex|xxx|onlyfans)\b/gi,
    scams: /\b(crypto investment|double your|guaranteed profit|limited time|act now)\b/gi,
    personal_info: /\b\d{3}-\d{2}-\d{4}|\b\d{16}\b|\b[A-Z]{2}\d{6,}\b/g // SSN, credit card, license
  }
  
  const flaggedCategories: string[] = []
  let severity = 0
  
  for (const [category, pattern] of Object.entries(patterns)) {
    const matches = content.match(pattern)
    if (matches && matches.length > 0) {
      flaggedCategories.push(category)
      // Weight severity
      if (category === 'harassment') severity += matches.length * 3
      if (category === 'explicit') severity += matches.length * 2
      if (category === 'scams') severity += matches.length * 2
      if (category === 'spam') severity += matches.length * 1
      if (category === 'personal_info') severity += matches.length * 3
    }
  }
  
  // Determine action based on severity
  let action: ModerationResult['action'] = 'allow'
  if (severity >= 5) action = 'block'
  else if (severity >= 3) action = 'review'
  else if (severity >= 1) action = 'flag'
  
  return {
    isSafe: severity === 0,
    confidence: Math.min(severity / 10, 1),
    flaggedCategories,
    reason: flaggedCategories.length > 0 ? `Flagged for: ${flaggedCategories.join(', ')}` : undefined,
    action
  }
}

// Image analysis (check URLs for known bad domains)
export function analyzeImageUrl(url: string): ModerationResult {
  const suspiciousDomains = [
    'spam-image',
    'adult-content',
    'phishing',
    'malware'
  ]
  
  const isSuspicious = suspiciousDomains.some(domain => url.includes(domain))
  
  return {
    isSafe: !isSuspicious,
    confidence: isSuspicious ? 0.9 : 0.1,
    flaggedCategories: isSuspicious ? ['suspicious_image'] : [],
    action: isSuspicious ? 'block' : 'allow'
  }
}

// ===== USER SAFETY FEATURES =====
export interface BlockList {
  blockedUsers: string[] // user IDs
  blockedWords: string[]
  muteDuration: '1h' | '24h' | '7d' | '30d' | 'permanent'
  muteExpiresAt?: string
}

export async function blockUser(userId: string, blockedUserId: string): Promise<void> {
  await supabase
    .from('user_blocks')
    .insert({
      user_id: userId,
      blocked_user_id: blockedUserId
    })
  
  // Remove existing follows
  await supabase
    .from('follows')
    .delete()
    .or(`follower_id.eq.${userId},following_id.eq.${blockedUserId},follower_id.eq.${blockedUserId},following_id.eq.${userId}`)
}

export async function unblockUser(userId: string, blockedUserId: string): Promise<void> {
  await supabase
    .from('user_blocks')
    .delete()
    .eq('user_id', userId)
    .eq('blocked_user_id', blockedUserId)
}

export async function getBlockedUsers(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('user_blocks')
    .select('blocked_user_id')
    .eq('user_id', userId)
  
  return data?.map(row => row.blocked_user_id) || []
}

export function isContentBlocked(content: string, blockedWords: string[]): boolean {
  const lowerContent = content.toLowerCase()
  return blockedWords.some(word => lowerContent.includes(word.toLowerCase()))
}

// ===== REPORTING SYSTEM =====
export interface Report {
  id: string
  reporterId: string
  targetType: 'post' | 'comment' | 'user' | 'story'
  targetId: string
  reason: 'harassment' | 'spam' | 'inappropriate' | 'misinformation' | 'copyright' | 'other'
  description?: string
  evidence?: string[]
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  resolvedAt?: string
  resolution?: string
}

export async function submitReport(
  reporterId: string,
  targetType: Report['targetType'],
  targetId: string,
  reason: Report['reason'],
  description?: string
): Promise<boolean> {
  // Auto-escalate high-priority keywords
  const urgentKeywords = ['child', 'minor', 'underage', 'illegal', 'weapon', 'threat']
  const isUrgent = urgentKeywords.some(kw => description?.toLowerCase().includes(kw))
  
  const priority: Report['priority'] = isUrgent ? 'urgent' : 'medium'
  
  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      description,
      priority,
      status: 'pending'
    })
  
  if (error) {
    console.error('Failed to submit report:', error)
    return false
  }
  
  // If urgent, notify moderators immediately
  if (isUrgent) {
    await notifyModerators({
      type: 'urgent_report',
      reportId: targetId,
      reporterId
    })
  }
  
  return true
}

async function notifyModerators(payload: any) {
  // Real-time notification to moderators
  await supabase
    .from('moderator_alerts')
    .insert({
      type: payload.type,
      data: payload,
      created_at: new Date().toISOString()
    })
}

// ===== PRIVACY CONTROLS =====
export interface PrivacySettings {
  profileVisibility: 'public' | 'followers' | 'private'
  allowMessaging: 'everyone' | 'followers' | 'none'
  showActivityStatus: boolean
  showLastSeen: boolean
  allowTagging: boolean
  allowSearchByEmail: boolean
  allowSearchByPhone: boolean
  dataSharing: {
    analytics: boolean
    advertising: boolean
    thirdParty: boolean
  }
}

export const DEFAULT_PRIVACY: PrivacySettings = {
  profileVisibility: 'public',
  allowMessaging: 'followers',
  showActivityStatus: true,
  showLastSeen: true,
  allowTagging: true,
  allowSearchByEmail: false,
  allowSearchByPhone: false,
  dataSharing: {
    analytics: true,
    advertising: false,
    thirdParty: false
  }
}

export async function updatePrivacySettings(
  userId: string,
  settings: Partial<PrivacySettings>
): Promise<void> {
  await supabase
    .from('privacy_settings')
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString()
    })
}

export async function getPrivacySettings(userId: string): Promise<PrivacySettings> {
  const { data } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (!data) return DEFAULT_PRIVACY
  
  return {
    profileVisibility: data.profile_visibility,
    allowMessaging: data.allow_messaging,
    showActivityStatus: data.show_activity_status ?? true,
    showLastSeen: data.show_last_seen ?? true,
    allowTagging: data.allow_tagging ?? true,
    allowSearchByEmail: data.allow_search_by_email ?? false,
    allowSearchByPhone: data.allow_search_by_phone ?? false,
    dataSharing: {
      analytics: data.share_analytics ?? true,
      advertising: data.share_advertising ?? false,
      thirdParty: data.share_third_party ?? false
    }
  }
}

// Check if user can view profile
export function canViewProfile(
  viewerId: string,
  profileOwnerId: string,
  privacy: PrivacySettings,
  isFollowing: boolean
): boolean {
  if (viewerId === profileOwnerId) return true
  
  switch (privacy.profileVisibility) {
    case 'public':
      return true
    case 'followers':
      return isFollowing
    case 'private':
      return false
    default:
      return true
  }
}

// Check if user can message
export function canMessage(
  senderId: string,
  recipientId: string,
  privacy: PrivacySettings,
  isFollowing: boolean
): boolean {
  if (senderId === recipientId) return false
  
  switch (privacy.allowMessaging) {
    case 'everyone':
      return true
    case 'followers':
      return isFollowing
    case 'none':
      return false
    default:
      return false
  }
}

// ===== TWO-FACTOR AUTHENTICATION =====
export interface TwoFactorSettings {
  enabled: boolean
  method: 'authenticator' | 'sms' | 'email'
  backupCodes: string[]
  verified: boolean
}

export async function enable2FA(userId: string, method: TwoFactorSettings['method']): Promise<{ secret?: string; qrCode?: string }> {
  // In production, this would generate a TOTP secret or send SMS/email
  const secret = generateSecret()
  
  await supabase
    .from('two_factor_auth')
    .upsert({
      user_id: userId,
      method,
      secret,
      enabled: false, // Not enabled until verified
      backup_codes: generateBackupCodes()
    })
  
  return {
    secret,
    qrCode: generateQRCode(secret, userId)
  }
}

export async function verify2FA(userId: string, code: string): Promise<boolean> {
  const { data } = await supabase
    .from('two_factor_auth')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (!data) return false
  
  // Verify TOTP or backup code
  const isValid = verifyTOTP(code, data.secret) || data.backup_codes.includes(code)
  
  if (isValid && !data.enabled) {
    // First verification - enable 2FA
    await supabase
      .from('two_factor_auth')
      .update({ enabled: true })
      .eq('user_id', userId)
  }
  
  return isValid
}

function generateSecret(): string {
  // 32 character base32 secret
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)]
  }
  return secret
}

function generateBackupCodes(): string[] {
  return Array.from({ length: 10 }, () => 
    Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')
  )
}

function generateQRCode(secret: string, userId: string): string {
  // In production, generate actual QR code
  return `otpauth://totp/Modvora:${userId}?secret=${secret}&issuer=Modvora`
}

function verifyTOTP(code: string, secret: string): boolean {
  // Simplified - in production use proper TOTP library
  return code.length === 6 && /^\d+$/.test(code)
}

// ===== ACTIVITY MONITORING =====
export interface SecurityEvent {
  id: string
  userId: string
  type: 'login' | 'logout' | 'password_change' | 'email_change' | 'suspicious_activity' | 'block' | 'report'
  ipAddress?: string
  userAgent?: string
  location?: string
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
  details?: Record<string, any>
}

export async function logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
  await supabase
    .from('security_events')
    .insert({
      user_id: event.userId,
      type: event.type,
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      location: event.location,
      severity: event.severity,
      details: event.details
    })
  
  // Check for suspicious patterns
  if (event.type === 'login') {
    await checkSuspiciousLogin(event.userId, event.ipAddress)
  }
}

async function checkSuspiciousLogin(userId: string, ipAddress?: string) {
  // Get recent logins
  const { data: recentLogins } = await supabase
    .from('security_events')
    .select('ip_address, created_at')
    .eq('user_id', userId)
    .eq('type', 'login')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (!recentLogins || recentLogins.length < 2) return
  
  const uniqueIPs = new Set(recentLogins.map(l => l.ip_address))
  
  // If 3+ different IPs in last 5 logins, flag as suspicious
  if (uniqueIPs.size >= 3) {
    await supabase
      .from('security_events')
      .insert({
        user_id: userId,
        type: 'suspicious_activity',
        severity: 'warning',
        details: { reason: 'Multiple IP addresses detected', unique_ips: Array.from(uniqueIPs) }
      })
    
    // Could send email notification to user
  }
}

export async function getRecentActivity(userId: string, limit: number = 20): Promise<SecurityEvent[]> {
  const { data } = await supabase
    .from('security_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  return data || []
}

// ===== ACCOUNT SECURITY SCORE =====
export interface SecurityScore {
  score: number // 0-100
  factors: {
    twoFactor: boolean
    strongPassword: boolean
    emailVerified: boolean
    recentLogin: boolean
    noSecurityIncidents: boolean
    privacySettingsGood: boolean
  }
  recommendations: string[]
}

export async function calculateSecurityScore(userId: string): Promise<SecurityScore> {
  const factors = {
    twoFactor: false,
    strongPassword: false,
    emailVerified: false,
    recentLogin: true,
    noSecurityIncidents: true,
    privacySettingsGood: false
  }
  
  // Check 2FA
  const { data: twoFactor } = await supabase
    .from('two_factor_auth')
    .select('enabled')
    .eq('user_id', userId)
    .single()
  factors.twoFactor = twoFactor?.enabled || false
  
  // Check email verification
  const { data: user } = await supabase.auth.getUser()
  factors.emailVerified = user.data.user?.email_confirmed_at != null
  
  // Check privacy settings
  const privacy = await getPrivacySettings(userId)
  factors.privacySettingsGood = 
    privacy.profileVisibility !== 'public' ||
    privacy.allowMessaging !== 'everyone'
  
  // Check security incidents
  const { data: incidents } = await supabase
    .from('security_events')
    .select('*')
    .eq('user_id', userId)
    .in('severity', ['warning', 'critical'])
    .gt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  
  factors.noSecurityIncidents = !incidents || incidents.length === 0
  
  // Calculate score
  const weights = {
    twoFactor: 25,
    strongPassword: 15,
    emailVerified: 20,
    recentLogin: 10,
    noSecurityIncidents: 20,
    privacySettingsGood: 10
  }
  
  let score = 0
  Object.entries(factors).forEach(([key, value]) => {
    if (value) score += weights[key as keyof typeof weights]
  })
  
  // Generate recommendations
  const recommendations: string[] = []
  if (!factors.twoFactor) recommendations.push('Enable two-factor authentication for better security')
  if (!factors.emailVerified) recommendations.push('Verify your email address')
  if (!factors.privacySettingsGood) recommendations.push('Review your privacy settings - your profile is fully public')
  if (!factors.noSecurityIncidents) recommendations.push('Review recent security alerts on your account')
  
  return { score, factors, recommendations }
}
