'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { SessionUser } from '@/lib/session'
import { signOut } from '@/hooks/useAuth'

// Marketing links shown to logged-out users
const marketingLinks = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/faq', label: 'FAQ' },
]

// Core links for logged-in users
const coreLinks = [
  { href: '/dashboard', label: 'My Build' },
  { href: '/community', label: 'Community' },
  { href: '/community/trending', label: '🔥 Trending' },
  { href: '/community/leaderboard', label: '🏆 Leaderboard' },
  { href: '/dashboard/mod-laws', label: 'Mod Laws' },
]

// Extra links shown in "More" menu for logged-in users
const moreLinks = [
  { href: '/services', label: 'Services' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/faq', label: 'FAQ' },
  { href: '/', label: 'Home' },
]

export default function Navbar({ initialUser = null }: { initialUser?: SessionUser | null }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const moreRef = useRef<HTMLDivElement | null>(null)
  const user = initialUser

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  useEffect(() => {
    setIsOpen(false)
    setProfileOpen(false)
  }, [pathname])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (!moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false)
      }
    }

    if (profileOpen || moreOpen) {
      document.addEventListener('mousedown', handlePointerDown)
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [profileOpen, moreOpen])

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setProfileOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const isOwner = user?.role === 'owner'
  const isAdmin = user?.role === 'admin'
  const isStaff = isOwner || isAdmin
  const isCustomer = user?.role === 'customer'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#121212]/95 backdrop-blur-xl border-b border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/favicon-logo.png" alt="Modvora" width={677} height={369} className="h-9 w-auto shrink-0" />
          <span className="font-semibold text-white text-lg tracking-tight hidden sm:inline">
            Modvora <span className="text-purple-400">Labs</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {user ? (
            // Logged-in navigation
            <>
              {coreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`relative text-sm transition-colors duration-150 pb-0.5 ${isActive(link.href) ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute -bottom-[19px] left-0 right-0 h-px bg-purple-500" />
                  )}
                </Link>
              ))}
              {/* More dropdown for logged-in users */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  More ▾
                </button>
                {moreOpen && (
                  <div className="absolute top-full right-0 mt-2 w-40 rounded-xl border border-[#2a2a35] bg-[#18181f] py-2 shadow-xl">
                    {moreLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-[#23232a] transition-colors"
                        onClick={() => setMoreOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {isStaff && (
                <Link
                  href="/admin"
                  aria-current={isActive('/admin') ? 'page' : undefined}
                  className={`text-sm transition-colors font-medium ${isActive('/admin') ? 'text-purple-300' : 'text-purple-400 hover:text-purple-300'}`}
                >
                  {isOwner ? 'Owner ⚡' : 'Admin ⚡'}
                </Link>
              )}
            </>
          ) : (
            // Logged-out navigation (marketing)
            <>
              {marketingLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`relative text-sm transition-colors duration-150 pb-0.5 ${isActive(link.href) ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute -bottom-[19px] left-0 right-0 h-px bg-purple-500" />
                  )}
                </Link>
              ))}
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user && (
            <Link
              href="/community/me"
              aria-label="My profile"
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${isActive('/community/me') ? 'border-purple-500/50 bg-purple-500/10 text-purple-300' : 'border-[#2a2a35] bg-[#18181f] text-zinc-400 hover:border-purple-500/40 hover:text-white'}`}
            >
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current" strokeWidth={1.8}>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </Link>
          )}
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 bg-[#16161a] hover:bg-[#1e1e24] border border-[#2a2a30] hover:border-purple-500/30 rounded-xl px-3 py-2 transition-all"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isStaff ? 'bg-purple-600 text-white' : 'bg-zinc-700 text-zinc-200'}`}>
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <span className="text-white text-sm font-medium">
                  {isOwner ? 'Owner' : isAdmin ? 'Admin' : 'My Account'}
                </span>
                {isOwner && <span className="text-[10px] bg-purple-600/30 text-purple-300 px-1.5 py-0.5 rounded-full font-bold">OWNER</span>}
                {isAdmin && <span className="text-[10px] bg-purple-600/30 text-purple-300 px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>}
                <svg className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#16161a] border border-[#2a2a30] rounded-xl shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#2a2a30]">
                    <p className="text-white text-sm font-medium truncate">{user.email}</p>
                    <p className="text-zinc-500 text-xs capitalize">{user.role} account</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-[#1e1e24] transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <span>🏎️</span> My Build Plan
                    </Link>
                    <Link
                      href="/dashboard/publish"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-[#1e1e24] transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <span>📸</span> Publish Build
                    </Link>
                    {isStaff && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-400 hover:text-purple-300 hover:bg-[#1e1e24] transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        <span>⚡</span> {isOwner ? 'Owner Panel' : 'Admin Panel'}
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        signOut()
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-400 hover:text-red-400 hover:bg-[#1e1e24] transition-colors"
                    >
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors px-3 py-2"
              >
                Sign Up
              </Link>
              <Link
                href="/intake"
                className="bg-purple-600 hover:bg-purple-500 active:scale-[0.97] hover:scale-[1.02] text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all duration-150 shadow-sm shadow-purple-900/30"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-zinc-400 hover:text-white"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
          aria-controls="mobile-nav"
        >
          {isOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {isOpen && (
        <div id="mobile-nav" className="md:hidden border-t border-white/[0.04] bg-[#121212] px-6 py-4 flex max-h-[calc(100vh-4rem)] flex-col gap-4 overflow-y-auto">
          {user ? (
            // Logged-in mobile menu
            <>
              {coreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`text-sm transition-colors ${isActive(link.href) ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-[#2a2a30] pt-2 mt-2">
                <p className="text-xs text-zinc-600 uppercase tracking-wider mb-2">More</p>
                {moreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-zinc-500 hover:text-white transition-colors py-1"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <Link
                href="/community/me"
                aria-current={isActive('/community/me') ? 'page' : undefined}
                className={`text-sm transition-colors ${isActive('/community/me') ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
                onClick={() => setIsOpen(false)}
              >
                My Profile
              </Link>
            </>
          ) : (
            // Logged-out mobile menu
            <>
              {marketingLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={`text-sm transition-colors ${isActive(link.href) ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </>
          )}
          {isStaff && (
            <Link href="/admin" className="text-sm text-purple-400 font-medium" onClick={() => setIsOpen(false)}>
              ⚡ {isOwner ? 'Owner Panel' : 'Admin Panel'}
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/dashboard"
                aria-current={isActive('/dashboard') ? 'page' : undefined}
                className={`text-sm transition-colors ${isActive('/dashboard') ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
                onClick={() => setIsOpen(false)}
              >
                🏎️ My Build Plan
              </Link>
              <Link
                href="/dashboard/publish"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                📸 Publish Build
              </Link>
              {/* Prominent Sign Out at bottom of mobile menu */}
              <div className="mt-4 pt-4 border-t border-[#2a2a30]">
                <button
                  onClick={() => signOut()}
                  className="w-full text-left text-sm font-semibold text-red-400 hover:text-red-300 flex items-center gap-2 py-2"
                >
                  <span>🚪</span> Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/signin" className="text-sm text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>
                Sign In
              </Link>
              <Link
                href="/intake"
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg text-center transition-all"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
      {/* ── Floating bottom nav — mobile only ──────────────────────────── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 nav-enter px-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-around rounded-2xl border border-white/[0.06] bg-[#161618]/95 backdrop-blur-xl px-1 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {(user ? [
            {
              href: '/',
              label: 'Home',
              icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
            },
            {
              href: '/community',
              label: 'Community',
              icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
            },
            {
              href: '/dashboard',
              label: 'My Build',
              icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>,
            },
            {
              href: '/community/me',
              label: 'Profile',
              icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="8" r="4" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
            },
            {
              isSignOut: true,
              label: 'Sign Out',
              icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>,
            },
          ] : [
            {
              href: '/',
              label: 'Home',
              icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
            },
            {
              href: '/community',
              label: 'Community',
              icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
            },
            {
              href: '/dashboard',
              label: 'My Build',
              icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>,
            },
            {
              href: '/signin',
              label: 'Sign In',
              icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>,
            },
          ]).map((item: any) => {
            if (item.isSignOut) {
              return (
                <button
                  key="signout"
                  onClick={() => signOut()}
                  className="flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-all active:scale-[0.94] text-red-400 hover:text-red-300"
                >
                  <span>{item.icon}</span>
                  <span className="text-[10px] font-medium leading-none">{item.label}</span>
                </button>
              )
            }
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 transition-all active:scale-[0.94] ${
                  active ? 'text-white bg-white/[0.06]' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <span className={active ? 'text-[#A020F0]' : ''}>{item.icon}</span>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
