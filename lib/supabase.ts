import { createClient } from '@supabase/supabase-js'

// These will be set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Like {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Save {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  author: string
  text: string
  created_at: string
  parent_id?: string | null
}

export interface Profile {
  id: string
  username: string
  handle: string
  avatar_url?: string
  created_at: string
}
