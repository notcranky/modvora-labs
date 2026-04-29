import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySession, COOKIE_NAME } from '@/lib/session'
import { supabaseServer } from '@/lib/supabase-server'

// GET /api/profile - Get current user's profile
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifySession(token) : null

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const { data, error } = await supabaseServer
    .from('user_profiles')
    .select('*')
    .eq('email', user.email)
    .single()

  if (error && error.code !== 'PGRST116') {
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

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (!supabaseServer) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const body = await req.json()
  const { name, handle, bio, photo_url, horsepower_wh, horsepower_crank } = body

  // Get user id from auth.users by email
  const { data: authUser } = await supabaseServer
    .from('auth.users')
    .select('id')
    .eq('email', user.email)
    .single()

  // Use upsert to create or update
  const { data, error } = await supabaseServer
    .from('user_profiles')
    .upsert({
      email: user.email,
      name: name ?? user.name,
      handle: handle || null,
      bio: bio || null,
      photo_url: photo_url || null,
      horsepower_wh: horsepower_wh || null,
      horsepower_crank: horsepower_crank || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Handle already taken' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
