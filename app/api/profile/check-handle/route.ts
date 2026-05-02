import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { validateHandle } from '@/lib/profiles'

// GET /api/profile/check-handle?handle=username
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const handle = searchParams.get('handle')?.toLowerCase().trim()

  if (!handle) {
    return NextResponse.json({ error: 'Handle required' }, { status: 400 })
  }

  // Validate format first
  const validation = validateHandle(handle)
  if (!validation.valid) {
    return NextResponse.json({ available: false, error: validation.error })
  }

  if (!supabaseServer) {
    return NextResponse.json({ available: true }) // Default to available if DB down
  }

  const { data, error } = await supabaseServer
    .from('user_profiles')
    .select('id')
    .eq('handle', handle)
    .maybeSingle()

  if (error) {
    console.error('[check-handle] DB error:', error)
    return NextResponse.json({ available: true }) // Fail open
  }

  return NextResponse.json({ available: !data })
}
