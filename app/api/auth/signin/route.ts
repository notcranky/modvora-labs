import { NextRequest, NextResponse } from 'next/server'
import { createSession, COOKIE_NAME } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // ── Owner check ──────────────────────────────────────────
    const normalizedEmail = email.trim().toLowerCase()
    const ownerEmail = (process.env.OWNER_EMAIL ?? 'Jacksonjfontes@gmail.com').trim().toLowerCase()
    const ownerPassword = (process.env.OWNER_PASSWORD ?? process.env.ADMIN_PASSWORD ?? '').trim()

    console.log('[signin] attempt:', email, '| owner enabled:', !!ownerPassword)

    if (normalizedEmail === ownerEmail && password.trim() === ownerPassword) {
      const token = await createSession({ email, name: 'Owner', role: 'owner' })
      const res = NextResponse.json({ success: true, role: 'owner' })
      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      return res
    }

    // ── Admin check ──────────────────────────────────────────
    const adminEmail = (process.env.ADMIN_EMAIL ?? '').trim()
    const adminPassword = (process.env.ADMIN_PASSWORD ?? '').trim()

    if (adminEmail && normalizedEmail === adminEmail.toLowerCase() && password.trim() === adminPassword) {
      const token = await createSession({ email, name: 'Admin', role: 'admin' })
      const res = NextResponse.json({ success: true, role: 'admin' })
      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      return res
    }

    // ── Demo / guest bypass ──────────────────────────────────────────────────
    if (normalizedEmail === 'demo@modvora.com' && password.trim() === 'demo') {
      const token = await createSession({ email: 'demo@modvora.com', name: 'Demo User', role: 'customer' })
      const res = NextResponse.json({ success: true, role: 'customer', demo: true })
      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      })
      return res
    }

    // ── Customer check (paid users stored in env as comma-separated emails) ──
    const paidEmails = (process.env.PAID_EMAILS ?? '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)

    const paidPasswords = (process.env.PAID_PASSWORDS ?? '')
      .split(',')
      .map(p => p.trim())

    const customerIndex = paidEmails.indexOf(email.toLowerCase())
    const customerPassword = paidPasswords[customerIndex]

    if (customerIndex !== -1 && password === customerPassword) {
      const token = await createSession({ email, name: 'Customer', role: 'customer' })
      const res = NextResponse.json({ success: true, role: 'customer' })
      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
      return res
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
