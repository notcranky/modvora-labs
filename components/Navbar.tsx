'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { SessionUser } from '@/lib/session'
import { signOut } from '@/hooks/useAuth'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/community', label: 'Community' },
  { href: '/dashboard/mod-laws', label: 'Mod Law Map' },
  { href: '/services', label: 'Services' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/faq', label: 'FAQ' },
]

export default function Navbar({ initialUser = null }: { initialUser?: SessionUser | null }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement | null>(null)
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
    }

    if (profileOpen) {
      document.addEventListener('mousedown', handlePointerDown)
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [profileOpen])

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0b]/90 backdrop-blur-md border-b border-[#2a2a30]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-semibold text-white text-lg tracking-tight">
            Modvora <span className="text-purple-400">Labs</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`text-sm transition-colors duration-150 ${isActive(link.href) ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              {link.label}
            </Link>
          ))}
          {isStaff && (
            <Link
              href="/admin"
              aria-current={isActive('/admin') ? 'page' : undefined}
              className={`text-sm transition-colors font-medium ${isActive('/admin') ? 'text-purple-300' : 'text-purple-400 hover:text-purple-300'}`}
            >
              {isOwner ? 'Owner ⚡' : 'Admin ⚡'}
            </Link>
          )}
          {(isStaff || isCustomer) && (
            <Link
              href="/dashboard"
              aria-current={isActive('/dashboard') ? 'page' : undefined}
              className={`text-sm transition-colors duration-150 ${isActive('/dashboard') ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              My Build
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
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
                className="text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/intake"
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-all duration-150 purple-glow-sm"
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
        <div id="mobile-nav" className="md:hidden border-t border-[#2a2a30] bg-[#111113] px-6 py-4 flex max-h-[calc(100vh-4rem)] flex-col gap-4 overflow-y-auto">
          {navLinks.map((link) => (
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
              <button
                onClick={() => {
                  setIsOpen(false)
                  signOut()
                }}
                className="text-left text-sm text-red-400 hover:text-red-300"
              >
                🚪 Sign Out
              </button>
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
    </nav>
  )
}
