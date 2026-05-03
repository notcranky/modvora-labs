'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/community',             label: 'Feed',        icon: '🏠' },
  { href: '/community/trending',    label: 'Trending',    icon: '🔥' },
  { href: '/community/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/community/explore',     label: 'Explore',     icon: '🔍' },
]

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Spacer so content clears the fixed main Navbar (h-16 = 64 px) */}
      <div className="h-16" aria-hidden="true" />

      {/* Community-wide nav — sticks just below the main Navbar */}
      <nav className="sticky top-16 z-40 h-12 flex items-center bg-[#0a0a0b]/95 backdrop-blur-xl border-b border-[#1e1e24]">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              // Feed is active for /community and /community/me etc but NOT sub-pages
              const isActive =
                item.href === '/community'
                  ? pathname === '/community'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
                      : 'text-zinc-400 hover:text-white hover:bg-[#1a1a20]'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {children}
    </div>
  )
}
