import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ supabaseUserId: null })

  const user = await verifySession(token)
  if (!user) return NextResponse.json({ supabaseUserId: null })

  // Use email as a stable cross-device identifier that bridges the
  // custom session cookie to Supabase-stored likes/saves
  return NextResponse.json({ supabaseUserId: user.email })
}
