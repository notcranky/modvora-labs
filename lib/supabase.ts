import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export const supabase = createClient(url, key)
export const supabaseEnabled = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Database types for social features
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
