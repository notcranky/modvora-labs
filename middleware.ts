import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/session'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? await verifySession(token) : null

  // ── Protect /admin — requires owner/admin role ──
  if (pathname.startsWith('/admin')) {
    if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
      const url = req.nextUrl.clone()
      url.pathname = '/signin'
      url.searchParams.set('from', '/admin')
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
