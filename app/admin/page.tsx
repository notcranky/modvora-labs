import { cookies } from 'next/headers'
import { verifySession, COOKIE_NAME } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Admin Panel | Modvora Labs' }

export default async function AdminPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const user = token ? await verifySession(token) : null

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) redirect('/signin?from=/admin')

  return (
    <div className="min-h-screen bg-[#0a0a0b] pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-purple-600/20 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Admin
            </span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs">Logged in as {user.email}</span>
          </div>
          <h1 className="text-white text-3xl font-black mb-2">Admin Panel</h1>
          <p className="text-zinc-500">Full control. Only your account can see this page.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Visitors', value: '—', note: 'Connect analytics' },
            { label: 'Intake Submissions', value: '—', note: 'Connect database' },
            { label: 'Paid Orders', value: '—', note: 'Connect Stripe' },
            { label: 'Revenue', value: '$—', note: 'Connect Stripe' },
          ].map((s, i) => (
            <div key={i} className="bg-[#16161a] border border-[#2a2a30] rounded-xl p-4">
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-white text-2xl font-bold">{s.value}</p>
              <p className="text-zinc-600 text-xs mt-0.5">{s.note}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <Link href="/dashboard" className="bg-[#16161a] hover:bg-[#1e1e24] border border-[#2a2a30] hover:border-purple-500/30 rounded-xl p-5 transition-all group">
            <div className="text-2xl mb-2">🚗</div>
            <h3 className="text-white font-bold mb-1">View Dashboard</h3>
            <p className="text-zinc-500 text-sm">See the parts recommendation page</p>
          </Link>
          <Link href="/intake" className="bg-[#16161a] hover:bg-[#1e1e24] border border-[#2a2a30] hover:border-purple-500/30 rounded-xl p-5 transition-all group">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="text-white font-bold mb-1">Intake Form</h3>
            <p className="text-zinc-500 text-sm">View the customer vehicle form</p>
          </Link>
          <Link href="/services" className="bg-[#16161a] hover:bg-[#1e1e24] border border-[#2a2a30] hover:border-purple-500/30 rounded-xl p-5 transition-all group">
            <div className="text-2xl mb-2">💼</div>
            <h3 className="text-white font-bold mb-1">Services</h3>
            <p className="text-zinc-500 text-sm">Manage service plans & pricing</p>
          </Link>
        </div>

        {/* Add customer accounts */}
        <div className="bg-[#16161a] border border-[#2a2a30] rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-2">Customer Account Management</h2>
          <p className="text-zinc-400 text-sm mb-4">
            To grant a customer access after payment, add their email and password to your <code className="bg-[#0f0f12] text-purple-300 px-1.5 py-0.5 rounded text-xs">.env.local</code> file:
          </p>
          <div className="bg-[#0f0f12] border border-[#2a2a30] rounded-xl p-4 font-mono text-sm">
            <p className="text-zinc-500 text-xs mb-2"># .env.local</p>
            <p className="text-green-400">PAID_EMAILS=customer1@email.com,customer2@email.com</p>
            <p className="text-green-400">PAID_PASSWORDS=pass1,pass2</p>
          </div>
          <p className="text-zinc-500 text-xs mt-3">
            Each index maps to the same index in PAID_PASSWORDS. Restart the server after changes.
            When Stripe is integrated, this will be automatic.
          </p>
        </div>

        {/* Next steps */}
        <div className="bg-[#16161a] border border-purple-500/20 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-4">Next Steps to Complete</h2>
          <div className="space-y-3">
            {[
              { done: true, label: 'Auth system built — only you can access admin', detail: 'Complete ✅' },
              { done: true, label: 'Dashboard with parts + retailer links', detail: 'Complete ✅' },
              { done: true, label: 'Car visualizer', detail: 'Complete ✅' },
              { done: false, label: 'Connect Stripe for real payments', detail: 'Run: npm install @stripe/stripe-js stripe' },
              { done: false, label: 'Connect database (Supabase/Prisma) to store submissions', detail: 'For storing intake forms + orders' },
              { done: false, label: 'Auto-grant access after Stripe payment', detail: 'Webhook → write to DB → allow login' },
              { done: false, label: 'Deploy to Vercel', detail: 'vercel.com → import GitHub repo' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.done ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-600'}`}>
                  {item.done ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <span className="text-xs">○</span>
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${item.done ? 'text-white' : 'text-zinc-400'}`}>{item.label}</p>
                  <p className="text-zinc-600 text-xs">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
