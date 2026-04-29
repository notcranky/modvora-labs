// Automated content moderation system
// Basic rule-based + AI-powered content analysis

import { supabase, supabaseEnabled } from './supabase'

export interface ModerationResult {
  approved: boolean
  score: number // 0.0 to 1.0, higher = more problematic
  reasons: string[]
  categories: string[]
  requiresHumanReview: boolean
}

// Keywords and patterns for basic moderation
const FLAGGED_KEYWORDS = [
  'spam', 'scam', 'fake', 'fraud', 'phishing',
  'nsfw', 'porn', 'xxx', 'adult', 'sex',
  'hate', 'racist', 'nazi', 'kill', 'death threat',
  'drugs', 'cocaine', 'heroin', 'meth', 'weed for sale',
  'weapons', 'guns for sale', 'buy gun', 'sell gun',
  'crypto scam', 'investment scam', 'get rich quick'
]

const SUSPICIOUS_PATTERNS = [
  /\$\$\$/g, // Multiple dollar signs
  /(click|visit|check out)\s+(here|link|bio)/gi, // Spam CTAs
  /(dm|message)\s+me\s+(for|to)/gi, // DM for...
  /(limited|urgent|act now|hurry)/gi, // Urgency spam
  /[\u{1F600}-\u{1F64F}]{10,}/gu, // Excessive emojis
]

// Automated moderation rules
export async function moderateContent(
  content: {
    title?: string
    description?: string
    mediaType: 'image' | 'video'
    hasVideo: boolean
  }
): Promise<ModerationResult> {
  const result: ModerationResult = {
    approved: true,
    score: 0,
    reasons: [],
    categories: [],
    requiresHumanReview: false
  }

  const textToCheck = `${content.title || ''} ${content.description || ''}`.toLowerCase()

  // Rule 1: Keyword checking
  for (const keyword of FLAGGED_KEYWORDS) {
    if (textToCheck.includes(keyword.toLowerCase())) {
      result.score += 0.3
      result.reasons.push(`Flagged keyword: "${keyword}"`)
      result.categories.push('flagged_content')
    }
  }

  // Rule 2: Pattern matching
  for (const pattern of SUSPICIOUS_PATTERNS) {
    const matches = textToCheck.match(pattern)
    if (matches) {
      result.score += 0.2 * matches.length
      result.reasons.push(`Suspicious pattern detected: "${pattern.source.slice(0, 30)}..."`)
      result.categories.push('spam_patterns')
    }
  }

  // Rule 3: Video content always gets human review (for now)
  if (content.hasVideo || content.mediaType === 'video') {
    result.requiresHumanReview = true
    result.reasons.push('Video content requires human review')
    result.categories.push('video_review')
  }

  // Rule 4: All-caps title (shouting/spam)
  if (content.title && content.title.length > 10) {
    const capsRatio = (content.title.match(/[A-Z]/g) || []).length / content.title.length
    if (capsRatio > 0.7) {
      result.score += 0.15
      result.reasons.push('Excessive capitalization in title')
      result.categories.push('spam_patterns')
    }
  }

  // Rule 5: External links (potential spam/phishing)
  const urlPattern = /(https?:\/\/|www\.)[^\s]+/gi
  const urlCount = (textToCheck.match(urlPattern) || []).length
  if (urlCount > 3) {
    result.score += 0.25 * (urlCount - 3)
    result.reasons.push(`Multiple external links detected (${urlCount})`)
    result.categories.push('external_links')
  }

  // Cap score at 1.0
  result.score = Math.min(result.score, 1.0)

  // Decision logic
  if (result.score >= 0.7) {
    result.approved = false
    result.requiresHumanReview = true
  } else if (result.score >= 0.4 || result.requiresHumanReview) {
    result.approved = false // Auto-reject or hold for review
    if (result.requiresHumanReview) {
      result.approved = true // Will be pending, not rejected
    }
  }

  return result
}

// Store moderation result in database
export async function logModerationDecision(
  postId: string,
  result: ModerationResult,
  automated: boolean = true
): Promise<boolean> {
  if (!supabaseEnabled) return true

  try {
    // Update post with moderation info
    const { error } = await supabase
      .from('community_posts')
      .update({
        moderation_status: result.requiresHumanReview ? 'pending' : (result.approved ? 'approved' : 'flagged'),
        moderation_reason: result.reasons.join('; '),
        moderation_score: result.score,
      })
      .eq('id', postId)

    if (error) {
      console.error('Error logging moderation:', error)
      return false
    }

    // Add to queue if human review required
    if (result.requiresHumanReview) {
      const { error: queueError } = await supabase
        .from('moderation_queue')
        .insert({
          post_id: postId,
          flagged_by: automated ? 'ai' : 'system',
          reason: result.reasons.join('; '),
          ai_score: result.score,
          ai_categories: result.categories,
          status: 'pending'
        })

      if (queueError) {
        console.error('Error adding to queue:', queueError)
      }
    }

    return true
  } catch (err) {
    console.error('Moderation logging error:', err)
    return false
  }
}

// Submit report from user
export async function reportContent(
  postId: string,
  reason: string,
  details?: string,
  reporterId?: string
): Promise<boolean> {
  if (!supabaseEnabled) return false

  const { error } = await supabase
    .from('moderation_reports')
    .insert({
      post_id: postId,
      reporter_id: reporterId,
      reason,
      details,
      status: 'open'
    })

  if (error) {
    console.error('Error submitting report:', error)
    return false
  }

  // Also flag the post
  await supabase
    .from('community_posts')
    .update({ moderation_status: 'flagged' })
    .eq('id', postId)

  return true
}

// Admin: Get moderation queue
export async function getModerationQueue(): Promise<any[]> {
  if (!supabaseEnabled) return []

  const { data, error } = await supabase
    .from('pending_moderation')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching queue:', error)
    return []
  }

  return data || []
}

// Admin: Approve or reject content
export async function moderateContentAction(
  queueId: string,
  action: 'approve' | 'reject',
  adminId: string,
  notes?: string
): Promise<boolean> {
  if (!supabaseEnabled) return false

  // Use the database function
  const { data, error } = await supabase
    .rpc('moderate_content', {
      queue_id: queueId,
      action: action,
      admin_id: adminId,
      notes: notes || null
    })

  if (error) {
    console.error('Error moderating content:', error)
    return false
  }

  return data || false
}

// Admin: Get reports
export async function getReports(): Promise<any[]> {
  if (!supabaseEnabled) return []

  const { data, error } = await supabase
    .from('moderation_reports')
    .select('*, community_posts(title, author_id)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reports:', error)
    return []
  }

  return data || []
}
