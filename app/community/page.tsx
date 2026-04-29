'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import CommunityGallery from '@/components/CommunityGallery'

const navItems = [
  { href: '/community', label: 'Feed', icon: '🏠' },
  { href: '/community/trending', label: 'Trending', icon: '🔥' },
  { href: '/community/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { href: '/community/explore', label: 'Explore', icon: '🔍' },
]

export default function CommunityPage() {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Community Navigation */}
      <div className="sticky top-0 z-30 bg-[#0a0a0b]/95 backdrop-blur-xl border-b border-[#1e1e24]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 py-3 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                    ${isActive 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                      : 'text-zinc-400 hover:text-white hover:bg-[#1a1a20]'
                    }
                  `}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <CommunityGallery />
    </div>
  )
}
