import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession, COOKIE_NAME } from '@/lib/session'
import { supabaseServer } from '@/lib/supabase-server'
import { validateHandle } from '@/lib/profiles'

// GET /api/profile - Get current user's profile
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifySession(token) : null

  console.log('[profile GET] Token:', token?.slice(0, 20) + '...')
  console.log('[profile GET] User:', user)

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  // Try to get profile by email
  const { data, error } = await supabaseServer
    .from('user_profiles')
    .select('*')
    .eq('email', user.email)
    .maybeSingle()

  console.log('[profile GET] DB query result:', { data, error })

  if (error) {
    console.error('[profile GET] DB error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Return profile or default
  return NextResponse.json({
    profile: data || {
      email: user.email,
      name: user.name,
      handle: null,
      bio: null,
      photo_url: null,
      horsepower_wh: null,
      horsepower_crank: null,
    }
  })
}

// PATCH /api/profile - Update current user's profile
export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifySession(token) : null

  console.log('[profile PATCH] Token:', token?.slice(0, 20) + '...')
  console.log('[profile PATCH] User:', user)

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const body = await req.json()
  const { name, handle, bio, photo_url, horsepower_wh, horsepower_crank } = body
  console.log('[profile PATCH] Body:', body)

  // Validate handle if provided
  if (handle) {
    const handleClean = handle.toLowerCase().trim().replace(/^@/, '')
    const validation = validateHandle(handleClean)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    
    // Check if handle is taken by someone else
    const { data: existingHandle } = await supabaseServer
      .from('user_profiles')
      .select('email')
      .eq('handle', handleClean)
      .neq('email', user.email)  // Exclude current user
      .maybeSingle()
    
    if (existingHandle) {
      return NextResponse.json({ error: `@${handleClean} is already taken` }, { status: 409 })
    }
  }

  // First, try to get existing profile
  const { data: existing } = await supabaseServer
    .from('user_profiles')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  let result

  if (existing) {
    // Update existing
    result = await supabaseServer
      .from('user_profiles')
      .update({
        name: name ?? user.name,
        handle: handle || null,
        bio: bio || null,
        photo_url: photo_url || null,
        horsepower_wh: horsepower_wh || null,
        horsepower_crank: horsepower_crank || null,
        updated_at: new Date().toISOString(),
      })
      .eq('email', user.email)
      .select()
      .single()
  } else {
    // Insert new (id will be generated, not linked to auth.users for now)
    result = await supabaseServer
      .from('user_profiles')
      .insert({
        email: user.email,
        name: name ?? user.name,
        handle: handle || null,
        bio: bio || null,
        photo_url: photo_url || null,
        horsepower_wh: horsepower_wh || null,
        horsepower_crank: horsepower_crank || null,
      })
      .select()
      .single()
  }

  if (result.error) {
    if (result.error.code === '23505') {
      return NextResponse.json({ error: 'Handle already taken' }, { status: 409 })
    }
    console.error('[profile PATCH] DB error:', result.error)
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: result.data })
}
