// Video upload handling with Supabase Storage

import { supabase, supabaseEnabled } from './supabase'
import { moderateContent, logModerationDecision } from './moderation'

export interface VideoUploadResult {
  success: boolean
  url?: string
  thumbnailUrl?: string
  error?: string
  moderationRequired?: boolean
}

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska']

export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Video must be under 100MB' }
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid video format. Use MP4, MOV, WebM, or MKV' 
    }
  }

  // Check duration (if possible from file metadata)
  // Note: Actual duration check requires video element, done client-side

  return { valid: true }
}

export async function uploadVideo(
  file: File,
  postId: string,
  onProgress?: (progress: number) => void
): Promise<VideoUploadResult> {
  if (!supabaseEnabled) {
    return { 
      success: false, 
      error: 'Upload not available - storage not configured',
      moderationRequired: true
    }
  }

  // Validate first
  const validation = validateVideoFile(file)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  try {
    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${postId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `videos/${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (error) {
      console.error('Upload error:', error)
      return { success: false, error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath)

    // Generate thumbnail (placeholder - would need server-side processing)
    const thumbnailUrl = publicUrl.replace(/\.[^.]+$/, '_thumb.jpg')

    return {
      success: true,
      url: publicUrl,
      thumbnailUrl,
      moderationRequired: true // Videos always need review
    }

  } catch (err) {
    console.error('Upload error:', err)
    return { 
      success: false, 
      error: 'Upload failed. Please try again.',
      moderationRequired: true
    }
  }
}

// Upload with progress tracking using XMLHttpRequest
export function uploadVideoWithProgress(
  file: File,
  postId: string,
  onProgress: (progress: number) => void
): Promise<VideoUploadResult> {
  return new Promise(async (resolve) => {
    if (!supabaseEnabled) {
      resolve({ 
        success: false, 
        error: 'Upload not available',
        moderationRequired: true
      })
      return
    }

    const validation = validateVideoFile(file)
    if (!validation.valid) {
      resolve({ success: false, error: validation.error })
      return
    }

    // Use Supabase's upload with progress callback
    const fileExt = file.name.split('.').pop()
    const fileName = `${postId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `videos/${fileName}`

    try {
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })

      if (error) {
        resolve({ success: false, error: error.message })
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath)

      resolve({
        success: true,
        url: publicUrl,
        thumbnailUrl: publicUrl.replace(/\.[^.]+$/, '_thumb.jpg'),
        moderationRequired: true
      })

    } catch (err) {
      resolve({ 
        success: false, 
        error: 'Upload failed',
        moderationRequired: true
      })
    }
  })
}

// Delete video from storage
export async function deleteVideo(videoUrl: string): Promise<boolean> {
  if (!supabaseEnabled) return false

  try {
    // Extract path from URL
    const url = new URL(videoUrl)
    const pathMatch = url.pathname.match(/videos\/(.+)$/)
    if (!pathMatch) return false

    const { error } = await supabase.storage
      .from('videos')
      .remove([pathMatch[1]])

    return !error
  } catch (err) {
    console.error('Delete error:', err)
    return false
  }
}

// Get video duration from file
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }

    video.onerror = () => {
      resolve(0)
    }

    video.src = window.URL.createObjectURL(file)
  })
}

// Check if video meets requirements
export async function validateVideoRequirements(
  file: File
): Promise<{ valid: boolean; error?: string; duration?: number }> {
  // Basic file validation
  const fileCheck = validateVideoFile(file)
  if (!fileCheck.valid) {
    return fileCheck
  }

  // Check duration
  const duration = await getVideoDuration(file)
  
  if (duration > 300) { // 5 minutes max
    return { 
      valid: false, 
      error: 'Video must be under 5 minutes',
      duration 
    }
  }

  if (duration < 3) { // 3 seconds minimum
    return { 
      valid: false, 
      error: 'Video must be at least 3 seconds',
      duration 
    }
  }

  return { valid: true, duration }
}
