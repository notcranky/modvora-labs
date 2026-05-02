'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/dashboard'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Sign up failed')
        setLoading(false)
        return
      }

      // Success - redirect to dashboard
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
          <h1 className="text-white text-2xl font-black mb-2">Create Account</h1>
          <p className="text-zinc-500 text-sm">Start tracking your build today</p>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1.5">
                Name (optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#0f0f12] border border-[#2a2a30] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              />
            </div>

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
                  minLength={6}
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
              <p className="text-zinc-600 text-xs mt-1">Must be at least 6 characters</p>
            </div>

            <div>
              <label className="block text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[#0f0f12] border border-[#2a2a30] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              />
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
                  Creating account...
                </>
              ) : (
                'Create Account →'
              )}
            </button>
          </form>
        </div>

        {/* Sign in link */}
        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-sm">
            Already have an account?{' '}
            <Link
              href="/signin"
              className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              Sign in →
            </Link>
          </p>
        </div>

        <p className="text-center text-zinc-700 text-xs mt-6">
          <Link href="/" className="hover:text-zinc-500 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
