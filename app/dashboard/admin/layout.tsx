'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { id: 'botw', label: '🏆 Build of Week', href: '/dashboard/admin/botw' },
  { id: 'moderation', label: '🛡️ Moderation', href: '/dashboard/admin/moderation' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const activeTab = tabs.find(t => pathname.includes(t.id))?.id || 'botw'

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0b]/95 backdrop-blur-md border-b border-[#1e1e24]">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center text-xl">
              ⚙️
            </div>
            <div>
              <h1 className="font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-zinc-500">Modvora Labs Management</p>
            </div>
          </div>
          
          <Link 
            href="/dashboard" 
            className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white border border-[#1e1e24] hover:border-purple-500/40 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 px-6 pb-3 max-w-7xl mx-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  )
}
