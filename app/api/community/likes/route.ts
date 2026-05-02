import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseEnabled } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/community/likes?userId=xxx
// Returns likes and saves for a given user from Supabase.
// If Supabase is unavailable, returns empty objects so localStorage stays intact.
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId || !supabaseEnabled) {
    return NextResponse.json({ likesObj: {}, savesObj: {} })
  }

  try {
    const [{ data: likesData }, { data: savesData }] = await Promise.all([
      supabase.from('post_likes').select('post_id').eq('user_id', userId),
      supabase.from('post_saves').select('post_id').eq('user_id', userId),
    ])

    const likesObj: Record<string, boolean> = {}
    const savesObj: Record<string, boolean> = {}

    for (const row of likesData ?? []) likesObj[row.post_id] = true
    for (const row of savesData ?? []) savesObj[row.post_id] = true

    return NextResponse.json({ likesObj, savesObj })
  } catch {
    return NextResponse.json({ likesObj: {}, savesObj: {} })
  }
}
