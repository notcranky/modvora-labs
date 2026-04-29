import { NextRequest, NextResponse } from 'next/server'
import { createSession, COOKIE_NAME } from '@/lib/session'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // ── Owner check (env-based, for admin access) ───────────────────────────
    const ownerEmail = (process.env.OWNER_EMAIL ?? 'Jacksonjfontes@gmail.com').trim().toLowerCase()
    const ownerPassword = (process.env.OWNER_PASSWORD ?? '').trim()

    if (normalizedEmail === ownerEmail && password.trim() === ownerPassword) {
      const token = await createSession({ email, name: 'Owner', role: 'owner' })
      const res = NextResponse.json({ success: true, role: 'owner' })
      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
      return res
    }

    // ── Admin check (env-based) ─────────────────────────────────────────────
    const adminEmail = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase()
    const adminPassword = (process.env.ADMIN_PASSWORD ?? '').trim()

    if (adminEmail && normalizedEmail === adminEmail && password.trim() === adminPassword) {
      const token = await createSession({ email, name: 'Admin', role: 'admin' })
      const res = NextResponse.json({ success: true, role: 'admin' })
      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
      return res
    }

    // ── Demo account ────────────────────────────────────────────────────────
    if (normalizedEmail === 'demo@modvora.com' && password.trim() === 'demo') {
      const token = await createSession({ email: 'demo@modvora.com', name: 'Demo User', role: 'customer' })
      const res = NextResponse.json({ success: true, role: 'customer', demo: true })
      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
      return res
    }

    // ── Supabase Auth (regular users) ─────────────────────────────────────
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    try {
      const { data: signInData, error: signInError } = await supabaseServer.auth.signInWithPassword({
        email: normalizedEmail,
        password: password.trim(),
      })

      if (signInError) {
        console.log('[signin] Supabase auth failed:', signInError.message)
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        )
      }

      if (!signInData.user) {
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        )
      }

      // Get user metadata
      const userName = signInData.user.user_metadata?.name || signInData.user.email?.split('@')[0] || 'User'

      const token = await createSession({
        email: signInData.user.email!,
        name: userName,
        role: 'customer',
        id: signInData.user.id,
      })

      const res = NextResponse.json({
        success: true,
        role: 'customer',
        user: {
          email: signInData.user.email,
          name: userName,
        },
      })

      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })

      return res
    } catch (error) {
      console.error('[signin] Supabase error:', error)
      return NextResponse.json(
        { error: 'Authentication failed. Please try again.' },
        { status: 500 }
      )
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
