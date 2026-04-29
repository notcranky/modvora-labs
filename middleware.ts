import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/lib/session'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/checkout',
  '/community/me',
]

// Routes that require admin/owner role
const ADMIN_ROUTES = ['/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? await verifySession(token) : null

  // Check if this is a protected route (including sub-paths)
  const isProtected = PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
  const isAdminRoute = ADMIN_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )

  // ── Protect admin routes — requires owner/admin role ──
  if (isAdminRoute) {
    if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
      const url = req.nextUrl.clone()
      url.pathname = '/signin'
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
  }

  // ── Protect regular auth routes ──
  if (isProtected && !user) {
    const url = req.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/checkout',
    '/community/me',
  ],
}
