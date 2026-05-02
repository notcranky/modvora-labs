'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function SignInForm() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Sign in failed')
        setLoading(false)
        return
      }

      // Hard redirect so the server layout re-renders against the fresh auth cookie.
      window.location.replace(from)
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-4 py-20">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
              M
            </div>
            <span className="text-white font-bold text-xl">Modvora <span className="text-purple-400">Labs</span></span>
          </Link>
          <h1 className="text-white text-2xl font-black mb-2">Sign In</h1>
          <p className="text-zinc-500 text-sm">Access your custom build plan</p>
        </div>

        {/* Card */}
        <div className="bg-[#16161a] border border-[#2a2a30] rounded-2xl p-8">

          {/* Error message */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
              <span className="text-red-400 text-sm">⚠</span>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {from !== '/dashboard' && (
            <div className="mb-5 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <p className="text-purple-300 text-sm">Sign in to access your content.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full bg-[#0f0f12] border border-[#2a2a30] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0f0f12] border border-[#2a2a30] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all mt-2 ${
                loading
                  ? 'bg-purple-600/50 text-white/50 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>
        </div>

        {/* Sign up & forgot password */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <Link
            href="/signup"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Create account →
          </Link>
          <Link
            href="/reset-password"
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* No account? */}
        <div className="mt-4 text-center">
          <p className="text-zinc-500 text-sm mb-3">Don&apos;t have access yet?</p>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 border border-purple-500/30 hover:border-purple-500/60 bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 hover:text-purple-200 px-6 py-3 rounded-xl text-sm font-medium transition-all"
          >
            View Plans & Get Access →
          </Link>
        </div>

        <p className="text-center text-zinc-700 text-xs mt-6">
          <Link href="/" className="hover:text-zinc-500 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
